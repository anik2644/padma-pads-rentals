import { Link } from "@tanstack/react-router";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BottomTabBar() {
  const { t } = useTranslation();
  const items = [
    { to: "/", label: t("nav.home"), Icon: Home, exact: true },
    { to: "/residential", label: t("nav.search"), Icon: Search },
    { to: "/", label: t("nav.saved"), Icon: Heart },
    { to: "/", label: t("nav.messages"), Icon: MessageCircle },
    { to: "/", label: t("nav.profile"), Icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ to, label, Icon, exact }, i) => (
          <li key={i} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
