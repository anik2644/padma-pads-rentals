import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, MapPin, Phone, Search, Save, Users, BedDouble, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_RECREATIONAL, RECREATIONAL_TYPES, type RecreationalType } from "@/lib/mock-data";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recreational")({
  head: () => ({ meta: [
    { title: "Hotels & Resorts — HomeBee" },
    { name: "description", content: "Book hotels, resorts, guest houses, villas and cottages across Bangladesh." },
  ] }),
  component: RecreationalPage,
});

const TYPE_LABEL: Record<RecreationalType, string> = {
  hotels:      "Hotel",
  resorts:     "Resort",
  guesthouses: "Guest House",
  villas:      "Villa",
  motels:      "Motel",
  cottages:    "Cottage",
};

interface RecFilters {
  types: RecreationalType[];
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  maxBudget?: number;
}

const DEFAULT_FILTERS: RecFilters = { types: [...RECREATIONAL_TYPES] };

function RecreationalPage() {
  const matchRoute = useMatchRoute();
  const [filters, setFilters] = useState<RecFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<RecFilters>(DEFAULT_FILTERS);

  const items = useMemo(() => {
    return MOCK_RECREATIONAL
      .filter((p) => applied.types.length === 0 || applied.types.includes(p.type))
      .filter((p) => !applied.destination ||
        (p.city + p.division).toLowerCase().includes(applied.destination.toLowerCase()))
      .filter((p) => !applied.maxBudget || p.pricePerNight <= applied.maxBudget);
  }, [applied]);

  if (matchRoute({ to: "/recreational/$id" })) return <Outlet />;

  const toggleType = (type: RecreationalType) =>
    setFilters((f) => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter((x) => x !== type) : [...f.types, type],
    }));

  const submit = () => setApplied({ ...filters });
  const reset = () => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Hotels & Resorts</h1>
        <p className="mt-1 text-muted-foreground">
          Hotels, resorts, guest houses, villas & cottages across Cox's Bazar, Sylhet, Bandarban and beyond.
        </p>
      </header>

      {/* Search Panel */}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-6">

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          {RECREATIONAL_TYPES.map((type) => (
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

        {/* Destination + dates */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-11 pl-9" placeholder="Destination (city, area…)"
              value={filters.destination ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, destination: e.target.value || undefined }))} />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input className="h-11 pl-9" type="date" placeholder="Check-in"
              value={filters.checkIn ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, checkIn: e.target.value || undefined }))} />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input className="h-11 pl-9" type="date" placeholder="Check-out"
              value={filters.checkOut ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, checkOut: e.target.value || undefined }))} />
          </div>
        </div>

        {/* Guests, rooms, budget */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-11 pl-9" type="number" min={1} placeholder="Guests"
              value={filters.guests ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, guests: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
          <div className="relative">
            <BedDouble className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-11 pl-9" type="number" min={1} placeholder="Rooms"
              value={filters.rooms ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, rooms: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">Max ৳/night</Label>
            <Input className="h-11" type="number" placeholder="Budget"
              value={filters.maxBudget ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, maxBudget: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
          <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </form>

      {/* Results */}
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="mt-6 text-sm text-muted-foreground">{items.length} stays found</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <motion.article key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="card-hover overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img src={p.coverImage} alt={p.name} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  <Badge className="absolute left-3 top-3 capitalize">{TYPE_LABEL[p.type]}</Badge>
                  <Badge className="absolute right-3 top-3 gap-1 border-0 bg-background/90 text-foreground backdrop-blur">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
                  <div>
                    <h3 className="line-clamp-1 font-semibold">{p.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.amenities.map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="text-lg font-bold text-primary">
                      {formatBDT(p.pricePerNight)}<span className="text-xs font-normal text-muted-foreground">/night</span>
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <Link to="/recreational/$id" params={{ id: p.id }}>View Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" aria-label="Save" className="shrink-0 px-3">
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" aria-label="Call" className="shrink-0 px-3">
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
