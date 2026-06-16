import { api } from "@/lib/api";

export type ResidentialType =
  | "hostels"
  | "single-rooms"
  | "shared-rooms"
  | "sublets"
  | "flats"
  | "apartments";

export const RESIDENTIAL_TYPES: ResidentialType[] = [
  "hostels",
  "single-rooms",
  "shared-rooms",
  "sublets",
  "flats",
  "apartments",
];

export type TargetGroup = "STUDENT" | "BACHELOR" | "FAMILY";

export interface SearchFilters {
  city?: string;
  area?: string;
  division?: string;
  targetGroup?: TargetGroup[];
  minRent?: number;
  maxRent?: number;
  availableFrom?: string;
  page?: number;
  pageSize?: number;
}

export interface PropertyListItem {
  id: string;
  type: ResidentialType;
  name: string;
  city?: string;
  area?: string;
  division?: string;
  rent: number;
  rentLabel: "perSeat" | "perMonth";
  availableFrom?: string;
  coverImage?: string;
  targetGroups: TargetGroup[];
  createdAt?: string;
  negotiable?: boolean;
}

interface RawListResponse {
  items?: Array<Record<string, unknown>>;
  meta?: { total?: number; page?: number; pageSize?: number };
}

function pick<T = unknown>(obj: unknown, ...keys: string[]): T | undefined {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur as T;
}

function normalize(raw: Record<string, unknown>, type: ResidentialType): PropertyListItem {
  const property = (raw.property ?? raw) as Record<string, unknown>;
  const ad = (raw.advertisement ?? {}) as Record<string, unknown>;
  const snap = (pick<Record<string, unknown>>(ad, "propertySnapshot") ?? {}) as Record<
    string,
    unknown
  >;

  const cover =
    pick<string>(snap, "coverImage", "url") ??
    pick<string>(property, "coverImage", "url") ??
    pick<string>(property, "coverImageUrl") ??
    undefined;

  const rent =
    (pick<number>(property, "rentPerSeat") as number | undefined) ??
    (pick<number>(property, "monthlyRent") as number | undefined) ??
    (pick<number>(property, "rent") as number | undefined) ??
    0;

  return {
    id: String(pick<string>(property, "id") ?? pick<string>(raw, "id") ?? ""),
    type,
    name:
      pick<string>(property, "name") ??
      pick<string>(property, "title") ??
      "Untitled property",
    city: pick<string>(property, "city"),
    area: pick<string>(property, "area"),
    division: pick<string>(property, "division"),
    rent: typeof rent === "number" ? rent : 0,
    rentLabel: type === "hostels" || type === "shared-rooms" ? "perSeat" : "perMonth",
    availableFrom: pick<string>(property, "availableFrom"),
    coverImage: cover,
    targetGroups:
      (pick<TargetGroup[]>(property, "targetGroups") as TargetGroup[] | undefined) ?? [],
    createdAt: pick<string>(property, "createdAt"),
    negotiable: pick<boolean>(property, "negotiable"),
  };
}

export interface SearchResult {
  items: PropertyListItem[];
  total: number;
}

async function fetchOneType(
  type: ResidentialType,
  filters: SearchFilters,
): Promise<SearchResult> {
  const params: Record<string, unknown> = {
    approvalStatus: "APPROVED",
    listingStatus: "ACTIVE",
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 12,
    sortBy: "createdAt",
    sortOrder: "desc",
  };
  if (filters.city) params.city = filters.city;
  if (filters.area) params.area = filters.area;
  if (filters.division) params.division = filters.division;
  if (filters.minRent != null) params.minRent = filters.minRent;
  if (filters.maxRent != null) params.maxRent = filters.maxRent;
  if (filters.availableFrom) params.availableFrom = filters.availableFrom;
  if (filters.targetGroup?.length) params.targetGroup = filters.targetGroup;

  const { data } = await api.get<RawListResponse>(`/api/v1/properties/residential/${type}`, {
    params,
  });
  const items = (data.items ?? []).map((r) => normalize(r, type));
  return { items, total: data.meta?.total ?? items.length };
}

export async function searchResidential(
  types: ResidentialType[],
  filters: SearchFilters,
): Promise<SearchResult> {
  const results = await Promise.allSettled(types.map((t) => fetchOneType(t, filters)));
  const merged: PropertyListItem[] = [];
  let total = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      merged.push(...r.value.items);
      total += r.value.total;
    }
  }
  merged.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
  return { items: merged, total };
}
