import { Link } from "@tanstack/react-router";
import { Heart, MapPin, CalendarDays, Phone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PropertyListItem } from "@/lib/residential";
import { formatBDT, formatDate } from "@/lib/format";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<PropertyListItem["type"], string> = {
  hostels: "bg-primary/15 text-primary",
  "single-rooms": "bg-secondary/15 text-secondary",
  "shared-rooms": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  sublets: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  flats: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  apartments: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export function PropertyCard({ item }: { item: PropertyListItem }) {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const [saved, setSaved] = useState(false);

  return (
    <article className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-4xl font-bold text-muted-foreground/40">
            HomeBee
          </div>
        )}
        {/* Heart — fixed top-right; must be before badges so z-index stacks correctly */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
          }}
          aria-label={t("common.save")}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/85 backdrop-blur transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              saved ? "fill-primary text-primary" : "text-foreground",
            )}
          />
        </button>

        {/* Badges — capped so they never overlap the heart button */}
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
          <Badge className={cn("border-0 capitalize", TYPE_COLOR[item.type])}>
            {t(`residential.types.${item.type}`)}
          </Badge>
          {item.targetGroups.slice(0, 1).map((g) => (
            <Badge key={g} variant="outline" className="border-white/40 bg-black/30 text-white">
              {t(`residential.targetGroups.${g}`)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div>
          <h3 className="line-clamp-1 font-semibold text-foreground">{item.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {[item.area, item.city].filter(Boolean).join(", ") || "—"}
            </span>
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <span className="text-lg font-bold text-primary">{formatBDT(item.rent)}</span>
            <span className="text-xs text-muted-foreground">
              {t(`residential.card.${item.rentLabel}`)}
            </span>
          </div>
          {item.availableFrom && (
            <p className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{formatDate(item.availableFrom, lang)}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link
              to="/residential/$type/$id"
              params={{ type: item.type, id: item.id }}
            >
              {t("common.viewDetails")}
            </Link>
          </Button>
          <Button size="sm" variant="outline" aria-label={t("common.quickCall")} className="shrink-0 px-3">
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
