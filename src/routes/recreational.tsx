import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_RECREATIONAL, RECREATIONAL_TYPES, type RecreationalType } from "@/lib/mock-data";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recreational")({
  head: () => ({ meta: [
    { title: "Hotels & Resorts — HomeBee" },
    { name: "description", content: "Book hotels, resorts, guest houses and villas across Bangladesh." },
  ] }),
  component: RecreationalPage,
});

const LABEL: Record<RecreationalType, string> = {
  hotels: "Hotel", resorts: "Resort", guesthouses: "Guest House", villas: "Villa",
};

function RecreationalPage() {
  const [active, setActive] = useState<RecreationalType | "all">("all");
  const [q, setQ] = useState("");
  const items = useMemo(() => MOCK_RECREATIONAL
    .filter((p) => active === "all" || p.type === active)
    .filter((p) => !q || (p.name + p.city).toLowerCase().includes(q.toLowerCase())), [active, q]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Hotels & Resorts</h1>
        <p className="mt-1 text-muted-foreground">Plan your next getaway across Cox's Bazar, Sylhet, Bandarban and beyond.</p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-6">
        <div className="flex flex-wrap gap-2">
          <Chip active={active === "all"} onClick={() => setActive("all")}>All</Chip>
          {RECREATIONAL_TYPES.map((t) => (
            <Chip key={t} active={active === t} onClick={() => setActive(t)}>{LABEL[t]}</Chip>
          ))}
        </div>
        <Input className="mt-4 h-11" placeholder="Search destination or property..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{items.length} stays found</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article key={p.id} className="card-hover overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img src={p.coverImage} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              <Badge className="absolute left-3 top-3 capitalize">{LABEL[p.type]}</Badge>
              <Badge className="absolute right-3 top-3 gap-1 border-0 bg-background/90 text-foreground backdrop-blur">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
              </Badge>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.city}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.amenities.map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-lg font-bold text-primary">{formatBDT(p.pricePerNight)}<span className="text-xs text-muted-foreground">/night</span></span>
                <div className="flex gap-2">
                  <Button size="sm" asChild><Link to="/recreational">Book</Link></Button>
                  <Button size="sm" variant="outline" className="gap-1"><Phone className="h-3.5 w-3.5" /></Button>
                </div>
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
