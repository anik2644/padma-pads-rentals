import type { PropertyListItem, ResidentialType, TargetGroup } from "@/lib/residential";
import {
  RESIDENTIAL_ASSET_IMAGES,
  RESIDENTIAL_IMAGE_BY_TYPE,
  COMMERCIAL_ASSET_IMAGES,
  COMMERCIAL_IMAGE_BY_TYPE,
  RECREATIONAL_ASSET_IMAGES,
  RECREATIONAL_IMAGE_BY_TYPE,
} from "@/assets/images";

// Pick a local asset image, cycling through the array when there are more items than images.
const photo = (type: ResidentialType, i: number): string =>
  RESIDENTIAL_IMAGE_BY_TYPE[type] ?? RESIDENTIAL_ASSET_IMAGES[i % RESIDENTIAL_ASSET_IMAGES.length];

const commercialPhoto = (type: string, i: number): string =>
  COMMERCIAL_IMAGE_BY_TYPE[type] ?? COMMERCIAL_ASSET_IMAGES[i % COMMERCIAL_ASSET_IMAGES.length];

const recreationalPhoto = (type: string, i: number): string =>
  RECREATIONAL_IMAGE_BY_TYPE[type] ?? RECREATIONAL_ASSET_IMAGES[i % RECREATIONAL_ASSET_IMAGES.length];

const DHAKA_AREAS = ["Dhanmondi", "Gulshan", "Banani", "Mirpur", "Uttara", "Mohammadpur", "Bashundhara", "Tejgaon", "Wari"];
const CTG_AREAS = ["Agrabad", "Halishahar", "Khulshi", "Nasirabad", "GEC Circle"];

const FIRST_NAMES = ["Sunset", "Green", "Royal", "Lakeview", "Bee", "Pine", "Skyline", "Pearl", "Amber", "Maple", "Crystal", "Silver", "Riverside", "Urban", "Cozy", "Hilltop", "Garden", "Aurora"];
const SECOND = ["Heights", "Residency", "Nest", "Hive", "Villa", "Tower", "Court", "Square", "Apartments", "Hostel", "Lodge", "Suites"];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const TYPE_RENT_BASE: Record<ResidentialType, [number, number]> = {
  hostels: [3500, 8000],
  "single-rooms": [6000, 14000],
  "shared-rooms": [3000, 7000],
  sublets: [8000, 18000],
  flats: [15000, 45000],
  apartments: [25000, 90000],
};

const TYPE_GROUPS: Record<ResidentialType, TargetGroup[][]> = {
  hostels: [["STUDENT"], ["STUDENT", "BACHELOR"]],
  "single-rooms": [["BACHELOR"], ["STUDENT", "BACHELOR"]],
  "shared-rooms": [["STUDENT"], ["BACHELOR"]],
  sublets: [["BACHELOR"], ["FAMILY"]],
  flats: [["FAMILY"], ["BACHELOR", "FAMILY"]],
  apartments: [["FAMILY"]],
};

function buildResidential(type: ResidentialType, count: number): PropertyListItem[] {
  const r = rand(type.length * 17 + count);
  return Array.from({ length: count }, (_, i) => {
    const division = r() > 0.3 ? "Dhaka" : "Chattogram";
    const areas = division === "Dhaka" ? DHAKA_AREAS : CTG_AREAS;
    const area = areas[Math.floor(r() * areas.length)];
    const [lo, hi] = TYPE_RENT_BASE[type];
    const rent = Math.round((lo + r() * (hi - lo)) / 500) * 500;
    const groups = TYPE_GROUPS[type][Math.floor(r() * TYPE_GROUPS[type].length)];
    const name = `${FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]} ${SECOND[Math.floor(r() * SECOND.length)]}`;
    const monthOffset = Math.floor(r() * 60);
    const d = new Date();
    d.setDate(d.getDate() + monthOffset);
    return {
      id: `${type}-${i + 1}`,
      type,
      name,
      city: division === "Dhaka" ? "Dhaka" : "Chattogram",
      area,
      division,
      rent,
      rentLabel: type === "hostels" || type === "shared-rooms" ? "perSeat" : "perMonth",
      availableFrom: d.toISOString(),
      coverImage: photo(type, i),
      targetGroups: groups,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      negotiable: r() > 0.6,
    };
  });
}

