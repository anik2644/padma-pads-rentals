import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Settings, Heart, MessageCircle, Bell, LogOut, ChevronRight, Phone, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — HomeBee" }] }),
  component: ProfilePage,
});

const USER = {
  name: "Tasnim Rahman",
  email: "tasnim@example.com",
  phone: "+8801712345678",
  city: "Dhaka",
  verified: true,
  joinedYear: "2025",
  stats: { saved: 12, enquiries: 5, listings: 0 },
};

function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-6 md:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 text-xl"><AvatarFallback>TR</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{USER.name}</h1>
              {USER.verified && <Badge className="gap-1 bg-secondary/15 text-secondary border-0"><Shield className="h-3 w-3" /> Verified</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">Member since {USER.joinedYear}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{USER.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />🇧🇩 {USER.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{USER.city}</span>
            </div>
          </div>
          <Button variant="outline">Edit profile</Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Saved" value={USER.stats.saved} />
          <Stat label="Enquiries" value={USER.stats.enquiries} />
          <Stat label="Listings" value={USER.stats.listings} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Row to="/saved" icon={Heart} label="Saved listings" />
        <Row to="/messages" icon={MessageCircle} label="Messages" />
        <Row to="/notifications" icon={Bell} label="Notifications" />
        <Row to="/profile" icon={Settings} label="Account settings" />
      </div>

      <Separator className="my-6" />
      <Button variant="ghost" className="text-destructive hover:text-destructive">
        <LogOut className="mr-2 h-4 w-4" /> Log out
      </Button>
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

function Row({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="card-hover flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <span className="font-medium">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
