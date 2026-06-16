import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthMode = "login" | "signup";
export type AuthMethod = "email" | "phone";

interface Values {
  identifier: string;
  password: string;
  name?: string;
}

interface Props {
  mode: AuthMode;
  method: AuthMethod;
  onMethodChange: (m: AuthMethod) => void;
  onSubmit: (v: Values) => Promise<void> | void;
  submitting?: boolean;
}

export function AuthForm({ mode, method, onMethodChange, onSubmit, submitting }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function validate(): string | null {
    if (isSignup && !name.trim()) return "Please enter your name.";
    if (!identifier.trim())
      return method === "email" ? "Enter your email address." : "Enter your phone number.";
    if (method === "email" && !/^\S+@\S+\.\S+$/.test(identifier))
      return "That email address looks invalid.";
    if (method === "phone" && !/^[+\d][\d\s-]{7,}$/.test(identifier))
      return "Enter a valid phone number (include country code).";
    if (password.length < 6) return "Password must be at least 6 characters.";
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
    await onSubmit({ identifier: identifier.trim(), password, name: name.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => onMethodChange("email")}
          className={`rounded-lg px-3 py-2 transition ${
            method === "email" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => onMethodChange("phone")}
          className={`rounded-lg px-3 py-2 transition ${
            method === "phone" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Phone
        </button>
      </div>

      {isSignup && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="e.g. Tasnim Rahman"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="identifier">
          {method === "email" ? "Email address" : "Phone number"}
        </Label>
        <Input
          id="identifier"
          type={method === "email" ? "email" : "tel"}
          placeholder={method === "email" ? "you@example.com" : "+8801712345678"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="h-11"
          autoComplete={method === "email" ? "email" : "tel"}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {!isSignup && (
            <a href="/auth/forgot" className="text-xs font-medium text-primary hover:underline">
              Forgot?
            </a>
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSignup ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
