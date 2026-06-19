import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { mockAuth } from "@/lib/mock-auth";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

type Stage = "method" | "target" | "verify" | "reset";
type Method = "email" | "phone";

function ForgotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("method");
  const [method, setMethod] = useState<Method>("email");
  const [target, setTarget] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error(t("profile.passwordMin"));
    if (pw !== pw2) return toast.error(t("profile.passwordMismatch"));
    setSaving(true);
    try {
      await mockAuth.resetPassword(pw);
      toast.success(t("auth.forgot.passwordUpdatedLogin"));
      navigate({ to: "/auth/login" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/auth/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> {t("auth.forgot.back")}
      </Link>

      {stage === "method" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">{t("auth.forgot.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.forgot.sub")}
            </p>
          </div>
          <div className="grid gap-3">
            <MethodCard
              icon={<Mail className="h-5 w-5" />}
              label={t("auth.forgot.emailLink")}
              sub={t("auth.forgot.emailLinkSub")}
              onClick={() => {
                setMethod("email");
                setStage("target");
              }}
            />
            <MethodCard
              icon={<Phone className="h-5 w-5" />}
              label={t("auth.forgot.phoneOtp")}
              sub={t("auth.forgot.phoneOtpSub")}
              onClick={() => {
                setMethod("phone");
                setStage("target");
              }}
            />
          </div>
        </>
      )}

      {stage === "target" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!target.trim()) return;
            setStage("verify");
          }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-2xl font-bold">
              {t(method === "email" ? "auth.forgot.enterEmail" : "auth.forgot.enterPhone")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.forgot.sendSub")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>{t(method === "email" ? "auth.form.emailAddress" : "profile.phoneNumber")}</Label>
            <Input
              type={method === "email" ? "email" : "tel"}
              placeholder={method === "email" ? "you@example.com" : "+8801712345678"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full">
            {t("auth.forgot.sendCode")}
          </Button>
        </form>
      )}

      {stage === "verify" && (
        <VerificationComponent
          type={method}
          target={target}
          onVerified={() => setStage("reset")}
          onChangeTarget={() => setStage("target")}
          onCancel={() => setStage("method")}
        />
      )}

      {stage === "reset" && (
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t("auth.forgot.resetTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.forgot.resetSub")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>{t("profile.newPassword")}</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("profile.confirmPassword")}</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("profile.updatePassword")}
          </Button>
        </form>
      )}
    </div>
  );
}

function MethodCard({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-hover flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
