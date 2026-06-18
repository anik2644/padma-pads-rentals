import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { firebaseUserToStoreUser } from "@/lib/firebase-auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";

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
      const [user, token] = await Promise.all([
        firebaseUserToStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(user);
      setToken(token);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate({ to: "/" });
    } catch (err) {
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
      const [user, token] = await Promise.all([
        firebaseUserToStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(user);
      setToken(token);
      toast.success("Signed in with Google");
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
      <AuthForm
        onSubmit={handleLogin}
        submitting={submitting}
      />
      <Divider />
      <SocialButtons onProvider={handleGoogle} disabled={submitting} mode="login" />
    </div>
  );
}

function firebaseAuthMessage(err: unknown) {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (code === "auth/invalid-credential") return "Invalid email or password.";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed.";
  if (code === "auth/popup-blocked") return "Popup was blocked. Allow popups and try again.";
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Authentication settings.";
  }
  return "Login failed. Please try again.";
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
