import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type AuthProvider,
  type User,
} from "firebase/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SignupForm, type SignupValues } from "@/components/auth/SignupForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import {
  appendEmailProvider,
  createEmailPasswordUserDoc,
  createSocialUserDoc,
  findEmailProviders,
  findUserDocByEmail,
  normalizeEmail,
  providerLabel,
  resolveStoreUser,
  syncProviderProfileFields,
  type SocialEmailProvider,
} from "@/lib/firestore-user";

type SocialProvider = SocialEmailProvider;
const PENDING_LINK_EMAIL_KEY = "homebee:pending-email-password-link-email";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

interface PendingEmailPasswordLink {
  email: string;
  password: string;
  provider: SocialProvider;
}

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const clearAuth = useAuthStore((s) => s.signOut);
  const [submitting, setSubmitting] = useState(false);
  const [verificationUser, setVerificationUser] = useState<User | null>(null);
  const [pendingLink, setPendingLink] = useState<PendingEmailPasswordLink | null>(null);
  const [providerMismatch, setProviderMismatch] = useState<string | null>(null);

  const finishAuth = useCallback(
    async (user: User, message: string) => {
      const [storeData, token] = await Promise.all([resolveStoreUser(user), user.getIdToken()]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(message);
      toast.info("Please update your profile details.");
      navigate({ to: "/" });
    },
    [navigate, setToken, setUser],
  );

  async function handleSignup({ fullName, email, password }: SignupValues) {
    const normalizedEmail = normalizeEmail(email);
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }

      const existing = await findUserDocByEmail(normalizedEmail);
      if (existing) {
        const providers = findEmailProviders(existing.data, normalizedEmail);
        if (providers.some((entry) => entry.provider === "self")) {
          toast.error("This email is already registered. Please login instead.");
          return;
        }
        const socialProvider = providers.find((entry) => entry.provider !== "self")?.provider as
          | SocialProvider
          | undefined;
        if (socialProvider) {
          setPendingLink({ email: normalizedEmail, password, provider: socialProvider });
          setProviderMismatch(null);
          return;
        }
      }

      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (fullName) await updateProfile(credential.user, { displayName: fullName });
      await sendEmailVerification(credential.user);
      setVerificationUser(credential.user);
      toast.success("Verification email sent.");
    } catch (err) {
      toast.error(signupErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifiedSignup(user: User) {
    await createEmailPasswordUserDoc(user);
    setVerificationUser(null);
    await finishAuth(
      user,
      t("auth.welcomeSignup", { name: user.displayName?.split(" ")[0] ?? "there" }),
    );
  }

  async function handleVerificationCancel() {
    setVerificationUser(null);
    toast.error("Registration cancelled. Please try again when you are ready.");
  }

  async function handleSocial(provider: SocialProvider) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }
      if (pendingLink && pendingLink.provider !== provider) {
        toast.error(`Please continue with ${providerLabel(pendingLink.provider)} for this email.`);
        return;
      }

      if (pendingLink) sessionStorage.setItem(PENDING_LINK_EMAIL_KEY, pendingLink.email);
      const credential = await signInWithPopup(auth, firebaseProvider(provider));
      const providerEmail = credential.user.email ? normalizeEmail(credential.user.email) : null;
      if (!providerEmail) {
        await rejectPendingProviderLogin(auth);
        toast.error(`${providerLabel(provider)} did not return an email address.`);
        return;
      }

      if (pendingLink) {
        if (providerEmail !== pendingLink.email) {
          await rejectPendingProviderLogin(auth);
          setProviderMismatch(
            `You selected ${providerEmail}. Please choose the ${providerLabel(
              pendingLink.provider,
            )} account for ${pendingLink.email}.`,
          );
          return;
        }
        const existing = await findUserDocByEmail(pendingLink.email);
        if (!existing) {
          await rejectPendingProviderLogin(auth);
          toast.error("Could not find the existing social account.");
          return;
        }
        await linkWithCredential(
          credential.user,
          EmailAuthProvider.credential(pendingLink.email, pendingLink.password),
        ).catch((err) => {
          const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
          if (code !== "auth/provider-already-linked" && code !== "auth/credential-already-in-use")
            throw err;
        });
        await syncProviderProfileFields(existing, credential.user, pendingLink.provider);
        await appendEmailProvider(existing, pendingLink.email, "self");
        sessionStorage.removeItem(PENDING_LINK_EMAIL_KEY);
        setPendingLink(null);
        setProviderMismatch(null);
        await finishAuth(
          credential.user,
          t("auth.welcomeSignup", { name: credential.user.displayName ?? "there" }),
        );
        return;
      }

      const existing = await findUserDocByEmail(providerEmail);
      if (!existing) {
        await createSocialUserDoc(credential.user, provider);
      } else {
        await syncProviderProfileFields(existing, credential.user, provider);
        await appendEmailProvider(existing, providerEmail, provider);
      }
      await finishAuth(
        credential.user,
        t("auth.welcomeSignup", { name: credential.user.displayName ?? "there" }),
      );
    } catch (err) {
      if (pendingLink) {
        sessionStorage.removeItem(PENDING_LINK_EMAIL_KEY);
        clearAuth();
      }
      toast.error(signupErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function rejectPendingProviderLogin(auth: NonNullable<ReturnType<typeof getFirebaseAuth>>) {
    sessionStorage.removeItem(PENDING_LINK_EMAIL_KEY);
    clearAuth();
    await firebaseSignOut(auth).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("auth.signupTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.signupSub")}</p>
      </div>
      {pendingLink && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          Continue with {providerLabel(pendingLink.provider)} to attach email/password login for{" "}
          {pendingLink.email}.
        </div>
      )}
      <SignupForm onSubmit={handleSignup} submitting={submitting} />
      <p className="text-center text-xs text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          {t("common.login")}
        </Link>
      </p>
      <Divider />
      <SocialButtons
        onProvider={handleSocial}
        disabled={submitting}
        mode="login"
        only={pendingLink ? [pendingLink.provider] : undefined}
      />
      <EmailVerificationModal
        open={!!verificationUser}
        user={verificationUser}
        onVerified={handleVerifiedSignup}
        onCancel={handleVerificationCancel}
      />
      <ProviderLinkDialog
        pendingLink={pendingLink}
        mismatch={providerMismatch}
        submitting={submitting}
        onContinue={() => {
          if (pendingLink) void handleSocial(pendingLink.provider);
        }}
        onCancel={() => {
          sessionStorage.removeItem(PENDING_LINK_EMAIL_KEY);
          setPendingLink(null);
          setProviderMismatch(null);
        }}
      />
    </div>
  );
}

