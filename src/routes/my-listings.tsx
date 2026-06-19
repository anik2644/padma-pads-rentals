import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import { listOwnedResidentialListings, type PropertyListItem } from "@/lib/residential";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/my-listings")({
  head: () => ({ meta: [{ title: "My Listings — HomeBee" }] }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listOwnedResidentialListings(user.id, 1, 50)
      .then(({ items: rows, total: t }) => {
        setItems(rows);
        setTotal(t);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : t("myListings.loadError")))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("myListings.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? t("common.loading") : t("myListings.count", { count: total })}
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link to="/add-property">
            <Plus className="h-4 w-4" /> {t("common.addProperty")}
          </Link>
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("myListings.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/add-property">{t("myListings.addFirst")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
