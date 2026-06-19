import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { toast } from "sonner";
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
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup({ fullName, email, password }: SignupValues) {
    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase is not configured. Add your VITE_FIREBASE_* values.");
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
      toast.success(`Welcome to HomeBee, ${storeData.user.name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err) {
      toast.error(signupErrorMessage(err));
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
        console.warn("[google signup] Firestore write failed:", err),
      );
      const [storeData, token] = await Promise.all([
        resolveStoreUser(credential.user),
        credential.user.getIdToken(),
      ]);
      setUser(storeData.user, storeData.profileCompleted);
      setToken(token);
      toast.success(`Welcome to HomeBee, ${storeData.user.name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err) {
      toast.error(signupErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join HomeBee to find and list properties.
        </p>
      </div>
      <SignupForm onSubmit={handleSignup} submitting={submitting} />
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
      <Divider />
      <SocialButtons onProvider={handleGoogle} disabled={submitting} mode="login" />
    </div>
  );
}

function signupErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  if (code === "auth/email-already-in-use")
    return "An account with this email already exists. Try logging in.";
  if (code === "auth/weak-password") return "Password is too weak. Use at least 6 characters.";
  if (code === "auth/invalid-email") return "That email address is invalid.";
  if (code === "auth/popup-closed-by-user") return "Google sign-up was closed.";
  if (code === "auth/popup-blocked") return "Popup was blocked. Allow popups and try again.";
  return "Sign up failed. Please try again.";
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
