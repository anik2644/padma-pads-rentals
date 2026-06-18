import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteFavorite, listFavorites, type Favorite } from "@/lib/favorites";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved Listings — HomeBee" }] }),
  component: SavedPage,
});

function SavedPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listFavorites({ pageSize: 50 });
      setFavorites(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load saved listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function removeFavorite(favorite: Favorite) {
    try {
      await deleteFavorite({
        advertisementId: favorite.advertisementId,
      });
      await refresh();
      toast.success("Removed from saved listings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove saved listing");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-5 w-5 fill-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved listings</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${favorites.length} properties saved`}
          </p>
        </div>
      </header>

      {!loading && favorites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No saved properties yet.</p>
          <Button asChild className="mt-4"><Link to="/residential">Browse properties</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <article key={favorite.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline">Saved</Badge>
                  <h2 className="mt-3 font-semibold">Property {favorite.propertyId}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Advertisement {favorite.advertisementId}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Saved {formatDateTime(favorite.audit.createdAt)}
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
