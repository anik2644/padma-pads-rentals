import { Link } from "@tanstack/react-router";
import { Bell, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HomeBeeLogo } from "@/components/brand/HomeBeeLogo";
import { ThemeToggle, LanguageToggle } from "@/components/common/Toggles";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center">
          <HomeBeeLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" label={t("nav.home")} exact />
          <NavLink to="/residential" label={t("nav.residential")} />
          <NavLink to="/commercial" label={t("nav.commercial")} />
          <NavLink to="/recreational" label={t("nav.recreational")} />
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-accent"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              </Link>
              <Link
                to="/profile"
                className="hidden h-9 items-center gap-2 rounded-full border border-border bg-surface pl-1 pr-3 text-sm font-medium hover:bg-accent sm:inline-flex"
              >
                <Avatar className="h-7 w-7 text-xs">
                  <AvatarFallback>{user.avatarInitials}</AvatarFallback>
                </Avatar>
                {user.name.split(" ")[0]}
              </Link>
              <Link to="/profile" className="sm:hidden">
                <UserCircle className="h-7 w-7 text-muted-foreground" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="hidden h-9 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-accent sm:inline-flex"
              >
                {t("common.login")}
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t("common.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{ className: "bg-accent text-foreground" }}
    >
      {label}
    </Link>
  );
}
