import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize2, Building2, Phone, MessageCircle,
  Heart, Share2, Shield, Clock, CheckCircle2, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { fetchResidentialDetail, type ResidentialType } from "@/lib/residential";
import { formatBDT, formatDate } from "@/lib/format";
import { useLanguageStore } from "@/store/languageStore";
import { useAuthStore } from "@/store/authStore";
import { VisitRequestPanel } from "@/components/property/VisitRequestPanel";
import { trackPropertyView } from "@/lib/property-view-tracking";
import { createFavorite, deleteFavorite, listFavorites, notifyFavoritesChanged } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/residential/$type/$id")({
  component: PropertyDetail,
  loader: async ({ params }) => {
    const detail = await fetchResidentialDetail(params.type as ResidentialType, params.id);
    if (!detail) throw notFound();
    return detail;
  },
  errorComponent: ResidentialError,
  notFoundComponent: ResidentialNotFound,
});

function ResidentialError({ error }: { error: Error }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-bold">{t("detail.couldNotLoad")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-4"><Link to="/residential">{t("actions.backToBrowse")}</Link></Button>
    </div>
  );
}

function ResidentialNotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-bold">{t("detail.propertyNotFound")}</h1>
      <Button asChild className="mt-4"><Link to="/residential">{t("actions.backToBrowse")}</Link></Button>
    </div>
  );
}

function PropertyDetail() {
  const { t } = useTranslation();
  const item = Route.useLoaderData();
  const { lang } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const advertisementId = item.advertisementId;

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
      <Link to="/residential" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("actions.backToBrowse")}
      </Link>

      {/* Gallery */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-3 aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
          <img src={item.gallery[activeImg]} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button onClick={toggleFavorite} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur hover:scale-105 transition" aria-label={t("common.save")}>
              <Heart className={cn("h-4 w-4", saved ? "fill-primary text-primary" : "")} />
            </button>
            <button onClick={() => toast.success(t("actions.linkCopied"))} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur hover:scale-105 transition" aria-label={t("actions.share")}>
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {item.gallery.slice(0, 4).map((g: string, i: number) => (
            <button key={i} onClick={() => setActiveImg(i)} className={cn("aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition", i === activeImg ? "ring-primary" : "ring-transparent hover:ring-border")}>
              <img src={g} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="mb-2 capitalize">{item.type.replace("-", " ")}</Badge>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{item.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {item.area}, {item.city}, {item.division}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatBDT(item.rent)}</p>
                <p className="text-sm text-muted-foreground">{item.rentLabel === "perSeat" ? "/seat/month" : "/month"}</p>
                {item.negotiable && <Badge variant="secondary" className="mt-1">{t("detail.negotiable")}</Badge>}
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={BedDouble} label={t("detail.bedrooms")} value={String(item.bedrooms)} />
            <Stat icon={Bath} label={t("detail.bathrooms")} value={String(item.bathrooms)} />
            <Stat icon={Maximize2} label={t("detail.size")} value={`${item.sizeSqft} ${t("commercial.sizeUnit")}`} />
            <Stat icon={Building2} label={t("detail.floor")} value={`${item.floor}th`} />
          </div>

          <section>
            <h2 className="mb-2 text-lg font-semibold">{t("detail.about")}</h2>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.amenities")}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {item.amenities.map((a: string) => (
                <div key={a} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {a}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.houseRules")}</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {item.rules.map((r: string) => <li key={r}>• {r}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("detail.location")}</h2>
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
              <Avatar className="h-12 w-12"><AvatarFallback>{item.owner.name.split(" ").map((p: string) => p[0]).join("")}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold flex items-center gap-1.5">
                  {item.owner.name}
                  {item.owner.verified && <Shield className="h-4 w-4 text-secondary" />}
                </p>
                <p className="text-xs text-muted-foreground">{t("detail.memberSince", { year: item.owner.memberSince })}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {t("detail.responds", { time: item.owner.responseTime })}
            </div>
            <Separator className="my-4" />
            {item.availableFrom && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t("detail.availableFrom")} <span className="font-semibold">{formatDate(item.availableFrom, lang)}</span>
              </div>
            )}
            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => toast.success(t("detail.ownerNotified"))}>
                <Phone className="h-4 w-4" /> 🇧🇩 {item.owner.phone}
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link
                  to="/messages"
                  search={{
                    owner: item.owner.name,
                    property: item.name,
                    advertisementId,
                    propertyId: item.id,
                    receiverId: item.ownerId,
                    phone: item.owner.phone,
                    avatar: item.owner.name
                      .split(" ")
                      .map((p: string) => p[0])
                      .join(""),
                  }}
                >
                  <MessageCircle className="h-4 w-4" /> {t("detail.messageOwner")}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              {t("detail.safety")}
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

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
