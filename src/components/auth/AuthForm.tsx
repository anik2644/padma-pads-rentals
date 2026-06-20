import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Values {
  identifier: string;
  method: "email" | "phone";
  password: string;
}

interface Props {
  onSubmit: (v: Values) => Promise<void> | void;
  submitting?: boolean;
}

export function AuthForm({ onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!identifier.trim())
      return method === "email" ? "auth.form.enterEmail" : "Enter your phone number.";
    if (method === "email" && !/^\S+@\S+\.\S+$/.test(identifier)) return "auth.form.invalidEmail";
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
    await onSubmit({ identifier: identifier.trim(), method, password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs
        value={method}
        onValueChange={(value) => {
          setMethod(value as "email" | "phone");
          setIdentifier("");
          setError(null);
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="identifier">
          {method === "email" ? t("auth.form.emailAddress") : "Phone number"}
        </Label>
        <Input
          id="identifier"
          type={method === "email" ? "email" : "tel"}
          placeholder={method === "email" ? t("auth.form.emailPlaceholder") : "+8801712345678"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="h-11"
          autoComplete={method === "email" ? "email" : "tel"}
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
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error.startsWith("auth.") ? t(error) : error}
        </p>
      )}

      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.login")}
      </Button>
    </form>
  );
}
