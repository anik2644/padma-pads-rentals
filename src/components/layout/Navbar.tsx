import { Link } from "@tanstack/react-router";
import { Bell, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HomeBeeLogo } from "@/components/brand/HomeBeeLogo";
import { ThemeToggle, LanguageToggle } from "@/components/common/Toggles";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center">
          <HomeBeeLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" label={t("nav.home")} exact />
          <NavLink to="/residential" label={t("nav.residential")} />
          <NavLinkDisabled label={t("nav.commercial")} />
          <NavLinkDisabled label={t("nav.recreational")} />
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link
            to="/"
            className="hidden h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:inline-flex"
          >
            {t("common.login")}
          </Link>
          <span className="sm:hidden">
            <UserCircle className="h-7 w-7 text-muted-foreground" />
          </span>
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

function NavLinkDisabled({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground/70">
      {label}
      <Badge variant="secondary" className="bg-secondary/15 text-secondary text-[10px] uppercase">
        {t("common.comingSoon")}
      </Badge>
    </span>
  );
}
