import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Building2, Hotel, Home as HomeIcon, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import { searchResidential, RESIDENTIAL_TYPES } from "@/lib/residential";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeBee — Find Your Next Home in Bangladesh" },
      {
        name: "description",
        content:
          "Browse trusted hostels, flats, sublets, and apartments across Bangladesh. Search by city, area, and budget on HomeBee.",
      },
      { property: "og:title", content: "HomeBee — Find Your Next Home" },
      {
        property: "og:description",
        content: "Browse trusted hostels, flats, sublets, and apartments across Bangladesh.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <Hero />
      <Categories />
      <Featured />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-24 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-5xl px-4 py-16 text-center md:px-6 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {t("common.appName")} · Bangladesh
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight md:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-4 text-balance text-base text-muted-foreground md:text-lg">
            {t("home.heroSubtitle")}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-surface p-2 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            placeholder={t("home.heroPlaceholder")}
            className="h-11 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
          />
          <Button asChild size="lg" className="h-11 rounded-full px-6">
            <Link to="/residential">{t("common.search")}</Link>
          </Button>
        </motion.form>
      </div>
    </section>
  );
}

function Categories() {
  const { t } = useTranslation();
  const cats = [
    {
      title: t("home.categories.residentialTitle"),
      sub: t("home.categories.residentialSub"),
      cta: t("home.categories.residentialCta"),
      Icon: HomeIcon,
      gradient: "brand-gradient-orange",
      to: "/residential" as const,
      available: true,
    },
    {
      title: t("home.categories.commercialTitle"),
      sub: t("home.categories.commercialSub"),
      cta: t("home.categories.commercialCta"),
      Icon: Building2,
      gradient: "brand-gradient-blue",
      to: "/" as const,
      available: false,
    },
    {
      title: t("home.categories.recreationalTitle"),
      sub: t("home.categories.recreationalSub"),
      cta: t("home.categories.recreationalCta"),
      Icon: Hotel,
      gradient: "brand-gradient-teal",
      to: "/" as const,
      available: false,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="grid gap-4 md:grid-cols-3">
        {cats.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={cn(
              "card-hover relative overflow-hidden rounded-3xl p-6 text-white shadow-card",
              c.gradient,
            )}
          >
            {!c.available && (
              <Badge className="absolute right-4 top-4 border-0 bg-white/25 text-white backdrop-blur">
                {t("common.comingSoon")}
              </Badge>
            )}
            <c.Icon className="h-10 w-10 opacity-95" strokeWidth={1.6} />
            <h3 className="mt-6 text-2xl font-bold tracking-tight">{c.title}</h3>
            <p className="mt-1 text-sm text-white/85">{c.sub}</p>
            <div className="mt-6">
              {c.available ? (
                <Button
                  asChild
                  variant="secondary"
                  className="rounded-full bg-white text-foreground hover:bg-white/90"
                >
                  <Link to={c.to}>
                    {c.cta}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  onClick={() => toast.info(t("common.comingSoon"))}
                >
                  {c.cta}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const { t } = useTranslation();
  const types = useMemo(
    () => ["hostels", "single-rooms", "flats", "apartments"] as const,
    [],
  );
  const { data, isLoading, isError } = useQuery({
    queryKey: ["featured-residential"],
    queryFn: () => searchResidential([...types], { page: 1, pageSize: 6 }),
    retry: 1,
  });

  const items = data?.items.slice(0, 10) ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("home.featuredTitle")}
          </h2>
        </div>
        <Button asChild variant="ghost" className="text-primary hover:text-primary-hover">
          <Link to="/residential">
            {t("common.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : isError || items.length === 0 ? (
        <EmptyFeatured />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((p) => (
            <PropertyCard key={`${p.type}-${p.id}`} item={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyFeatured() {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
      <h3 className="font-semibold text-foreground">No featured properties yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect your Firebase auth keys to load live HomeBee listings.
      </p>
      <Button asChild className="mt-4">
        <Link to="/residential">{t("home.categories.residentialCta")}</Link>
      </Button>
    </div>
  );
}
