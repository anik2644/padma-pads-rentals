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

export interface SearchResult {
  items: PropertyListItem[];
  total: number;
}

// Mock-data backed search. Replace with real API later.
export async function searchResidential(
  types: ResidentialType[],
  filters: SearchFilters,
): Promise<SearchResult> {
  const { MOCK_RESIDENTIAL } = await import("@/lib/mock-data");
  let items = MOCK_RESIDENTIAL.filter((p) => types.includes(p.type));

  if (filters.division) items = items.filter((p) => p.division === filters.division);
  if (filters.city)
    items = items.filter((p) => p.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters.area)
    items = items.filter((p) => p.area?.toLowerCase().includes(filters.area!.toLowerCase()));
  if (filters.minRent != null) items = items.filter((p) => p.rent >= filters.minRent!);
  if (filters.maxRent != null) items = items.filter((p) => p.rent <= filters.maxRent!);
  if (filters.targetGroup?.length)
    items = items.filter((p) => filters.targetGroup!.some((g) => p.targetGroups.includes(g)));

  items = [...items].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  // simulate network latency
  await new Promise((r) => setTimeout(r, 250));
  return { items, total: items.length };
}
