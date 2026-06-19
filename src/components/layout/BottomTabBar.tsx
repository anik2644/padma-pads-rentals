import { Link } from "@tanstack/react-router";
import { Home, Search, Heart, MessageCircle, Plus, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BottomTabBar() {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        <li className="flex-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Home className="h-5 w-5" />
            {t("nav.home")}
          </Link>
        </li>
        <li className="flex-1">
          <Link
            to="/residential"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Search className="h-5 w-5" />
            {t("nav.search")}
          </Link>
        </li>

        {/* Center Add Property button */}
        <li className="flex flex-1 items-center justify-center">
          <Link
            to="/add-property"
            className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="Add Property"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </li>

        <li className="flex-1">
          <Link
            to="/saved"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Heart className="h-5 w-5" />
            {t("nav.saved")}
          </Link>
        </li>
        <li className="flex-1">
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <User className="h-5 w-5" />
            {t("nav.profile")}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
