import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  findUserDocByEmail,
  findUserDocByPhone,
  hasEnabledVerifiedPhone,
  normalizeEmail,
  normalizePhone,
  primarySelfEmailForPhoneLogin,
} from "@/lib/firestore-user";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

type Stage = "method" | "target" | "verify";
type Method = "email" | "phone";

function ForgotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("method");
  const [method, setMethod] = useState<Method>("email");
  const [target, setTarget] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleTargetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (method === "email") {
        const email = normalizeEmail(target);
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(t("auth.form.invalidEmail"));
        const match = await findUserDocByEmail(email);
        if (!match) throw new Error("No account found with this email.");
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase is not configured.");
        await sendPasswordResetEmail(auth, email);
        toast.success(t("auth.forgot.resetEmailSent"));
        navigate({ to: "/auth/login" });
        return;
      }

      const phone = normalizePhone(target);
      if (!/^\+8801\d{9}$/.test(phone)) {
        throw new Error(
          "Enter a valid Bangladeshi phone number, like 01712345678 or +8801712345678.",
        );
      }
      const match = await findUserDocByPhone(phone);
      if (!match || !hasEnabledVerifiedPhone(match.data, phone)) {
        throw new Error("No active account found with this phone number.");
      }
      const email = primarySelfEmailForPhoneLogin(match.data);
      if (!email) {
        throw new Error("This phone number does not have an email/password login to reset.");
      }
      setResetEmail(email);
      setTarget(phone);
      setStage("verify");
    } catch (err) {
      setError((err as Error).message || "Could not start password reset.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoneVerified() {
    setSaving(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured.");
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success(t("auth.forgot.resetEmailSent"));
      navigate({ to: "/auth/login" });
    } catch (err) {
      setError((err as Error).message || "Could not send password reset email.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> {t("auth.forgot.back")}
      </Link>

      {stage === "method" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">{t("auth.forgot.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgot.sub")}</p>
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
        <form onSubmit={handleTargetSubmit} className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">
              {t(method === "email" ? "auth.forgot.enterEmail" : "auth.forgot.enterPhone")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgot.sendSub")}</p>
          </div>
          <div className="space-y-1.5">
            <Label>
              {t(method === "email" ? "auth.form.emailAddress" : "profile.phoneNumber")}
            </Label>
            <Input
              type={method === "email" ? "email" : "tel"}
              placeholder={method === "email" ? "you@example.com" : "+8801712345678"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-11"
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {method === "email" ? t("auth.forgot.sendResetEmail") : t("auth.forgot.sendCode")}
          </Button>
        </form>
      )}

      {stage === "verify" && (
        <VerificationComponent type={method} target={target} onVerified={handlePhoneVerified} />
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
