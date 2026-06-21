import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthProvider,
  type User,
} from "firebase/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthForm } from "@/components/auth/AuthForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import {
  appendEmailProvider,
  createSocialUserDoc,
  findEmailProviders,
  findUserDocByEmail,
  findUserDocByPhone,
  hasEnabledSelfEmail,
  hasEnabledVerifiedPhone,
  markEmailProviderUsed,
  markPhoneAndSelfEmailUsed,
  normalizeEmail,
  normalizePhone,
  primarySelfEmailForPhoneLogin,
  providerLabel,
  resolveStoreUser,
  syncProviderProfileFields,
  type SocialEmailProvider,
} from "@/lib/firestore-user";

type SocialProvider = SocialEmailProvider;

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);
  const [verificationUser, setVerificationUser] = useState<User | null>(null);

  const finishAuth = useCallback(
    async (user: User) => {
      const [storeData, token] = await Promise.all([resolveStoreUser(user), user.getIdToken()]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(t("auth.welcomeBack", { name: storeData.user.name.split(" ")[0] }));
      navigate({ to: "/" });
    },
    [navigate, setToken, setUser, t],
  );

  async function handleLogin({
    identifier,
    method,
    password,
  }: {
    identifier: string;
    method: "email" | "phone";
    password: string;
  }) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }

      if (method === "phone") {
        await handlePhoneLogin(identifier, password);
        return;
      }

      const email = normalizeEmail(identifier);
      const existing = await findUserDocByEmail(email);
      if (!existing) {
        toast.error("No account found with this email.");
        return;
      }
      if (!hasEnabledSelfEmail(existing.data, email)) {
        const providers = findEmailProviders(existing.data, email)
          .filter((entry) => entry.provider !== "self")
          .map((entry) => providerLabel(entry.provider));
        toast.error(
          `This email is registered with ${providers.join("/") || "a social provider"}. Please continue with that provider.`,
        );
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => {});
        setVerificationUser(credential.user);
        return;
      }
      await markEmailProviderUsed(existing, email, "self");
      await finishAuth(credential.user);
    } catch (err) {
      console.error("[login] email/password error:", err);
      toast.error(firebaseAuthMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhoneLogin(phoneInput: string, password: string) {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const phone = normalizePhone(phoneInput);
    const existing = await findUserDocByPhone(phone);
    if (!existing || !hasEnabledVerifiedPhone(existing.data, phone)) {
      toast.error("No verified login-enabled account found with this phone number.");
      return;
    }
    const primaryEmail = primarySelfEmailForPhoneLogin(existing.data);
    if (!primaryEmail) {
      toast.error("This phone number is not attached to an email/password login.");
      return;
    }
    const credential = await signInWithEmailAndPassword(auth, primaryEmail, password);
    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user).catch(() => {});
      setVerificationUser(credential.user);
      return;
    }
    await markPhoneAndSelfEmailUsed(existing, phone, primaryEmail);
    await finishAuth(credential.user);
  }

  async function handleVerifiedLogin(user: User) {
    setVerificationUser(null);
    if (user.email) {
      const existing = await findUserDocByEmail(user.email);
      if (existing) await markEmailProviderUsed(existing, user.email, "self");
    }
    await finishAuth(user);
  }

  async function handleSocial(provider: SocialProvider) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }
      const credential = await signInWithPopup(auth, firebaseProvider(provider));
      const email = credential.user.email ? normalizeEmail(credential.user.email) : null;
      if (!email) {
        toast.error(`${providerLabel(provider)} did not return an email address.`);
        return;
      }
      const existing = await findUserDocByEmail(email);
      if (!existing) {
        await createSocialUserDoc(credential.user, provider);
      } else {
        await syncProviderProfileFields(existing, credential.user, provider);
        await appendEmailProvider(existing, email, provider);
      }
      await finishAuth(credential.user);
    } catch (err) {
      toast.error(firebaseAuthMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSub")}</p>
      </div>
      <AuthForm onSubmit={handleLogin} submitting={submitting} />
      <p className="text-center text-xs text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link to="/auth/signup" className="font-medium text-primary hover:underline">
          {t("common.signup")}
        </Link>
      </p>
      <Divider />
      <SocialButtons onProvider={handleSocial} disabled={submitting} mode="login" />
      <EmailVerificationModal
        open={!!verificationUser}
        user={verificationUser}
        onVerified={handleVerifiedLogin}
        deleteUserOnCancel={false}
        onCancel={async () => {
          setVerificationUser(null);
          toast.error("Email is not verified yet.");
        }}
      />
    </div>
  );
}

function firebaseProvider(provider: SocialProvider): AuthProvider {
  if (provider === "google") return new GoogleAuthProvider();
  if (provider === "facebook") {
    const facebook = new FacebookAuthProvider();
    facebook.addScope("email");
    return facebook;
  }
  const apple = new OAuthProvider("apple.com");
  apple.addScope("email");
  apple.addScope("name");
  return apple;
}

function firebaseAuthMessage(
  err: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  )
    return t("auth.errors.invalidCredentials");
  if (code === "auth/user-disabled") return t("auth.errors.disabled");
  if (code === "auth/too-many-requests") return t("auth.errors.tooMany");
  if (code === "auth/network-request-failed") return t("auth.errors.network");
  if (code === "auth/popup-closed-by-user") return t("auth.errors.popupClosed");
  if (code === "auth/popup-blocked") return t("auth.errors.popupBlocked");
  if (code === "auth/account-exists-with-different-credential")
    return t("auth.errors.differentCredential");
  if (code === "auth/unauthorized-domain") return t("auth.errors.unauthorizedDomain");
  return code ? t("auth.errors.loginFailedCode", { code }) : t("auth.errors.loginFailed");
}

function Divider() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>{t("auth.or")}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
