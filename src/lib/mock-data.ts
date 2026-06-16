import type { PropertyListItem, ResidentialType, TargetGroup } from "@/lib/residential";

const IMG = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${q}?auto=format&fit=crop&w=1200&q=80&ixid=${seed}`;

const PHOTOS = [
  "1568605114967-8130f3a36994",
  "1502672260266-1c1ef2d93688",
  "1505691938895-1758d7feb511",
  "1493809842364-78817add7ffb",
  "1522708323590-d24dbb6b0267",
  "1560448204-e02f11c3d0e2",
  "1600585154340-be6161a56a0c",
  "1600596542815-ffad4c1539a9",
  "1600607687939-ce8a6c25118c",
  "1556909114-f6e7ad7d3136",
  "1560185007-cde436f6a4d0",
  "1554995207-c18c203602cb",
  "1582268611958-ebfd161ef9cf",
  "1598928506311-c55ded91a20c",
  "1484154218962-a197022b5858",
  "1513694203232-719a280e022f",
  "1560448204-603b3fc33ddc",
  "1502005229762-cf1b2da7c5d6",
];

const photo = (i: number) => IMG(PHOTOS[i % PHOTOS.length], i);

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
      coverImage: photo(i + type.length * 3),
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
export type CommercialType = "offices" | "shops" | "showrooms" | "warehouses";
export const COMMERCIAL_TYPES: CommercialType[] = ["offices", "shops", "showrooms", "warehouses"];

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
      name: `${FIRST_NAMES[(ti + i) % FIRST_NAMES.length]} ${type === "warehouses" ? "Depot" : type === "shops" ? "Plaza" : "Center"}`,
      area: areas[i % areas.length],
      city: division === "Dhaka" ? "Dhaka" : "Chattogram",
      division,
      rent: Math.round((lo + r() * (hi - lo)) / 1000) * 1000,
      sizeSqft: 400 + Math.floor(r() * 4500),
      coverImage: photo(i + ti * 4 + 6),
      features: ["Parking", "24/7 Security", "Lift", "Generator"].slice(0, 2 + (i % 3)),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
});

// ===== Recreational =====
export type RecreationalType = "hotels" | "resorts" | "guesthouses" | "villas";
export const RECREATIONAL_TYPES: RecreationalType[] = ["hotels", "resorts", "guesthouses", "villas"];

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
};

export const MOCK_RECREATIONAL: RecreationalItem[] = RECREATIONAL_TYPES.flatMap((type, ti) => {
  const r = rand(ti * 53);
  return Array.from({ length: 6 }, (_, i) => {
    const city = REC_CITIES[(ti + i) % REC_CITIES.length];
    const [lo, hi] = REC_PRICE[type];
    return {
      id: `${type}-${i + 1}`,
      type,
      name: `${FIRST_NAMES[(ti * 2 + i) % FIRST_NAMES.length]} ${type === "resorts" ? "Resort" : type === "villas" ? "Villa" : type === "hotels" ? "Hotel" : "Inn"}`,
      city,
      division: city === "Cox's Bazar" ? "Chattogram" : "Sylhet",
      pricePerNight: Math.round((lo + r() * (hi - lo)) / 500) * 500,
      rating: Math.round((3.8 + r() * 1.2) * 10) / 10,
      coverImage: photo(i + ti * 5 + 10),
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
    gallery: Array.from({ length: 6 }, (_, i) => photo(i + type.length * 2 + 3)),
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
