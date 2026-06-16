import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Building2, MapPin, Maximize2, Phone, Search, SlidersHorizontal, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { MOCK_COMMERCIAL, COMMERCIAL_TYPES, type CommercialType } from "@/lib/mock-data";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/commercial")({
  head: () => ({ meta: [
    { title: "Commercial Properties — HomeBee" },
    { name: "description", content: "Browse offices, shops, showrooms, warehouses and restaurant spaces across Bangladesh." },
  ] }),
  component: CommercialPage,
});

const DIVISIONS = ["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh"];

const TYPE_LABEL: Record<CommercialType, string> = {
  offices:     "Office Space",
  shops:       "Shop / Retail",
  showrooms:   "Showroom",
  warehouses:  "Warehouse",
  restaurants: "Restaurant Space",
};

interface CommercialFilters {
  types: CommercialType[];
  division?: string;
  city?: string;
  area?: string;
  minRent?: number;
  maxRent?: number;
  lift?: boolean;
  parking?: boolean;
  generator?: boolean;
  furnished?: boolean;
  internet?: boolean;
}

const DEFAULT_FILTERS: CommercialFilters = { types: [...COMMERCIAL_TYPES] };

function CommercialPage() {
  const matchRoute = useMatchRoute();
  const [filters, setFilters] = useState<CommercialFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<CommercialFilters>(DEFAULT_FILTERS);
  const [searched, setSearched] = useState(false);

  const items = useMemo(() => {
    return MOCK_COMMERCIAL
      .filter((p) => applied.types.length === 0 || applied.types.includes(p.type))
      .filter((p) => !applied.division || p.division === applied.division)
      .filter((p) => !applied.city || p.city.toLowerCase().includes(applied.city.toLowerCase()))
      .filter((p) => !applied.area || p.area.toLowerCase().includes(applied.area.toLowerCase()))
      .filter((p) => !applied.minRent || p.rent >= applied.minRent)
      .filter((p) => !applied.maxRent || p.rent <= applied.maxRent);
  }, [applied]);

  if (matchRoute({ to: "/commercial/$id" })) return <Outlet />;

  const toggleType = (type: CommercialType) =>
    setFilters((f) => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter((x) => x !== type) : [...f.types, type],
    }));

  const submit = () => { setApplied({ ...filters }); setSearched(true); };
  const reset = () => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); setSearched(false); };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Commercial Properties</h1>
        <p className="mt-1 text-muted-foreground">Offices, shops, showrooms, warehouses & restaurant spaces across Bangladesh.</p>
      </header>

      {/* Search Panel */}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-6">

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          {COMMERCIAL_TYPES.map((type) => (
            <button key={type} type="button" onClick={() => toggleType(type)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filters.types.includes(type)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}>
              {TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        {/* Location + Budget fields */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={filters.division ?? ""} onValueChange={(v) =>
            setFilters((f) => ({ ...f, division: v === "__all" ? undefined : v }))}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Division" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Divisions</SelectItem>
              {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="h-11" placeholder="City" value={filters.city ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))} />
          <Input className="h-11" placeholder="Area / Locality" value={filters.area ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value || undefined }))} />
          <div className="flex gap-2">
            <Input className="h-11" type="number" placeholder="Min ৳" value={filters.minRent ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, minRent: e.target.value ? Number(e.target.value) : undefined }))} />
            <Input className="h-11" type="number" placeholder="Max ৳" value={filters.maxRent ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
          <CommercialAdvancedFilters filters={filters} setFilters={setFilters} />
          <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </form>

      {/* Results */}
      <AnimatePresence>
        {(searched || true) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="mt-6 text-sm text-muted-foreground">{items.length} properties found</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                  className="card-hover overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img src={p.coverImage} alt={p.name} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    <Badge className="absolute left-3 top-3 capitalize">{TYPE_LABEL[p.type]}</Badge>
                  </div>
                  <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
                    <div>
                      <h3 className="line-clamp-1 font-semibold">{p.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.area}, {p.city}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Maximize2 className="h-3.5 w-3.5" /> {p.sizeSqft} sqft
                      </span>
                      <span className="font-bold text-primary">
                        {formatBDT(p.rent)}<span className="text-xs text-muted-foreground">/mo</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.features.map((f) => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                    </div>
                    <div className="mt-auto flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" asChild>
                        <Link to="/commercial/$id" params={{ id: p.id }}>View Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" aria-label="Save" className="shrink-0 px-3">
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" aria-label="Call" className="shrink-0 px-3">
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommercialAdvancedFilters({
  filters, setFilters,
}: { filters: CommercialFilters; setFilters: React.Dispatch<React.SetStateAction<CommercialFilters>> }) {
  const toggles: Array<{ key: keyof CommercialFilters; label: string }> = [
    { key: "lift",      label: "Lift / Elevator" },
    { key: "parking",   label: "Parking" },
    { key: "generator", label: "Generator / Backup Power" },
    { key: "furnished", label: "Furnished" },
    { key: "internet",  label: "Internet Ready" },
  ];
  const clearAdv = () => setFilters((f) => ({
    ...f, lift: undefined, parking: undefined, generator: undefined,
    furnished: undefined, internet: undefined,
  }));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader><SheetTitle>Advanced Filters</SheetTitle></SheetHeader>
        <div className="space-y-3 p-4">
          {toggles.map((tg) => (
            <div key={tg.key as string}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
              <Label className="text-sm font-medium">{tg.label}</Label>
              <Switch checked={Boolean(filters[tg.key])}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, [tg.key]: v }))} />
            </div>
          ))}
        </div>
        <SheetFooter className="p-4">
          <Button type="button" variant="ghost" onClick={clearAdv}>Clear</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
