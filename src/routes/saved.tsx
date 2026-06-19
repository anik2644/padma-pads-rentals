import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteFavorite,
  FAVORITES_CHANGED_EVENT,
  listFavorites,
  notifyFavoritesChanged,
  type Favorite,
} from "@/lib/favorites";
import { useLanguageStore } from "@/store/languageStore";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved Listings — HomeBee" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listFavorites({ pageSize: 50 });
      setFavorites(res.items);
      setTotalFavorites(res.meta.totalItems);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saved.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener(FAVORITES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, refresh);
  }, []);

  async function removeFavorite(favorite: Favorite) {
    try {
      await deleteFavorite({
        advertisementId: favorite.advertisementId,
      });
      await refresh();
      notifyFavoritesChanged();
      toast.success(t("actions.removedSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saved.removeError"));
    }
  }

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

      {!loading && favorites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">{t("saved.empty")}</p>
          <Button asChild className="mt-4"><Link to="/residential">{t("saved.browse")}</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <article key={favorite.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline">{t("saved.badge")}</Badge>
                  <h2 className="mt-3 font-semibold">{t("saved.property", { id: favorite.propertyId })}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("saved.advertisement", { id: favorite.advertisementId })}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("saved.savedAt", { date: formatDateTime(favorite.audit.createdAt, lang) })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeFavorite(favorite)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(value: string, lang: "en" | "bn") {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
