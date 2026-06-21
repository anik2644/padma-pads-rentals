import { api } from "@/lib/api-client";

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

const TYPE_TO_PATH: Record<ResidentialType, string> = {
  hostels: "hostels",
  "single-rooms": "single-rooms",
  "shared-rooms": "shared-rooms",
  sublets: "sublets",
  flats: "flats",
  apartments: "apartments",
};

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
  advertisementId?: string;
  useType?: "RESIDENTIAL" | "COMMERCIAL" | "RECREATIONAL";
  type: string;
  name: string;
  title?: string;
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

// ============ Raw API DTOs ============
interface RawImage {
  url: string;
  caption?: string | null;
}
interface RawBasicInfo {
  propertyName: string;
  title: string;
  description: string;
}
interface RawLocation {
  division: string;
  city: string;
  area: string;
  fullAddress: string;
  gpsLocation?: { lat?: number; lng?: number };
  nearbyLandmark?: string | null;
}
interface RawRules {
  petsAllowed?: boolean | null;
  smokingAllowed?: boolean | null;
  genderRestriction?: string | null;
}
interface RawMedia {
  coverImage?: RawImage | null;
  photos: RawImage[];
  videos: RawImage[];
}
interface RawAudit {
  createdAt: string;
  updatedAt: string;
}
interface RawRentalDetails {
  rentPerSeat?: number;
  monthlyRent?: number;
  advance?: number | null;
  availableFrom?: string | null;
  negotiable?: boolean;
  remarks?: string | null;
}
interface RawProperty {
  id: string;
  ownerId: string;
  advertisementId: string;
  basicInfo: RawBasicInfo;
  location: RawLocation;
  targetGroup?: TargetGroup[];
  rules: RawRules;
  media: RawMedia;
  audit: RawAudit;
  specifications?: Record<string, unknown>;
  rentalDetails?: RawRentalDetails;
}
interface RawAdvertisement {
  id: string;
  coverImage?: RawImage | null;
  approvalStatus?: string;
  listingStatus?: string;
}
interface RawWithAd {
  property: RawProperty;
  advertisement: RawAdvertisement;
}
interface RawListResponse {
  items: RawWithAd[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

function rentFor(
  type: ResidentialType,
  rd?: RawRentalDetails,
): { rent: number; label: "perSeat" | "perMonth" } {
  if (type === "hostels" || type === "shared-rooms") {
    return { rent: rd?.rentPerSeat ?? rd?.monthlyRent ?? 0, label: "perSeat" };
  }
  return { rent: rd?.monthlyRent ?? rd?.rentPerSeat ?? 0, label: "perMonth" };
}

function normalize(type: ResidentialType, raw: RawWithAd): PropertyListItem {
  const p = raw.property;
  const { rent, label } = rentFor(type, p.rentalDetails);
  return {
    id: p.id,
    advertisementId: raw.advertisement?.id,
    type,
    name: p.basicInfo?.propertyName ?? p.basicInfo?.title ?? "Untitled",
    title: p.basicInfo?.title,
    city: p.location?.city,
    area: p.location?.area,
    division: p.location?.division,
    rent,
    rentLabel: label,
    availableFrom: p.rentalDetails?.availableFrom ?? undefined,
    coverImage:
      raw.advertisement?.coverImage?.url ?? p.media?.coverImage?.url ?? p.media?.photos?.[0]?.url,
    targetGroups: p.targetGroup ?? [],
    createdAt: p.audit?.createdAt,
    negotiable: p.rentalDetails?.negotiable,
  };
}

function buildQuery(f: SearchFilters) {
  const q: Record<string, unknown> = {
    page: f.page ?? 1,
    pageSize: f.pageSize ?? 20,
  };
  if (f.city) q.city = f.city;
  if (f.area) q.area = f.area;
  if (f.division) q.division = f.division;
  if (f.minRent != null) q.minRent = f.minRent;
  if (f.maxRent != null) q.maxRent = f.maxRent;
  if (f.availableFrom) q.availableFrom = f.availableFrom;
  if (f.targetGroup?.length) q.targetGroup = f.targetGroup;
  return q;
}

export async function searchResidential(
  types: ResidentialType[],
  filters: SearchFilters,
): Promise<SearchResult> {
  const query = buildQuery(filters);
  const results = await Promise.allSettled(
    types.map((t) =>
      api<RawListResponse>(`/api/v1/properties/residential/${TYPE_TO_PATH[t]}`, { query }).then(
        (res) => ({ type: t, res }),
      ),
    ),
  );

  let items: PropertyListItem[] = [];
  let total = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      items = items.concat(r.value.res.items.map((raw) => normalize(r.value.type, raw)));
      total += r.value.res.meta?.totalItems ?? r.value.res.items.length;
    }
  }
  items.sort((a, b) => (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0));
  return { items, total };
}

export async function countOwnedResidentialListings(ownerId: string): Promise<number> {
  const results = await Promise.allSettled(
    RESIDENTIAL_TYPES.map((type) =>
      api<RawListResponse>(`/api/v1/properties/residential/${TYPE_TO_PATH[type]}`, {
        query: { ownerId, page: 1, pageSize: 1 },
      }),
    ),
  );

  return results.reduce((total, result) => {
    if (result.status !== "fulfilled") return total;
    return total + (result.value.meta?.totalItems ?? result.value.items.length);
  }, 0);
}

