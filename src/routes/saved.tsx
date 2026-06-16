import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_RESIDENTIAL, MOCK_SAVED_IDS } from "@/lib/mock-data";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved Listings — HomeBee" }] }),
  component: SavedPage,
});

function SavedPage() {
  const saved = MOCK_RESIDENTIAL.filter((p) => MOCK_SAVED_IDS.includes(p.id));
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-5 w-5 fill-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved listings</h1>
          <p className="text-sm text-muted-foreground">{saved.length} properties saved</p>
        </div>
      </header>

      {saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No saved properties yet.</p>
          <Button asChild className="mt-4"><Link to="/residential">Browse properties</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => <PropertyCard key={p.id} item={p} />)}
        </div>
      )}
    </div>
  );
}
