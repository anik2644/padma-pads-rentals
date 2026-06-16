import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthForm, type AuthMethod } from "@/components/auth/AuthForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { mockAuth } from "@/lib/mock-auth";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

type Stage = "form" | "verify";

function SignupPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const updateUser = useAuthStore((s) => s.updateUser);
  const updateCredential = useAuthStore((s) => s.updateCredential);
  const [method, setMethod] = useState<AuthMethod>("email");
  const [stage, setStage] = useState<Stage>("form");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ target: string } | null>(null);

  async function handleSignup({
    identifier,
    password,
    name,
  }: {
    identifier: string;
    password: string;
    name?: string;
  }) {
    setSubmitting(true);
    try {
      const user =
        method === "email"
          ? await mockAuth.signupEmail(identifier, password)
          : await mockAuth.signupPhone(identifier, password);
      if (name) user.name = name;
      setUser(user);
      setToken(`mock_token_${user.id}`);
      setPending({ target: identifier });
      setStage("verify");
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
      toast.success(`Account created with ${provider}`);
      navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleVerified() {
    updateUser({ verified: true });
    if (pending) {
      updateCredential(method, pending.target, { verified: true });
    }
    toast.success("Account verified — welcome to HomeBee!");
    navigate({ to: "/" });
  }

  if (stage === "verify" && pending) {
    return (
      <VerificationComponent
        type={method}
        target={pending.target}
        onVerified={handleVerified}
        onChangeTarget={() => setStage("form")}
        onCancel={() => setStage("form")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save listings, message owners, and get matched faster.
        </p>
      </div>
      <AuthForm
        mode="signup"
        method={method}
        onMethodChange={setMethod}
        onSubmit={handleSignup}
        submitting={submitting}
      />
      <Divider />
      <SocialButtons onProvider={handleSocial} disabled={submitting} mode="signup" />
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