export async function listOwnedResidentialListings(
  ownerId: string,
  page = 1,
  pageSize = 20,
): Promise<SearchResult> {
  const results = await Promise.allSettled(
    RESIDENTIAL_TYPES.map((type) =>
      api<RawListResponse>(`/api/v1/properties/residential/${TYPE_TO_PATH[type]}`, {
        query: { ownerId, page, pageSize },
      }).then((res) => ({ type, res })),
    ),
  );

  let items: PropertyListItem[] = [];
  let total = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      items = items.concat(r.value.res.items.map((raw) => normalize(r.value.type, raw)));
      total += r.value.res.meta?.totalItems ?? r.value.res.items.length;
    }
  }
  items.sort((a, b) => (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0));
  return { items, total };
}

export interface PropertyDetail {
  id: string;
  advertisementId: string;
  ownerId: string;
  type: ResidentialType;
  name: string;
  title: string;
  description: string;
  city: string;
  area: string;
  division: string;
  fullAddress: string;
  location: { lat: number; lng: number };
  rent: number;
  rentLabel: "perSeat" | "perMonth";
  negotiable: boolean;
  availableFrom?: string;
  advance?: number;
  gallery: string[];
  videos: string[];
  amenities: string[];
  rules: string[];
  targetGroups: TargetGroup[];
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  floor: number;
  owner: {
    name: string;
    verified: boolean;
    memberSince: string;
    phone: string;
    responseTime: string;
  };
}

function specsToAmenities(specs?: Record<string, unknown>): string[] {
  if (!specs) return [];
  const labels: Record<string, string> = {
    wifiAvailable: "Wi-Fi",
    foodIncluded: "Food included",
    attachedBathroom: "Attached bathroom",
    bedProvided: "Bed provided",
    tableChairProvided: "Table & chair",
    furnished: "Furnished",
    semiFurnished: "Semi-furnished",
    balcony: "Balcony",
    lift: "Lift",
    parking: "Parking",
    generator: "Generator",
    gasConnection: "Gas connection",
    kitchenAccess: "Kitchen access",
    airConditioned: "Air-conditioned",
  };
  return Object.entries(specs)
    .filter(([, v]) => v === true)
    .map(([k]) => labels[k] ?? k);
}

function rulesToList(rules?: RawRules): string[] {
  if (!rules) return [];
  const out: string[] = [];
  if (rules.petsAllowed != null) out.push(rules.petsAllowed ? "Pets allowed" : "No pets");
  if (rules.smokingAllowed != null)
    out.push(rules.smokingAllowed ? "Smoking allowed" : "No smoking");
  if (rules.genderRestriction) out.push(`Gender: ${rules.genderRestriction}`);
  return out;
}

export async function fetchResidentialDetail(
  type: ResidentialType,
  id: string,
): Promise<PropertyDetail | null> {
  const res = await api<RawListResponse>(`/api/v1/properties/residential/${TYPE_TO_PATH[type]}`, {
    query: { id },
  });
  const raw = res.items?.[0];
  if (!raw) return null;
  const p = raw.property;
  const { rent, label } = rentFor(type, p.rentalDetails);
  const specs = (p.specifications ?? {}) as Record<string, unknown>;
  const gallery = [
    raw.advertisement?.coverImage?.url ?? p.media?.coverImage?.url,
    ...(p.media?.photos?.map((ph) => ph.url) ?? []),
  ].filter((x): x is string => !!x);
  const videos = (p.media?.videos?.map((video) => video.url) ?? []).filter((x): x is string => !!x);

  const lat = Number(p.location?.gpsLocation?.lat ?? 23.8103);
  const lng = Number(p.location?.gpsLocation?.lng ?? 90.4125);

  return {
    id: p.id,
    advertisementId: raw.advertisement.id,
    ownerId: p.ownerId,
    type,
    name: p.basicInfo.propertyName,
    title: p.basicInfo.title,
    description: p.basicInfo.description,
    city: p.location.city,
    area: p.location.area,
    division: p.location.division,
    fullAddress: p.location.fullAddress,
    location: { lat, lng },
    rent,
    rentLabel: label,
    negotiable: !!p.rentalDetails?.negotiable,
    availableFrom: p.rentalDetails?.availableFrom ?? undefined,
    advance: p.rentalDetails?.advance ?? undefined,
    gallery: gallery.length
      ? gallery
      : ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200"],
    videos,
    amenities: specsToAmenities(specs),
    rules: rulesToList(p.rules),
    targetGroups: p.targetGroup ?? [],
    bedrooms: Number(specs.bedrooms ?? specs.totalSeats ?? 0),
    bathrooms: Number(specs.bathrooms ?? 0),
    sizeSqft: Number(specs.sizeSqft ?? specs.size ?? 0),
    floor: Number(specs.floor ?? 0),
    owner: {
      name: "Property Owner",
      verified: true,
      memberSince: (p.audit?.createdAt ?? "").slice(0, 4) || "2025",
      phone: "+880 1XXX-XXXXXX",
      responseTime: "within a day",
    },
  };
}