export const MOCK_RESIDENTIAL: PropertyListItem[] = [
  ...buildResidential("hostels", 8),
  ...buildResidential("single-rooms", 7),
  ...buildResidential("shared-rooms", 5),
  ...buildResidential("sublets", 6),
  ...buildResidential("flats", 10),
  ...buildResidential("apartments", 8),
];

// ===== Commercial =====
export type CommercialType = "offices" | "shops" | "showrooms" | "warehouses" | "restaurants";
export const COMMERCIAL_TYPES: CommercialType[] = ["offices", "shops", "showrooms", "warehouses", "restaurants"];

export interface CommercialItem {
  id: string;
  type: CommercialType;
  name: string;
  area: string;
  city: string;
  division: string;
  rent: number;
  sizeSqft: number;
  coverImage: string;
  features: string[];
  createdAt: string;
}

const COMM_RENT: Record<CommercialType, [number, number]> = {
  offices: [25000, 120000],
  shops: [15000, 70000],
  showrooms: [40000, 200000],
  warehouses: [30000, 150000],
  restaurants: [20000, 90000],
};

export const MOCK_COMMERCIAL: CommercialItem[] = COMMERCIAL_TYPES.flatMap((type, ti) => {
  const r = rand(ti * 31);
  return Array.from({ length: 6 }, (_, i) => {
    const division = r() > 0.4 ? "Dhaka" : "Chattogram";
    const areas = division === "Dhaka" ? DHAKA_AREAS : CTG_AREAS;
    const [lo, hi] = COMM_RENT[type];
    return {
      id: `${type}-${i + 1}`,
      type,
      name: `${FIRST_NAMES[(ti + i) % FIRST_NAMES.length]} ${type === "warehouses" ? "Depot" : type === "shops" ? "Plaza" : type === "restaurants" ? "Kitchen" : "Center"}`,
      area: areas[i % areas.length],
      city: division === "Dhaka" ? "Dhaka" : "Chattogram",
      division,
      rent: Math.round((lo + r() * (hi - lo)) / 1000) * 1000,
      sizeSqft: 400 + Math.floor(r() * 4500),
      coverImage: commercialPhoto(type, i),
      features: ["Parking", "24/7 Security", "Lift", "Generator"].slice(0, 2 + (i % 3)),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
});

// ===== Recreational =====
export type RecreationalType = "hotels" | "resorts" | "guesthouses" | "villas" | "motels" | "cottages";
export const RECREATIONAL_TYPES: RecreationalType[] = ["hotels", "resorts", "guesthouses", "villas", "motels", "cottages"];

export interface RecreationalItem {
  id: string;
  type: RecreationalType;
  name: string;
  city: string;
  division: string;
  pricePerNight: number;
  rating: number;
  coverImage: string;
  amenities: string[];
}

const REC_CITIES = ["Cox's Bazar", "Sylhet", "Bandarban", "Sajek", "Kuakata", "Sreemangal"];
const REC_PRICE: Record<RecreationalType, [number, number]> = {
  hotels: [3500, 12000],
  resorts: [6000, 25000],
  guesthouses: [2000, 6000],
  villas: [8000, 35000],
  motels: [1500, 5000],
  cottages: [3000, 15000],
};

export const MOCK_RECREATIONAL: RecreationalItem[] = RECREATIONAL_TYPES.flatMap((type, ti) => {
  const r = rand(ti * 53);
  return Array.from({ length: 6 }, (_, i) => {
    const city = REC_CITIES[(ti + i) % REC_CITIES.length];
    const [lo, hi] = REC_PRICE[type];
    return {
      id: `${type}-${i + 1}`,
      type,
      name: `${FIRST_NAMES[(ti * 2 + i) % FIRST_NAMES.length]} ${type === "resorts" ? "Resort" : type === "villas" ? "Villa" : type === "hotels" ? "Hotel" : type === "cottages" ? "Cottage" : type === "motels" ? "Motel" : "Inn"}`,
      city,
      division: city === "Cox's Bazar" ? "Chattogram" : "Sylhet",
      pricePerNight: Math.round((lo + r() * (hi - lo)) / 500) * 500,
      rating: Math.round((3.8 + r() * 1.2) * 10) / 10,
      coverImage: recreationalPhoto(type, i),
      amenities: ["WiFi", "Pool", "Breakfast", "AC", "Parking", "Spa"].slice(0, 3 + (i % 3)),
    };
  });
});

// ===== Detail extension =====
export function getResidentialDetail(type: ResidentialType, id: string) {
  const item = MOCK_RESIDENTIAL.find((p) => p.type === type && p.id === id);
  if (!item) return null;
  const seedFn = rand(id.length * 19);
  return {
    ...item,
    gallery: Array.from({ length: 6 }, (_, i) => photo(type, i)),
    description:
      "A bright, well-ventilated property in a quiet, safe neighbourhood. Walking distance to grocery, pharmacy, and public transport. Newly painted, professionally cleaned, and ready to move in. Owner is friendly and responsive — viewings welcome on short notice.",
    bedrooms: type === "flats" || type === "apartments" ? 2 + Math.floor(seedFn() * 3) : 1,
    bathrooms: 1 + Math.floor(seedFn() * 2),
    sizeSqft: 350 + Math.floor(seedFn() * 1400),
    floor: 1 + Math.floor(seedFn() * 8),
    amenities: ["WiFi", "Lift", "Parking", "Generator", "24/7 Water", "Security", "Balcony", "Furnished"].filter(() => seedFn() > 0.35),
    rules: ["No smoking inside", "Quiet hours after 10 PM", "Guests with prior notice"],
    location: { lat: 23.7806 + (seedFn() - 0.5) * 0.06, lng: 90.4074 + (seedFn() - 0.5) * 0.06 },
    owner: {
      name: ["Rahim Uddin", "Karim Hossain", "Nadia Akhter", "Sajid Khan"][Math.floor(seedFn() * 4)],
      phone: "+8801712345678",
      verified: true,
      memberSince: "2024",
      responseTime: "within 1 hour",
    },
  };
}

export function getCommercialDetail(id: string) {
  const item = MOCK_COMMERCIAL.find((p) => p.id === id);
  if (!item) return null;
  const s = rand(id.length * 23 + 7);
  return {
    ...item,
    gallery: Array.from({ length: 6 }, (_, i) => commercialPhoto(item.type, i)),
    description:
      "A prime commercial space in a well-connected business hub with modern infrastructure, 24/7 security, and professional management. Ideal for businesses seeking a prestigious address with full amenities.",
    rooms: 3 + Math.floor(s() * 8),
    cabins: Math.floor(s() * 5),
    hasReception: s() > 0.4,
    hasConferenceRoom: s() > 0.5,
    hasGenerator: s() > 0.45,
    hasLift: s() > 0.5,
    hasParking: s() > 0.35,
    floorNumber: 1 + Math.floor(s() * 10),
    advance: item.rent * (2 + Math.floor(s() * 3)),
    availableFrom: new Date(Date.now() + Math.floor(s() * 45) * 86400000).toISOString(),
    minimumContract: [6, 12, 24][Math.floor(s() * 3)],
    negotiable: s() > 0.4,
    remarks: "Serious inquiries only. Lease agreement required.",
    rules: {
      businessTypeAllowed: "Any legal commercial activity",
      access247: s() > 0.5,
      renovationAllowed: s() > 0.55,
    },
    location: { lat: 23.7806 + (s() - 0.5) * 0.06, lng: 90.4074 + (s() - 0.5) * 0.06 },
    contact: {
      name: ["Metro Properties BD", "Prime Commercial Spaces", "Dhaka Business Hub", "Urban Assets Ltd"][Math.floor(s() * 4)],
      phone: "+8801812345678",
      whatsapp: "+8801812345678",
      email: "info@primespaces.com.bd",
      verified: true,
      memberSince: "2022",
      responseTime: "within 2 hours",
    },
  };
}

export function getRecreationalDetail(id: string) {
  const item = MOCK_RECREATIONAL.find((p) => p.id === id);
  if (!item) return null;
  const s = rand(id.length * 31 + 11);
  const roomBase = item.pricePerNight;
  return {
    ...item,
    gallery: Array.from({ length: 6 }, (_, i) => recreationalPhoto(item.type, i)),
    description:
      "A stunning property offering premium hospitality in a breathtaking natural setting. Every corner is thoughtfully designed to deliver an unforgettable stay — from elegantly furnished rooms to world-class facilities.",
    checkIn: "12:00 PM",
    checkOut: "11:00 AM",
    facilities: ["Swimming Pool", "Restaurant", "Conference Hall", "Gym", "Garden", "Parking", "BBQ Area", "Beach Access"].filter(() => s() > 0.45),
    services: ["Room Service", "Laundry", "Tour Assistance", "Airport Pickup", "Car Rental"].filter(() => s() > 0.5),
    rooms: [
      {
        type: "Standard Room",
        available: 3 + Math.floor(s() * 5),
        price: roomBase,
        occupancy: 2,
        bedType: "Double",
        sizeSqft: 200 + Math.floor(s() * 80),
      },
      {
        type: "Deluxe Room",
        available: 2 + Math.floor(s() * 3),
        price: Math.round((roomBase * 1.5) / 500) * 500,
        occupancy: 2,
        bedType: "Queen",
        sizeSqft: 280 + Math.floor(s() * 100),
      },
      {
        type: "Family Suite",
        available: 1 + Math.floor(s() * 2),
        price: Math.round((roomBase * 2.2) / 500) * 500,
        occupancy: 4,
        bedType: "King + Twin",
        sizeSqft: 420 + Math.floor(s() * 150),
      },
    ],
    rules: {
      petsAllowed: s() > 0.7,
      smokingAllowed: s() > 0.65,
      outsideFoodAllowed: s() > 0.55,
      cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
      refundPolicy: "Full refund for cancellations made 48+ hours in advance.",
    },
    location: { lat: 21.4272 + (s() - 0.5) * 0.4, lng: 92.0058 + (s() - 0.5) * 0.4 },
    contact: {
      name: ["Scenic Stays BD", "Premier Hotels Group", "Hospitality Holdings Ltd"][Math.floor(s() * 3)],
      phone: "+8801912345678",
      whatsapp: "+8801912345678",
      email: "bookings@scenicstays.com.bd",
      website: "https://scenicstays.com.bd",
      verified: true,
    },
  };
}

// ===== Saved / messages / notifications =====
export const MOCK_SAVED_IDS = ["flats-1", "apartments-2", "hostels-3"];

export const MOCK_MESSAGES = [
  {
    id: "m1",
    name: "Rahim Uddin",
    property: "Sunset Heights",
    lastMessage: "Sure, you can visit tomorrow at 5 PM.",
    time: "2m",
    unread: 2,
    avatar: "RU",
  },
  {
    id: "m2",
    name: "Nadia Akhter",
    property: "Green Nest Hostel",
    lastMessage: "Rent is negotiable for 12-month lease.",
    time: "1h",
    unread: 0,
    avatar: "NA",
  },
  {
    id: "m3",
    name: "Sajid Khan",
    property: "Pearl Apartments",
    lastMessage: "Sent you the deposit details.",
    time: "Yesterday",
    unread: 1,
    avatar: "SK",
  },
];

export const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "New listing matches your search", body: "3 new flats in Dhanmondi under ৳30,000", time: "10m", unread: true },
  { id: "n2", title: "Rahim replied to your enquiry", body: "View the message in your inbox", time: "1h", unread: true },
  { id: "n3", title: "Price dropped on saved property", body: "Pearl Apartments — now ৳35,000/month", time: "3h", unread: false },
  { id: "n4", title: "Your account is verified", body: "You can now contact owners directly", time: "2d", unread: false },
];
