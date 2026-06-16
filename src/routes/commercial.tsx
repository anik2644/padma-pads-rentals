import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Building2, MapPin, Maximize2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_COMMERCIAL, COMMERCIAL_TYPES, type CommercialType } from "@/lib/mock-data";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/commercial")({
  head: () => ({ meta: [
    { title: "Commercial Properties — HomeBee" },
    { name: "description", content: "Browse offices, shops, showrooms and warehouses across Bangladesh." },
  ] }),
  component: CommercialPage,
});

const LABEL: Record<CommercialType, string> = {
  offices: "Office",
  shops: "Shop",
  showrooms: "Showroom",
  warehouses: "Warehouse",
};

function CommercialPage() {
  const [active, setActive] = useState<CommercialType | "all">("all");
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    return MOCK_COMMERCIAL.filter((p) => active === "all" || p.type === active)
      .filter((p) => !q || (p.name + p.area + p.city).toLowerCase().includes(q.toLowerCase()));
  }, [active, q]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Commercial Properties</h1>
        <p className="mt-1 text-muted-foreground">Offices, shops, showrooms and warehouses across Bangladesh.</p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-6">
        <div className="flex flex-wrap gap-2">
          <Chip active={active === "all"} onClick={() => setActive("all")}>All</Chip>
          {COMMERCIAL_TYPES.map((t) => (
            <Chip key={t} active={active === t} onClick={() => setActive(t)}>{LABEL[t]}</Chip>
          ))}
        </div>
        <Input className="mt-4 h-11" placeholder="Search by name, area, city..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{items.length} properties found</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article key={p.id} className="card-hover overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img src={p.coverImage} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              <Badge className="absolute left-3 top-3 capitalize">{LABEL[p.type]}</Badge>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.area}, {p.city}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><Maximize2 className="h-3.5 w-3.5" /> {p.sizeSqft} sqft</span>
                <span className="font-bold text-primary">{formatBDT(p.rent)}<span className="text-xs text-muted-foreground">/mo</span></span>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.features.map((f) => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" asChild><Link to="/commercial">View Details</Link></Button>
                <Button size="sm" variant="outline" className="gap-1"><Phone className="h-3.5 w-3.5" /> Call</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground",
    )}>{children}</button>
  );
}
