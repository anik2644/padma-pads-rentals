import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthForm, type AuthMethod } from "@/components/auth/AuthForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { mockAuth } from "@/lib/mock-auth";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [method, setMethod] = useState<AuthMethod>("email");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin({ identifier, password }: { identifier: string; password: string }) {
    setSubmitting(true);
    try {
      if (method === "email") {
        // Real Firebase-backed login through the proxy
        const { api, ApiError } = await import("@/lib/api-client");
        try {
          const res = await api<{ id_token: string; refresh_token: string; expires_in: string }>(
            "/api/v1/login",
            { method: "POST", body: { email: identifier, password }, skipAuth: true },
          );
          setToken(res.id_token);
          const user = await mockAuth.loginEmail(identifier, password);
          setUser({ ...user, email: identifier });
          toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
          navigate({ to: "/" });
          return;
        } catch (err) {
          if (err instanceof ApiError) {
            toast.error(`Login failed: ${err.message}`);
            return;
          }
          throw err;
        }
      }
      // Phone login still uses the mock flow until backend supports it
      const user = await mockAuth.loginPhone(identifier, password);
      setUser(user);
      setToken(`mock_token_${user.id}`);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSocial(provider: "google" | "facebook" | "apple") {
    setSubmitting(true);
    try {
      const user = await mockAuth.social(provider);
      setUser(user);
      setToken(`mock_token_${user.id}`);
      toast.success(`Signed in with ${provider}`);
      navigate({ to: "/" });
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
        mode="login"
        method={method}
        onMethodChange={setMethod}
        onSubmit={handleLogin}
        submitting={submitting}
      />
      <Divider />
      <SocialButtons onProvider={handleSocial} disabled={submitting} mode="login" />
    </div>
  );
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
