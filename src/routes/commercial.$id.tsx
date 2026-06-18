import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, MapPin, Maximize2, Building2, Phone, MessageCircle,
  Heart, Share2, Shield, Clock, CheckCircle2, CalendarDays, Layers,
  Wifi, Car, Zap, Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getCommercialDetail } from "@/lib/mock-data";
import { formatBDT, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { VisitRequestPanel } from "@/components/property/VisitRequestPanel";
import { trackPropertyView } from "@/lib/property-view-tracking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/commercial/$id")({
  head: () => ({ meta: [{ title: "Commercial Property — HomeBee" }] }),
  component: CommercialDetail,
  loader: ({ params }) => {
    const detail = getCommercialDetail(params.id);
    if (!detail) throw notFound();
    return detail;
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-bold">Property not found</h1>
      <Button asChild className="mt-4">
        <Link to="/commercial">Back to browse</Link>
      </Button>
    </div>
  ),
});

const TYPE_LABEL: Record<string, string> = {
  offices: "Office Space",
  shops: "Shop / Retail",
  showrooms: "Showroom",
  warehouses: "Warehouse",
};

function CommercialDetail() {
  const item = Route.useLoaderData();
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const advertisementId = `commercial-${item.id}`;

  useEffect(() => {
    trackPropertyView({
      advertisementId,
      propertyId: item.id,
      viewerType: user ? "REGISTERED" : "GUEST",
      viewerId: user?.id,
    });
  }, [advertisementId, item.id, user]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Link
        to="/commercial"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to commercial
      </Link>

      {/* Gallery */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted md:col-span-3">
          <img src={item.gallery[activeImg]} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => setSaved((s) => !s)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-105"
              aria-label="Save"
            >
              <Heart className={cn("h-4 w-4", saved ? "fill-primary text-primary" : "")} />
            </button>
            <button
              onClick={() => toast.success("Link copied")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-105"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {item.gallery.slice(0, 4).map((g: string, i: number) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={cn(
                "aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition",
                i === activeImg ? "ring-primary" : "ring-transparent hover:ring-border",
              )}
            >
              <img src={g} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & price */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge className="mb-2 capitalize">{TYPE_LABEL[item.type] ?? item.type}</Badge>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{item.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {item.area}, {item.city}, {item.division}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatBDT(item.rent)}</p>
              <p className="text-sm text-muted-foreground">/month</p>
              {item.negotiable && <Badge variant="secondary" className="mt-1">Negotiable</Badge>}
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Maximize2} label="Size" value={`${item.sizeSqft} sqft`} />
            <Stat icon={Layers} label="Floor" value={`${item.floorNumber}th`} />
            <Stat icon={Building2} label="Rooms" value={String(item.rooms)} />
            <Stat icon={Coffee} label="Cabins" value={String(item.cabins)} />
          </div>

          {/* Description */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">About this property</h2>
            <p className="leading-relaxed text-muted-foreground">{item.description}</p>
          </section>

          {/* Features */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Property Features</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: "Reception Area", ok: item.hasReception },
                { label: "Conference Room", ok: item.hasConferenceRoom },
                { label: "Generator / Backup", ok: item.hasGenerator },
                { label: "Lift", ok: item.hasLift },
                { label: "Parking", ok: item.hasParking },
              ].map(({ label, ok }) =>
                ok ? (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" /> {label}
                  </div>
                ) : null,
              )}
              {item.features.map((f: string) => (
                <div
                  key={f}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                </div>
              ))}
            </div>
          </section>

          {/* Rental Info */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Rental Information</h2>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <InfoRow label="Monthly Rent" value={formatBDT(item.rent)} />
                <InfoRow label="Advance" value={formatBDT(item.advance)} />
                <InfoRow label="Min. Contract" value={`${item.minimumContract} months`} />
                <InfoRow label="Available From" value={formatDate(item.availableFrom)} />
                <InfoRow label="Negotiable" value={item.negotiable ? "Yes" : "No"} />
                {item.remarks && <InfoRow label="Remarks" value={item.remarks} />}
              </dl>
            </div>
          </section>

          {/* Rules */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Rules & Terms</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Business type allowed: <span className="text-foreground font-medium">{item.rules.businessTypeAllowed}</span></p>
              <p>• 24/7 access: <span className="text-foreground font-medium">{item.rules.access247 ? "Yes" : "No"}</span></p>
              <p>• Renovation allowed: <span className="text-foreground font-medium">{item.rules.renovationAllowed ? "Yes" : "No"}</span></p>
            </div>
          </section>

          {/* Map */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Location</h2>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border">
              <iframe
                title="map"
                className="h-full w-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.location.lng - 0.01},${item.location.lat - 0.01},${item.location.lng + 0.01},${item.location.lat + 0.01}&layer=mapnik&marker=${item.location.lat},${item.location.lng}`}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{item.contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-1.5 font-semibold">
                  {item.contact.name}
                  {item.contact.verified && <Shield className="h-4 w-4 text-secondary" />}
                </p>
                <p className="text-xs text-muted-foreground">Member since {item.contact.memberSince}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Responds {item.contact.responseTime}
            </div>
            <Separator className="my-4" />
            <div className="mb-4 flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Available from <span className="font-semibold">{formatDate(item.availableFrom)}</span>
            </div>
            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => toast.success("Calling owner...")}>
                <Phone className="h-4 w-4" /> {item.contact.phone}
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link
                  to="/messages"
                  search={{
                    owner: item.contact.name,
                    property: item.name,
                    phone: item.contact.phone,
                    avatar: item.contact.name.slice(0, 2).toUpperCase(),
                  }}
                >
                  <MessageCircle className="h-4 w-4" /> Message owner
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => toast.success("Visit request sent!")}>
                <CalendarDays className="h-4 w-4" /> Schedule Visit
              </Button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Never pay before viewing. Report suspicious listings.
            </p>
          </div>
          <VisitRequestPanel
            advertisementId={advertisementId}
            propertyId={item.id}
            propertyTitle={item.name}
            requesterId={user?.id ?? "guest"}
            requesterName={user?.name ?? "Guest"}
          />
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
