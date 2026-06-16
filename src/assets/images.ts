/**
 * Local asset image registry.
 *
 * Files live in public/assets/images/<category>/
 * and are served at the matching URL path.
 *
 * To add your own images:
 *   1. Drop files into the relevant subfolder under public/assets/images/
 *   2. Add the path to the array below — the mock data will cycle through them automatically.
 *
 * Supported formats: .jpg, .jpeg, .png, .webp, .svg, .avif
 */

// ─── Residential ──────────────────────────────────────────────────────────────
export const RESIDENTIAL_ASSET_IMAGES: string[] = [
  "/assets/images/residential/hostel.svg",
  "/assets/images/residential/single-room.svg",
  "/assets/images/residential/shared-room.svg",
  "/assets/images/residential/sublet.svg",
  "/assets/images/residential/flat.svg",
  "/assets/images/residential/apartment.svg",
];

// Convenience map: pick a type-specific image first, fall back to cycling the full list.
export const RESIDENTIAL_IMAGE_BY_TYPE: Record<string, string> = {
  hostels:        "/assets/images/residential/hostel.svg",
  "single-rooms": "/assets/images/residential/single-room.svg",
  "shared-rooms": "/assets/images/residential/shared-room.svg",
  sublets:        "/assets/images/residential/sublet.svg",
  flats:          "/assets/images/residential/flat.svg",
  apartments:     "/assets/images/residential/apartment.svg",
};

// ─── Commercial ───────────────────────────────────────────────────────────────
export const COMMERCIAL_ASSET_IMAGES: string[] = [
  "/assets/images/commercial/office.svg",
  "/assets/images/commercial/shop.svg",
  "/assets/images/commercial/showroom.svg",
  "/assets/images/commercial/warehouse.svg",
];

export const COMMERCIAL_IMAGE_BY_TYPE: Record<string, string> = {
  offices:     "/assets/images/commercial/office.svg",
  shops:       "/assets/images/commercial/shop.svg",
  showrooms:   "/assets/images/commercial/showroom.svg",
  warehouses:  "/assets/images/commercial/warehouse.svg",
  restaurants: "/assets/images/commercial/shop.svg",
};

// ─── Recreational ─────────────────────────────────────────────────────────────
export const RECREATIONAL_ASSET_IMAGES: string[] = [
  "/assets/images/recreational/hotel.svg",
  "/assets/images/recreational/resort.svg",
  "/assets/images/recreational/villa.svg",
  "/assets/images/recreational/guesthouse.svg",
];

export const RECREATIONAL_IMAGE_BY_TYPE: Record<string, string> = {
  hotels:      "/assets/images/recreational/hotel.svg",
  resorts:     "/assets/images/recreational/resort.svg",
  guesthouses: "/assets/images/recreational/guesthouse.svg",
  villas:      "/assets/images/recreational/villa.svg",
  motels:      "/assets/images/recreational/hotel.svg",
  cottages:    "/assets/images/recreational/guesthouse.svg",
};
