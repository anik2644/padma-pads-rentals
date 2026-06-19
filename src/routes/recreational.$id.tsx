import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, MapPin, Star, Phone, MessageCircle,
  Heart, Share2, Shield, CheckCircle2, CalendarDays,
  Users, BedDouble, Maximize2, Waves, Utensils, Dumbbell,
  PlaneTakeoff, Car, WashingMachine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getRecreationalDetail } from "@/lib/mock-data";
import { formatBDT } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { VisitRequestPanel } from "@/components/property/VisitRequestPanel";
import { trackPropertyView } from "@/lib/property-view-tracking";
import { createFavorite, deleteFavorite, listFavorites, notifyFavoritesChanged } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recreational/$id")({
  head: () => ({ meta: [{ title: "Hotel & Resort Details — HomeBee" }] }),
  component: RecreationalDetail,
  loader: ({ params }) => {
    const detail = getRecreationalDetail(params.id);
    if (!detail) throw notFound();
    return detail;
  },
  notFoundComponent: RecreationalNotFound,
});

function RecreationalNotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-bold">{t("detail.propertyNotFound")}</h1>
      <Button asChild className="mt-4">
        <Link to="/recreational">{t("actions.backToBrowse")}</Link>
      </Button>
    </div>
  );
}

const FACILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Swimming Pool": Waves,
  "Restaurant": Utensils,
  "Gym": Dumbbell,
  "Airport Pickup": PlaneTakeoff,
  "Car Rental": Car,
  "Laundry": WashingMachine,
};

