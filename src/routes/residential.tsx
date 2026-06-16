import { createFileRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import {
  searchResidential,
  RESIDENTIAL_TYPES,
  type ResidentialType,
  type TargetGroup,
  type SearchFilters,
} from "@/lib/residential";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/residential")({
  head: () => ({
    meta: [
      { title: "Residential Rentals — HomeBee" },
      {
        name: "description",
        content:
          "Search hostels, flats, sublets, and apartments across Bangladesh. Filter by city, area, budget, and more on HomeBee.",
      },
      { property: "og:title", content: "Residential Rentals — HomeBee" },
      {
        property: "og:description",
        content: "Search hostels, flats, sublets, and apartments across Bangladesh.",
      },
    ],
  }),
  component: ResidentialPage,
});

const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

const TARGET_GROUPS: TargetGroup[] = ["STUDENT", "BACHELOR", "FAMILY"];

interface UiFilters extends SearchFilters {
  types: ResidentialType[];
  furnished?: boolean;
  balcony?: boolean;
  lift?: boolean;
  parking?: boolean;
  wifi?: boolean;
  attachedBathroom?: boolean;
  kitchenAccess?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  gender?: "Male" | "Female" | "Any";
}

const DEFAULT_FILTERS: UiFilters = {
  types: [...RESIDENTIAL_TYPES],
  targetGroup: [],
  page: 1,
  pageSize: 12,
};

