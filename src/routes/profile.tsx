import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  Settings,
  Heart,
  MessageCircle,
  Bell,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — HomeBee" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  if (!user) return <SignedOut />;

  function handleLogout() {
    signOut();
    toast.success("Logged out");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-6 md:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 text-xl">
            <AvatarFallback>{user.avatarInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.verified && (
                <Badge className="gap-1 bg-secondary/15 text-secondary border-0">
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
                  <Phone className="h-3 w-3" />🇧🇩 {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user.city}
              </span>
            </div>
          </div>
          <Button variant="outline">Edit profile</Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Saved" value={12} />
          <Stat label="Enquiries" value={5} />
          <Stat label="Listings" value={0} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Row to="/saved" icon={Heart} label="Saved listings" />
        <Row to="/messages" icon={MessageCircle} label="Messages" />
        <Row to="/notifications" icon={Bell} label="Notifications" />
        <Row to="/settings" icon={Settings} label="Account settings" />
      </div>

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
        <Link
          to="/auth/signup"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold hover:bg-accent"
        >
          Sign up
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