function ProviderLinkDialog({
  pendingLink,
  mismatch,
  submitting,
  onContinue,
  onCancel,
}: {
  pendingLink: PendingEmailPasswordLink | null;
  mismatch: string | null;
  submitting: boolean;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const provider = pendingLink ? providerLabel(pendingLink.provider) : "";
  return (
    <Dialog open={!!pendingLink} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Continue with {provider}</DialogTitle>
          <DialogDescription>
            This email is already registered with {provider}. Continue with that same account to
            enable email/password login for {pendingLink?.email}.
          </DialogDescription>
        </DialogHeader>
        {mismatch && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mismatch}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue} disabled={submitting}>
            Continue with {provider}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function signupErrorMessage(err: unknown, t: (key: string) => string): string {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (code === "auth/email-already-in-use") return t("auth.errors.emailInUse");
  if (code === "auth/weak-password") return t("auth.errors.weakPassword");
  if (code === "auth/invalid-email") return t("auth.errors.invalidEmail");
  if (code === "auth/popup-closed-by-user") return t("auth.errors.signupPopupClosed");
  if (code === "auth/popup-blocked") return t("auth.errors.popupBlocked");
  if (code === "auth/unauthorized-domain") return t("auth.errors.unauthorizedDomain");
  return code ? `Sign up failed (${code}).` : t("auth.errors.signupFailed");
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
