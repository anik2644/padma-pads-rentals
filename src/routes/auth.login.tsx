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
      const user =
        method === "email"
          ? await mockAuth.loginEmail(identifier, password)
          : await mockAuth.loginPhone(identifier, password);
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
