import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthForm } from "@/components/auth/AuthForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import {
  getOrCreateSocialUserDoc,
  resolveStoreUser,
  updateLastLogin,
} from "@/lib/firestore-user";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin({ email, password }: { email: string; password: string }) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Non-blocking Firestore update
      updateLastLogin(credential.user.uid).catch(() => {});
      const [storeData, token] = await Promise.all([
        resolveStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(t("auth.welcomeBack", { name: storeData.user.name.split(" ")[0] }));
      navigate({ to: "/" });
    } catch (err) {
      console.error("[login] email/password error:", err);
      toast.error(firebaseAuthMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      // Non-blocking Firestore sync
      getOrCreateSocialUserDoc(credential.user, "google").catch((err) =>
        console.warn("[google login] Firestore write failed:", err),
      );
      const [storeData, token] = await Promise.all([
        resolveStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(t("auth.welcomeBack", { name: storeData.user.name.split(" ")[0] }));
      navigate({ to: "/" });
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
      <SocialButtons onProvider={handleGoogle} disabled={submitting} mode="login" />
    </div>
  );
}

function firebaseAuthMessage(err: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  // Wrong credentials — Firebase SDK 10+ unifies these into invalid-credential
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
  if (code === "auth/unauthorized-domain")
    return t("auth.errors.unauthorizedDomain");
  // Surface the raw code in development so it's easy to add new cases
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
