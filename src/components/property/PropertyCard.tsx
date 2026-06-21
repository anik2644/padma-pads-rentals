import { Link } from "@tanstack/react-router";
import { Heart, MapPin, CalendarDays, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { PropertyListItem } from "@/lib/residential";
import { formatBDT, formatDate } from "@/lib/format";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createFavorite,
  deleteFavorite,
  FAVORITES_CHANGED_EVENT,
  listFavorites,
  notifyFavoritesChanged,
} from "@/lib/favorites";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<string, string> = {
  hostels: "bg-primary/15 text-primary",
  "single-rooms": "bg-secondary/15 text-secondary",
  "shared-rooms": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  sublets: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  flats: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  apartments: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  offices: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  shops: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  showrooms: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  warehouses: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  restaurants: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  hotels: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  resorts: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  guesthouses: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  motels: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  villas: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
};

export function PropertyCard({ item }: { item: PropertyListItem }) {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const advertisementId = item.advertisementId;
  const typeLabelKey =
    item.useType === "COMMERCIAL"
      ? `commercial.types.${item.type}`
      : item.useType === "RECREATIONAL"
        ? `recreational.types.${item.type}`
        : `residential.types.${item.type}`;

  useEffect(() => {
    if (!advertisementId) return;
    let cancelled = false;
    async function loadFavoriteState() {
      setFavoriteLoading(true);
      try {
        const res = await listFavorites({
          userId,
          advertisementId,
          propertyId: item.id,
          pageSize: 1,
        });
        if (cancelled) return;
        const favorite = res.items[0];
        setFavoriteId(favorite?.id ?? null);
        setSaved(Boolean(favorite));
      } catch {
        if (!cancelled) {
          setFavoriteId(null);
          setSaved(false);
        }
      } finally {
        if (!cancelled) setFavoriteLoading(false);
      }
    }
    loadFavoriteState();
    window.addEventListener(FAVORITES_CHANGED_EVENT, loadFavoriteState);
    return () => {
      cancelled = true;
      window.removeEventListener(FAVORITES_CHANGED_EVENT, loadFavoriteState);
    };
  }, [advertisementId, item.id, userId]);

  async function toggleFavorite() {
    if (!advertisementId) {
      toast.error(t("actions.cannotSave"));
      return;
    }
    try {
      if (favoriteId) {
        await deleteFavorite({ advertisementId });
        setFavoriteId(null);
        setSaved(false);
        notifyFavoritesChanged();
        toast.success(t("actions.removedSaved"));
        return;
      }
      const favorite = await createFavorite({ advertisementId, propertyId: item.id });
      setFavoriteId(favorite.id);
      setSaved(true);
      notifyFavoritesChanged();
      toast.success(t("actions.savedListing"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update saved listing");
    }
  }

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
            toggleFavorite();
          }}
          aria-label={t("common.save")}
          disabled={favoriteLoading}
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
          <Badge className={cn("border-0 capitalize", TYPE_COLOR[item.type] ?? TYPE_COLOR.flats)}>
            {t(typeLabelKey, { defaultValue: item.type.replace(/-/g, " ") })}
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
          <PropertyDetailsButton item={item} />
          <Button
            size="sm"
            variant="outline"
            aria-label={t("common.quickCall")}
            className="shrink-0 px-3"
          >
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function PropertyDetailsButton({ item }: { item: PropertyListItem }) {
  const { t } = useTranslation();
  if (item.useType === "COMMERCIAL") {
    return (
      <Button asChild size="sm" className="flex-1">
        <Link to="/commercial/$id" params={{ id: item.id }}>
          {t("common.viewDetails")}
        </Link>
      </Button>
    );
  }
  if (item.useType === "RECREATIONAL") {
    return (
      <Button asChild size="sm" className="flex-1">
        <Link to="/recreational/$id" params={{ id: item.id }}>
          {t("common.viewDetails")}
        </Link>
      </Button>
    );
  }
  return (
    <Button asChild size="sm" className="flex-1">
      <Link to="/residential/$type/$id" params={{ type: item.type, id: item.id }}>
        {t("common.viewDetails")}
      </Link>
    </Button>
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
