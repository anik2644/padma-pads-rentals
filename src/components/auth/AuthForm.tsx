import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Values {
  email: string;
  password: string;
}

interface Props {
  onSubmit: (v: Values) => Promise<void> | void;
  submitting?: boolean;
}

export function AuthForm({ onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return "auth.form.enterEmail";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "auth.form.invalidEmail";
    if (password.length < 6) return "auth.form.passwordMin";
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
    await onSubmit({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.form.emailAddress")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("auth.form.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("auth.form.password")}</Label>
          <a href="/auth/forgot" className="text-xs font-medium text-primary hover:underline">
            {t("auth.form.forgot")}
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            placeholder={t("auth.form.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            aria-label={show ? t("auth.form.hidePassword") : t("auth.form.showPassword")}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{t(error)}</p>
      )}

      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.login")}
      </Button>
    </form>
  );
}
