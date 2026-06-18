import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useId, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Heart,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { getFirebaseAuth } from "@/lib/firebase";
import { mockAuth } from "@/lib/mock-auth";
import { useAuthStore, type AuthProvider, type ConnectedCredential } from "@/store/authStore";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — HomeBee" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  if (!user) return <SignedOut />;

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    signOut();
    toast.success("Logged out");
    navigate({ to: "/auth/login" });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <ProfileHeader />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Saved" value={12} />
        <Stat label="Enquiries" value={5} />
        <Stat label="Listings" value={0} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Row to="/saved" icon={Heart} label="Saved listings" />
        <Row to="/messages" icon={MessageCircle} label="Messages" />
        <Row to="/notifications" icon={Bell} label="Notifications" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <SectionHeader title="Password" sub="Change the password used to log into HomeBee." />
          <ChangePassword />
        </section>
      </div>

      <section className="mt-10">
        <SectionHeader
          title="Connected accounts"
          sub="At least one active login method is required."
        />
        <ConnectedAccounts />
      </section>

      <Separator className="my-6" />
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" /> Log out
      </Button>
    </div>
  );
}

function ProfileHeader() {
  const user = useAuthStore((s) => s.user)!;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-6 md:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 text-xl">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user.avatarInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.verified && (
              <Badge className="gap-1 border-0 bg-secondary/15 text-secondary">
                <Shield className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Member since {user.joinedYear}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user.city}
            </span>
          </div>
        </div>
        <EditProfileDialog />
      </div>
    </div>
  );
}

function EditProfileDialog() {
  const user = useAuthStore((s) => s.user)!;
  const updateUser = useAuthStore((s) => s.updateUser);
  const photoInputId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  function reset() {
    setName(user.name);
    setPhone(user.phone ?? "");
    setCity(user.city);
    setAvatarUrl(user.avatarUrl ?? "");
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateUser({
      name: name.trim(),
      phone: phone.trim() || null,
      city: city.trim() || "Dhaka",
      avatarInitials: initialsFrom(name),
      avatarUrl: avatarUrl || null,
    });
    toast.success("Profile updated");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <input
              id={photoInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <label htmlFor={photoInputId} className="cursor-pointer rounded-full">
              <Avatar className="h-24 w-24 text-2xl ring-2 ring-border transition hover:ring-primary">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback>{initialsFrom(name)}</AvatarFallback>
              </Avatar>
            </label>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setAvatarUrl("")}
              >
                Remove photo
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email ?? ""} disabled />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-city">City</Label>
              <Input id="profile-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Change
          </Button>
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
                <Input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="h-11"
                />
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
  apple: { label: "Apple", icon: <span className="text-xs">A</span> },
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
                <Badge className="gap-1 border-0 bg-primary/10 text-primary">
                  <Star className="h-3 w-3" /> Primary
                </Badge>
              )}
              {c.verified ? (
                <Badge className="gap-1 border-0 bg-secondary/15 text-secondary">
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
              <Switch checked={c.loginEnabled} onCheckedChange={(v) => handleToggleLogin(c, v)} />
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

  async function handleGoogle() {
    const u = await mockAuth.social("google");
    onAttach({
      provider: "google",
      value: u.email ?? "google-user",
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
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
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
              <Button
                variant="outline"
                className="h-11 justify-start gap-2"
                onClick={() => setMode("email")}
              >
                <Mail className="h-4 w-4" /> Attach email
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-start gap-2"
                onClick={() => setMode("phone")}
              >
                <Phone className="h-4 w-4" /> Attach phone
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or social</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <SocialButtons onProvider={handleGoogle} mode="attach" />
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

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SignedOut() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">Sign in to HomeBee</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log in to save listings, contact owners, and manage your account.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link
          to="/auth/login"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="card-hover flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}