function ResidentialPage() {
  const matchRoute = useMatchRoute();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<UiFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<UiFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["residential-search", applied],
    queryFn: () =>
      searchResidential(applied.types, {
        city: applied.city,
        area: applied.area,
        division: applied.division,
        targetGroup: applied.targetGroup,
        minRent: applied.minRent,
        maxRent: applied.maxRent,
        availableFrom: applied.availableFrom,
        page: applied.page,
        pageSize: applied.pageSize,
      }),
    retry: 1,
  });

  if (matchRoute({ to: "/residential/$type/$id" })) return <Outlet />;

  const items = data?.items ?? [];

  const toggleType = (type: ResidentialType) =>
    setFilters((f) => ({
      ...f,
      types: f.types.includes(type)
        ? f.types.filter((x) => x !== type)
        : [...f.types, type],
    }));

  const toggleGroup = (g: TargetGroup) =>
    setFilters((f) => ({
      ...f,
      targetGroup: f.targetGroup?.includes(g)
        ? f.targetGroup.filter((x) => x !== g)
        : [...(f.targetGroup ?? []), g],
    }));

  const submitSearch = () => setApplied({ ...filters, page: 1 });
  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("residential.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("residential.subtitle")}</p>
      </header>

      <SearchPanel
        filters={filters}
        setFilters={setFilters}
        onSubmit={submitSearch}
        onReset={resetAll}
        toggleType={toggleType}
        toggleGroup={toggleGroup}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading || isFetching
            ? t("common.loading")
            : t("residential.results", { count: items.length })}
        </p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </Grid>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState onReset={resetAll} />
        ) : (
          <AnimatePresence mode="popLayout">
            <Grid>
              {items.map((p, i) => (
                <motion.div
                  key={`${p.type}-${p.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <PropertyCard item={p} />
                </motion.div>
              ))}
            </Grid>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function SearchPanel({
  filters,
  setFilters,
  onSubmit,
  onReset,
  toggleType,
  toggleGroup,
}: {
  filters: UiFilters;
  setFilters: React.Dispatch<React.SetStateAction<UiFilters>>;
  onSubmit: () => void;
  onReset: () => void;
  toggleType: (t: ResidentialType) => void;
  toggleGroup: (g: TargetGroup) => void;
}) {
  const { t } = useTranslation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-6"
    >
      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {RESIDENTIAL_TYPES.map((type) => {
          const active = filters.types.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`residential.types.${type}`)}
            </button>
          );
        })}
      </div>

      {/* Main fields */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Select
          value={filters.division ?? ""}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, division: v === "__all" ? undefined : v }))
          }
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t("residential.fields.division")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All divisions</SelectItem>
            {DIVISIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-11"
          placeholder={t("residential.fields.city")}
          value={filters.city ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))}
        />
        <Input
          className="h-11"
          placeholder={t("residential.fields.area")}
          value={filters.area ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value || undefined }))}
        />
        <Input
          className="h-11"
          type="date"
          value={filters.availableFrom ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, availableFrom: e.target.value || undefined }))
          }
        />
      </div>

      {/* Target groups */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          For:
        </span>
        {TARGET_GROUPS.map((g) => {
          const active = filters.targetGroup?.includes(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => toggleGroup(g)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`residential.targetGroups.${g}`)}
            </button>
          );
        })}
      </div>

      {/* Budget */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">Min ৳</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={filters.minRent ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minRent: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">Max ৳</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="100000"
            value={filters.maxRent ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                maxRent: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" className="gap-2">
          <Search className="h-4 w-4" />
          {t("common.search")}
        </Button>
        <AdvancedFiltersDrawer filters={filters} setFilters={setFilters} />
        <Button type="button" variant="ghost" onClick={onReset}>
          {t("common.reset")}
        </Button>

        {filters.targetGroup && filters.targetGroup.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-1">
            {filters.targetGroup.map((g) => (
              <Badge key={g} variant="secondary" className="gap-1">
                {t(`residential.targetGroups.${g}`)}
                <button type="button" onClick={() => toggleGroup(g)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

function AdvancedFiltersDrawer({
  filters,
  setFilters,
}: {
  filters: UiFilters;
  setFilters: React.Dispatch<React.SetStateAction<UiFilters>>;
}) {
  const { t } = useTranslation();
  const toggles: Array<{ key: keyof UiFilters; label: string }> = [
    { key: "furnished",        label: t("residential.fields.furnished") },
    { key: "balcony",          label: t("residential.fields.balcony") },
    { key: "lift",             label: t("residential.fields.lift") },
    { key: "parking",          label: t("residential.fields.parking") },
    { key: "wifi",             label: t("residential.fields.wifi") },
    { key: "attachedBathroom", label: "Attached Bathroom" },
    { key: "kitchenAccess",    label: "Kitchen Access" },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t("common.advancedFilters")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("common.advancedFilters")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("residential.fields.bedrooms")}
              </Label>
              <Input
                type="number"
                value={filters.bedrooms ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("residential.fields.bathrooms")}
              </Label>
              <Input
                type="number"
                value={filters.bathrooms ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    bathrooms: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            {toggles.map((tg) => (
              <div
                key={tg.key as string}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2"
              >
                <Label className="text-sm font-medium">{tg.label}</Label>
                <Switch
                  checked={Boolean(filters[tg.key])}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, [tg.key]: v }))}
                />
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t("residential.fields.gender")}
            </Label>
            <Select
              value={filters.gender ?? ""}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  gender:
                    v === "__any"
                      ? undefined
                      : (v as NonNullable<UiFilters["gender"]>),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Any">No restriction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                furnished: undefined,
                balcony: undefined,
                lift: undefined,
                parking: undefined,
                wifi: undefined,
                attachedBathroom: undefined,
                kitchenAccess: undefined,
                bedrooms: undefined,
                bathrooms: undefined,
                gender: undefined,
              }))
            }
          >
            {t("common.reset")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
      <h3 className="text-lg font-semibold">{t("common.noResults")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try removing some filters or expanding your search area.
      </p>
      <Button onClick={onReset} variant="outline" className="mt-4">
        {t("common.reset")}
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 p-12 text-center">
      <h3 className="text-lg font-semibold text-destructive">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't reach HomeBee's listings server. Check your connection or your API base URL.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        {t("common.retry")}
      </Button>
    </div>
  );
}