function RecreationalDetail() {
  const { t } = useTranslation();
  const item = Route.useLoaderData();
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const advertisementId = `recreational-${item.id}`;
  const ownerId = `owner-${item.contact.name.toLowerCase().replace(/\W+/g, "-")}`;

  useEffect(() => {
    trackPropertyView({
      advertisementId,
      propertyId: item.id,
      viewerType: user ? "REGISTERED" : "GUEST",
      viewerId: user?.id,
    }).catch(() => undefined);
  }, [advertisementId, item.id, user]);

  useEffect(() => {
    listFavorites({ advertisementId, propertyId: item.id, pageSize: 1 })
      .then((res) => {
        const favorite = res.items[0];
        setFavoriteId(favorite?.id ?? null);
        setSaved(Boolean(favorite));
      })
      .catch(() => undefined);
  }, [advertisementId, item.id]);

  async function toggleFavorite() {
    try {
      if (favoriteId) {
        await deleteFavorite({ advertisementId });
        setFavoriteId(null);
        setSaved(false);
        notifyFavoritesChanged();
        toast.success(t("actions.removedSaved"));
        return;
      }
      const favorite = await createFavorite({ advertisementId, propertyId: item.id });
      setFavoriteId(favorite.id);
      setSaved(true);
      notifyFavoritesChanged();
      toast.success(t("actions.savedListing"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("actions.updateSavedError"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Link
        to="/recreational"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("detail.backRecreational")}
      </Link>

      {/* Gallery */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted md:col-span-3">
          <img src={item.gallery[activeImg]} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={toggleFavorite}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-105"
              aria-label={t("common.save")}
            >
              <Heart className={cn("h-4 w-4", saved ? "fill-primary text-primary" : "")} />
            </button>
            <button
              onClick={() => toast.success(t("actions.linkCopied"))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-105"
              aria-label={t("actions.share")}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <Badge className="gap-1 border-0 bg-background/90 text-foreground backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {item.rating}
            </Badge>
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
          {/* Title */}
          <div>
            <Badge className="mb-2 capitalize">{t(`recreational.types.${item.type}`, { defaultValue: item.type })}</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{item.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {item.city}, {item.division}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {t("recreational.fields.checkIn")}: <span className="font-medium text-foreground">{item.checkIn}</span>
              &nbsp;·&nbsp; {t("recreational.fields.checkOut")}: <span className="font-medium text-foreground">{item.checkOut}</span>
            </p>
          </div>

          {/* Description */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">{t("detail.about")}</h2>
            <p className="leading-relaxed text-muted-foreground">{item.description}</p>
          </section>

          {/* Facilities */}
          {item.facilities.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("detail.facilities")}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.facilities.map((f: string) => {
                  const Icon = FACILITY_ICONS[f] ?? CheckCircle2;
                  return (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" /> {f}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Services */}
          {item.services.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("detail.services")}</h2>
              <div className="flex flex-wrap gap-2">
                {item.services.map((s: string) => (
                  <Badge key={s} variant="outline" className="gap-1 px-3 py-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-success" /> {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Room Types */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.roomTypes")}</h2>
            <div className="space-y-3">
              {item.rooms.map((room: { type: string; available: number; price: number; occupancy: number; bedType: string; sizeSqft: number }) => (
                <div
                  key={room.type}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{room.type}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {room.bedType}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t("detail.upToGuests", { count: room.occupancy })}</span>
                        <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" /> {room.sizeSqft} {t("commercial.sizeUnit")}</span>
                      </div>
                      <p className="mt-1 text-xs text-success">{t("detail.roomsAvailable", { count: room.available })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{formatBDT(room.price)}</p>
                      <p className="text-xs text-muted-foreground">{t("recreational.perNight")}</p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => toast.success(t("detail.booking", { room: room.type }))}
                      >
                        {t("detail.bookNow")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rules */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.rulesPolicies")}</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• {t("detail.petsAllowed")}: <span className="text-foreground font-medium">{item.rules.petsAllowed ? t("actions.yes") : t("actions.no")}</span></p>
              <p>• {t("detail.smokingAllowed")}: <span className="text-foreground font-medium">{item.rules.smokingAllowed ? t("actions.yes") : t("actions.no")}</span></p>
              <p>• {t("detail.outsideFood")}: <span className="text-foreground font-medium">{item.rules.outsideFoodAllowed ? t("detail.allowed") : t("detail.notAllowed")}</span></p>
              <p>• {t("detail.cancellation")}: <span className="text-foreground font-medium">{item.rules.cancellationPolicy}</span></p>
              <p>• {t("detail.refund")}: <span className="text-foreground font-medium">{item.rules.refundPolicy}</span></p>
            </div>
          </section>

          {/* Map */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.location")}</h2>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border">
              <iframe
                title="map"
                className="h-full w-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.location.lng - 0.05},${item.location.lat - 0.05},${item.location.lng + 0.05},${item.location.lat + 0.05}&layer=mapnik&marker=${item.location.lat},${item.location.lng}`}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("detail.startingFrom")}</p>
              <p className="text-3xl font-bold text-primary">{formatBDT(item.pricePerNight)}</p>
              <p className="text-sm text-muted-foreground">{t("recreational.perNight")}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{item.rating}</span>
                <span className="text-xs text-muted-foreground">{t("detail.rating")}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{item.contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {item.contact.name}
                  {item.contact.verified && <Shield className="h-3.5 w-3.5 text-secondary" />}
                </p>
                <p className="text-xs text-muted-foreground">{item.contact.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button className="w-full gap-2" onClick={() => toast.success(t("detail.proceedBooking"))}>
                {t("detail.bookNow")}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => toast.success(t("detail.callingProperty"))}
              >
                <Phone className="h-4 w-4" /> {item.contact.phone}
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link
                  to="/messages"
                  search={{
                    owner: item.contact.name,
                    property: item.name,
                    advertisementId,
                    propertyId: item.id,
                    receiverId: ownerId,
                    phone: item.contact.phone,
                    avatar: item.contact.name.slice(0, 2).toUpperCase(),
                  }}
                >
                  <MessageCircle className="h-4 w-4" /> {t("detail.message")}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              {t("detail.freeCancellation")}
            </p>
          </div>
          <VisitRequestPanel
            advertisementId={advertisementId}
            propertyId={item.id}
            requesterName={user?.name ?? "Guest"}
          />
        </aside>
      </div>
    </div>
  );
}
