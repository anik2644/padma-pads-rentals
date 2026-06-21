import { api } from "@/lib/api-client";
import type { PropertyListItem, TargetGroup } from "@/lib/residential";

type UseType = "RESIDENTIAL" | "COMMERCIAL" | "RECREATIONAL";

interface AdvertisementImage {
  url?: string | null;
  caption?: string | null;
}

interface AdvertisementProperty {
  id: string;
  advertisementId?: string | null;
  ownerId: string;
  basicInfo?: {
    propertyName?: string | null;
    title?: string | null;
    description?: string | null;
  } | null;
  location?: {
    division?: string | null;
    city?: string | null;
    area?: string | null;
    fullAddress?: string | null;
  } | null;
  targetGroup?: TargetGroup[] | null;
  media?: {
    coverImage?: AdvertisementImage | null;
    photos?: AdvertisementImage[] | null;
  } | null;
  audit?: {
    createdAt?: string | null;
  } | null;
  rentalDetails?: Record<string, unknown> | null;
}

interface Advertisement {
  id: string;
  ownerId: string;
  propertyId: string;
  useType: UseType;
  propertyType?: string[] | null;
  propertyCollection?: string | null;
  approvalStatus?: string | null;
  listingStatus?: string | null;
  coverImage?: AdvertisementImage | null;
}

interface AdvertisementWithProperty {
  property: AdvertisementProperty;
  advertisement: Advertisement;
}

interface AdvertisementListResponse {
  items: AdvertisementWithProperty[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
}

interface AdvertisementListOptions {
  advertisementId?: string;
  propertyId?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

const COLLECTION_TO_CARD_TYPE: Record<string, string> = {
  hostels: "hostels",
  single_rooms: "single-rooms",
  shared_rooms: "shared-rooms",
  sublets: "sublets",
  flats: "flats",
  apartments: "apartments",
  office_spaces: "offices",
  shops: "shops",
  showrooms: "showrooms",
  warehouses: "warehouses",
  restaurant_spaces: "restaurants",
  hotels: "hotels",
  resorts: "resorts",
  guest_houses: "guesthouses",
  motels: "motels",
  holiday_apartments: "holiday-apartments",
  cottages_villas: "villas",
};

const TYPE_TO_CARD_TYPE: Record<string, string> = {
  HOSTEL_MESS: "hostels",
  SINGLE_ROOM: "single-rooms",
  SHARED_ROOM: "shared-rooms",
  SUBLET: "sublets",
  FLAT: "flats",
  APARTMENT: "apartments",
  OFFICE_SPACE: "offices",
  SHOP_RETAIL: "shops",
  SHOWROOM: "showrooms",
  WAREHOUSE_STORAGE: "warehouses",
  RESTAURANT_SPACE: "restaurants",
  HOTEL: "hotels",
  RESORT: "resorts",
  GUEST_HOUSE: "guesthouses",
  MOTEL: "motels",
  HOLIDAY_APARTMENT: "holiday-apartments",
  COTTAGE_VILLA: "villas",
};

function numberField(source: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function stringField(source: Record<string, unknown> | null | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
}

function mapCardType(ad: Advertisement) {
  if (ad.propertyCollection && COLLECTION_TO_CARD_TYPE[ad.propertyCollection]) {
    return COLLECTION_TO_CARD_TYPE[ad.propertyCollection];
  }
  const propertyType = ad.propertyType?.[0];
  if (propertyType && TYPE_TO_CARD_TYPE[propertyType]) return TYPE_TO_CARD_TYPE[propertyType];
  return ad.propertyCollection ?? propertyType?.toLowerCase() ?? "property";
}

function mapAdvertisementItem(raw: AdvertisementWithProperty): PropertyListItem {
  const p = raw.property;
  const ad = raw.advertisement;
  const rental = p.rentalDetails;
  const type = mapCardType(ad);
  const rent = numberField(rental, [
    "rentPerSeat",
    "monthlyRent",
    "rentPerMonth",
    "pricePerNight",
    "rentPerNight",
    "dailyRent",
  ]);

  return {
    id: p.id,
    advertisementId: ad.id ?? p.advertisementId ?? undefined,
    useType: ad.useType,
    type,
    name: p.basicInfo?.propertyName ?? p.basicInfo?.title ?? "Untitled property",
    title: p.basicInfo?.title ?? undefined,
    city: p.location?.city ?? undefined,
    area: p.location?.area ?? undefined,
    division: p.location?.division ?? undefined,
    rent,
    rentLabel:
      type === "hostels" || type === "shared-rooms" || rental?.rentPerSeat != null
        ? "perSeat"
        : "perMonth",
    availableFrom: stringField(rental, "availableFrom"),
    coverImage:
      ad.coverImage?.url ?? p.media?.coverImage?.url ?? p.media?.photos?.[0]?.url ?? undefined,
    targetGroups: p.targetGroup ?? [],
    createdAt: p.audit?.createdAt ?? undefined,
    negotiable: rental?.negotiable === true,
  };
}

export async function listAdvertisements({
  advertisementId,
  propertyId,
  ownerId,
  page = 1,
  pageSize = 20,
}: AdvertisementListOptions) {
  const res = await api<AdvertisementListResponse>("/api/v1/advertisements", {
    query: {
      advertisementId,
      propertyId,
      ownerId,
      page,
      pageSize,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });

  return {
    items: (res.items ?? []).map(mapAdvertisementItem),
    total: res.meta?.totalItems ?? res.items?.length ?? 0,
  };
}

export async function fetchAdvertisementCard(advertisementId: string, propertyId?: string) {
  const res = await listAdvertisements({
    advertisementId,
    propertyId,
    page: 1,
    pageSize: 1,
  });
  return res.items[0] ?? null;
}
