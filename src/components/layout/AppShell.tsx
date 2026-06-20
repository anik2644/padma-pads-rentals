import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useLanguageStore } from "@/store/languageStore";
import { initI18n } from "@/i18n";
import { Navbar } from "./Navbar";
import { BottomTabBar } from "./BottomTabBar";
import { Toaster } from "@/components/ui/sonner";
import { resolveStoreUser } from "@/lib/firestore-user";
import { firebaseUserToStoreUser } from "@/lib/firebase-auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import type { User } from "firebase/auth";

const PENDING_LINK_EMAIL_KEY = "homebee:pending-email-password-link-email";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const clearAuth = useAuthStore((s) => s.signOut);
  const [authReady, setAuthReady] = useState(false);
  const isAuthRoute = location.pathname.startsWith("/auth");

  useEffect(() => {
    initI18n(lang);
  }, [lang]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          clearAuth();
          return;
        }
        const pendingLinkEmail = sessionStorage.getItem(PENDING_LINK_EMAIL_KEY);
        if (
          pendingLinkEmail &&
          isAuthRoute &&
          normalizeEmail(firebaseUser.email) !== pendingLinkEmail
        ) {
          clearAuth();
          await auth.signOut().catch(() => {});
          return;
        }
        if (isUnverifiedEmailPasswordUser(firebaseUser)) {
          clearAuth();
          return;
        }
        // Try Firestore-backed resolution; fall back to bare Firebase Auth data
        const resolved = await resolveStoreUser(firebaseUser).catch(async () => ({
          user: await firebaseUserToStoreUser(firebaseUser),
          profileCompleted: false as boolean,
        }));
        const token = await firebaseUser.getIdToken();
        setUser(resolved.user, resolved.profileCompleted);
        setToken(token);
      } catch (err) {
        // Only clear auth if we truly cannot identify the user at all
        console.error("[AppShell] critical auth error:", err);
        clearAuth();
      } finally {
        setAuthReady(true);
      }
    });
  }, [clearAuth, isAuthRoute, setToken, setUser]);

  useEffect(() => {
    if (!authReady) return;

    if (!user && !isAuthRoute) {
      navigate({ to: "/auth/login", replace: true });
      return;
    }

    if (user && isAuthRoute) {
      navigate({ to: "/", replace: true });
    }
  }, [authReady, isAuthRoute, navigate, user]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {t("common.loading")}
        <Toaster position="top-right" />
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomTabBar />
      <Toaster position="top-right" />
    </div>
  );
}

function isUnverifiedEmailPasswordUser(user: User) {
  return (
    user.providerData.some((provider) => provider.providerId === "password") && !user.emailVerified
  );
}

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() ?? "";
}
