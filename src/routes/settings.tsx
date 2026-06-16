import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Shield,
  Star,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { mockAuth } from "@/lib/mock-auth";
import { useAuthStore, type AuthProvider, type ConnectedCredential } from "@/store/authStore";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Account settings — HomeBee" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) navigate({ to: "/auth/login" });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>
      <h1 className="mt-3 text-2xl font-bold md:text-3xl">Account settings</h1>
      <p className="text-sm text-muted-foreground">Manage your password and connected accounts.</p>

      <section className="mt-8">
        <SectionHeader title="Password" sub="Change the password used to log into HomeBee." />
        <ChangePassword />
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Connected accounts"
          sub="At least one active login method is required."
        />
        <ConnectedAccounts />
      </section>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function ChangePassword() {
  const user = useAuthStore((s) => s.user)!;
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"choose" | "verify" | "form">("choose");
  const [method, setMethod] = useState<"email" | "phone">(user.email ? "email" : "phone");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setStage("choose");
    setPw("");
    setPw2("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setSaving(true);
    try {
      await mockAuth.resetPassword(pw);
      toast.success("Password updated");
      setOpen(false);
      reset();
    } finally {
      setSaving(false);
    }
  }

  const target = method === "email" ? user.email ?? "" : user.phone ?? "";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium">Change password</p>
          <p className="text-xs text-muted-foreground">Verify ownership, then set a new one.</p>
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Change</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>

          {stage === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose a verification method.</p>
              <div className="grid gap-2">
                {user.email && (
                  <Button
                    variant="outline"
                    className="h-11 justify-start gap-2"
                    onClick={() => {
                      setMethod("email");
                      setStage("verify");
                    }}
                  >
                    <Mail className="h-4 w-4" /> Send code to {user.email}
                  </Button>
                )}
                {user.phone && (
                  <Button
                    variant="outline"
                    className="h-11 justify-start gap-2"
                    onClick={() => {
                      setMethod("phone");
                      setStage("verify");
                    }}
                  >
                    <Phone className="h-4 w-4" /> Send code to {user.phone}
                  </Button>
                )}
              </div>
            </div>
          )}

          {stage === "verify" && (
            <VerificationComponent
              type={method}
              target={target}
              onVerified={() => setStage("form")}
              onCancel={() => setStage("choose")}
            />
          )}

          {stage === "form" && (
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm password</Label>
                <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PROVIDER_META: Record<AuthProvider, { label: string; icon: React.ReactNode }> = {
  email: { label: "Email", icon: <Mail className="h-4 w-4" /> },
  phone: { label: "Phone", icon: <Phone className="h-4 w-4" /> },
  google: { label: "Google", icon: <span className="text-xs font-bold">G</span> },
  facebook: { label: "Facebook", icon: <span className="text-xs font-bold">f</span> },
  apple: { label: "Apple", icon: <span className="text-xs">🍎</span> },
};

function ConnectedAccounts() {
  const user = useAuthStore((s) => s.user)!;
  const addCredential = useAuthStore((s) => s.addCredential);
  const removeCredential = useAuthStore((s) => s.removeCredential);
  const updateCredential = useAuthStore((s) => s.updateCredential);
  const setPrimary = useAuthStore((s) => s.setPrimary);

  const activeCount = user.credentials.filter((c) => c.loginEnabled).length;

  function handleRemove(c: ConnectedCredential) {
    if (c.loginEnabled && activeCount <= 1) {
      toast.error("You need at least one active login method.");
      return;
    }
    removeCredential(c.provider, c.value);
    toast.success(`${PROVIDER_META[c.provider].label} disconnected`);
  }

  function handleToggleLogin(c: ConnectedCredential, next: boolean) {
    if (!next && c.loginEnabled && activeCount <= 1) {
      toast.error("You need at least one active login method.");
      return;
    }
    updateCredential(c.provider, c.value, { loginEnabled: next });
  }

  return (
    <div className="space-y-3">
      {user.credentials.map((c) => (
        <div
          key={`${c.provider}-${c.value}`}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {PROVIDER_META[c.provider].icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{PROVIDER_META[c.provider].label}</p>
              {c.primary && (
                <Badge className="gap-1 bg-primary/10 text-primary border-0">
                  <Star className="h-3 w-3" /> Primary
                </Badge>
              )}
              {c.verified ? (
                <Badge className="gap-1 bg-secondary/15 text-secondary border-0">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{c.value}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <span>Login</span>
              <Switch
                checked={c.loginEnabled}
                onCheckedChange={(v) => handleToggleLogin(c, v)}
              />
            </div>
            {!c.primary && (
              <Button variant="ghost" size="sm" onClick={() => setPrimary(c.provider, c.value)}>
                Set primary
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(c)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <AttachCredential
        onAttach={(c) => {
          addCredential(c);
          toast.success(`${PROVIDER_META[c.provider].label} connected`);
        }}
      />
    </div>
  );
}

function AttachCredential({ onAttach }: { onAttach: (c: ConnectedCredential) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "email" | "phone" | "verify-email" | "verify-phone">(
    "choose",
  );
  const [value, setValue] = useState("");

  function reset() {
    setMode("choose");
    setValue("");
  }

  async function handleSocial(provider: "google" | "facebook" | "apple") {
    const u = await mockAuth.social(provider);
    onAttach({
      provider,
      value: u.email ?? `${provider}-user`,
      verified: true,
      loginEnabled: true,
      primary: false,
      addedAt: new Date().toISOString(),
    });
    setOpen(false);
    reset();
  }

  function commitVerified(provider: "email" | "phone") {
    onAttach({
      provider,
      value,
      verified: true,
      loginEnabled: true,
      primary: false,
      addedAt: new Date().toISOString(),
    });
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Attach another login method
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach a login method</DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-3">
            <div className="grid gap-2">
              <Button variant="outline" className="h-11 justify-start gap-2" onClick={() => setMode("email")}>
                <Mail className="h-4 w-4" /> Attach email
              </Button>
              <Button variant="outline" className="h-11 justify-start gap-2" onClick={() => setMode("phone")}>
                <Phone className="h-4 w-4" /> Attach phone
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or social</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <SocialButtons onProvider={handleSocial} mode="attach" />
          </div>
        )}

        {(mode === "email" || mode === "phone") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!value.trim()) return;
              setMode(mode === "email" ? "verify-email" : "verify-phone");
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>{mode === "email" ? "Email address" : "Phone number"}</Label>
              <Input
                type={mode === "email" ? "email" : "tel"}
                placeholder={mode === "email" ? "you@example.com" : "+8801712345678"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full">
              <Shield className="h-4 w-4" /> Send verification code
            </Button>
          </form>
        )}

        {mode === "verify-email" && (
          <VerificationComponent
            type="email"
            target={value}
            onVerified={() => commitVerified("email")}
            onChangeTarget={() => setMode("email")}
            onCancel={() => setMode("choose")}
          />
        )}
        {mode === "verify-phone" && (
          <VerificationComponent
            type="phone"
            target={value}
            onVerified={() => commitVerified("phone")}
            onChangeTarget={() => setMode("phone")}
            onCancel={() => setMode("choose")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
