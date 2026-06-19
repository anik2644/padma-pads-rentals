import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
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
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin({ email, password }: { email: string; password: string }) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured. Add your VITE_FIREBASE_* values.");
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
      toast.success(`Welcome back, ${storeData.user.name.split(" ")[0]}`);
      navigate({ to: "/" });
    } catch (err) {
      console.error("[login] email/password error:", err);
      toast.error(firebaseAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured. Add your VITE_FIREBASE_* values.");
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
      toast.success(`Welcome back, ${storeData.user.name.split(" ")[0]}`);
      navigate({ to: "/" });
    } catch (err) {
      toast.error(firebaseAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to continue browsing homes.</p>
      </div>
      <AuthForm onSubmit={handleLogin} submitting={submitting} />
      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/auth/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
      <Divider />
      <SocialButtons onProvider={handleGoogle} disabled={submitting} mode="login" />
    </div>
  );
}

function firebaseAuthMessage(err: unknown) {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  // Wrong credentials — Firebase SDK 10+ unifies these into invalid-credential
  if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  )
    return "Invalid email or password.";
  if (code === "auth/user-disabled") return "This account has been disabled.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  if (code === "auth/network-request-failed") return "Network error. Check your connection.";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed.";
  if (code === "auth/popup-blocked") return "Popup was blocked. Allow popups and try again.";
  if (code === "auth/account-exists-with-different-credential")
    return "An account with this email already exists using a different sign-in method.";
  if (code === "auth/unauthorized-domain")
    return "This domain is not authorized in Firebase Authentication settings.";
  // Surface the raw code in development so it's easy to add new cases
  return code ? `Login failed (${code}).` : "Login failed. Please try again.";
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
