import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SignupForm, type SignupValues } from "@/components/auth/SignupForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import {
  createEmailPasswordUserDoc,
  getOrCreateSocialUserDoc,
  resolveStoreUser,
} from "@/lib/firestore-user";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup({ fullName, email, password }: SignupValues) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error(t("auth.firebaseMissing"));
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Set displayName on Firebase Auth
      if (fullName) {
        await updateProfile(credential.user, { displayName: fullName });
      }

      // Write Firestore user doc — non-blocking, never fails the signup
      createEmailPasswordUserDoc(credential.user).catch((err) =>
        console.warn("[signup] Firestore write failed:", err),
      );

      const [storeData, token] = await Promise.all([
        resolveStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(t("auth.welcomeSignup", { name: storeData.user.name.split(" ")[0] }));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(signupErrorMessage(err, t));
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
        console.warn("[google signup] Firestore write failed:", err),
      );
      const [storeData, token] = await Promise.all([
        resolveStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(t("auth.welcomeSignup", { name: storeData.user.name.split(" ")[0] }));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(signupErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("auth.signupTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.signupSub")}
        </p>
      </div>
      <SignupForm onSubmit={handleSignup} submitting={submitting} />
      <p className="text-center text-xs text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          {t("common.login")}
        </Link>
      </p>
      <Divider />
      <SocialButtons onProvider={handleGoogle} disabled={submitting} mode="login" />
    </div>
  );
}

function signupErrorMessage(err: unknown, t: (key: string) => string): string {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (code === "auth/email-already-in-use")
    return t("auth.errors.emailInUse");
  if (code === "auth/weak-password") return t("auth.errors.weakPassword");
  if (code === "auth/invalid-email") return t("auth.errors.invalidEmail");
  if (code === "auth/popup-closed-by-user") return t("auth.errors.signupPopupClosed");
  if (code === "auth/popup-blocked") return t("auth.errors.popupBlocked");
  return t("auth.errors.signupFailed");
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
