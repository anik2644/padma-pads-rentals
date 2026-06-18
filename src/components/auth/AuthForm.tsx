import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return "Enter your email address.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "That email address looks invalid.";
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
    await onSubmit({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/auth/forgot" className="text-xs font-medium text-primary hover:underline">
            Forgot?
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-10"
            autoComplete="current-password"
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
        Log in
      </Button>
    </form>
  );
}
