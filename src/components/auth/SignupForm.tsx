import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!fullName.trim()) return "Enter your full name.";
    if (!email.trim()) return "Enter your email address.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "That email address looks invalid.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
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
        <Label htmlFor="su-name">Full name</Label>
        <Input
          id="su-name"
          type="text"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-11"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email address</Label>
        <Input
          id="su-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <div className="relative">
          <Input
            id="su-password"
            type={showPw ? "text" : "password"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-confirm">Confirm password</Label>
        <div className="relative">
          <Input
            id="su-confirm"
            type={showCpw ? "text" : "password"}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showCpw ? "Hide password" : "Show password"}
            onClick={() => setShowCpw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full text-sm font-semibold"
        disabled={submitting}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
