import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SignupValues {
  fullName: string;
  email: string;
  password: string;
}

interface Props {
  onSubmit: (v: SignupValues) => Promise<void> | void;
  submitting?: boolean;
}

export function SignupForm({ onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!fullName.trim()) return "auth.form.enterName";
    if (!email.trim()) return "auth.form.enterEmail";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "auth.form.invalidEmail";
    if (password.length < 6) return "auth.form.passwordMin";
    if (password !== confirmPassword) return "auth.form.passwordMismatch";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    await onSubmit({ fullName: fullName.trim(), email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="su-name">{t("auth.form.fullName")}</Label>
        <Input
          id="su-name"
          type="text"
          placeholder={t("auth.form.yourName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-11"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-email">{t("auth.form.emailAddress")}</Label>
        <Input
          id="su-email"
          type="email"
          placeholder={t("auth.form.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-password">{t("auth.form.password")}</Label>
        <div className="relative">
          <Input
            id="su-password"
            type={showPw ? "text" : "password"}
            placeholder={t("auth.form.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showPw ? t("auth.form.hidePassword") : t("auth.form.showPassword")}
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-confirm">{t("auth.form.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="su-confirm"
            type={showCpw ? "text" : "password"}
            placeholder={t("auth.form.repeatPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showCpw ? t("auth.form.hidePassword") : t("auth.form.showPassword")}
            onClick={() => setShowCpw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {t(error)}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full text-sm font-semibold"
        disabled={submitting}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.form.createAccount")}
      </Button>
    </form>
  );
}
