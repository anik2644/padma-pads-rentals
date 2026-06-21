import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import { fetchAdvertisementCard } from "@/lib/advertisements";
import { FAVORITES_CHANGED_EVENT, listFavorites, type Favorite } from "@/lib/favorites";
import type { PropertyListItem } from "@/lib/residential";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved Listings — HomeBee" }] }),
  component: SavedPage,
});

interface SavedProperty {
  favorite: Favorite;
  property: PropertyListItem;
}

function SavedPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFavorites({ userId, page: 1, pageSize: 50 });
      const hydrated = await Promise.all(
        res.items.map(async (favorite) => {
          const property = await fetchAdvertisementCard(
            favorite.advertisementId,
            favorite.propertyId,
          );
          return property ? { favorite, property } : null;
        }),
      );
      setItems(hydrated.filter((item): item is SavedProperty => item !== null));
      setTotalFavorites(res.meta.totalItems ?? res.items.length);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saved.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void refresh();
    window.addEventListener(FAVORITES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, refresh);
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-5 w-5 fill-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("saved.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? t("common.loading") : t("saved.count", { count: totalFavorites })}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">{t("saved.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/residential">{t("saved.browse")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ favorite, property }) => (
            <PropertyCard key={favorite.id} item={property} />
          ))}
        </div>
      )}
    </div>
  );
}
