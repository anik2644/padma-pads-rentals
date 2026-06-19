import { api } from "@/lib/api-client";

export type UseType = "RESIDENTIAL" | "COMMERCIAL" | "RECREATIONAL";

export type ResidentialPropertyType =
  | "HOSTEL_MESS"
  | "SINGLE_ROOM"
  | "SHARED_ROOM"
  | "SUBLET"
  | "FLAT"
  | "APARTMENT";

const RESIDENTIAL_ENDPOINT: Record<ResidentialPropertyType, string> = {
  HOSTEL_MESS: "/api/v1/properties/residential/hostels",
  SINGLE_ROOM: "/api/v1/properties/residential/single-rooms",
  SHARED_ROOM: "/api/v1/properties/residential/shared-rooms",
  SUBLET: "/api/v1/properties/residential/sublets",
  FLAT: "/api/v1/properties/residential/flats",
  APARTMENT: "/api/v1/properties/residential/apartments",
};

export interface MediaFile {
  file: File;
  caption: string;
  preview: string;
}

export interface WizardData {
  // Page 1 — Core Setup
  useType: UseType | "";
  propertyType: string;

  // Identity
  propertyName: string;
  title: string;
  description: string;

  // Location
  division: string;
  city: string;
  area: string;
  fullAddress: string;
  latitude: string;
  longitude: string;
  nearbyLandmark: string;

  // Contact (UI only — not in current API schema)
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  contactEmail: string;
  commPreferences: string[];

  // Target Group
  targetGroup: string[];

  // Page 2 — Specs (flat fields, assembled per type on submit)
  // Hostel / Mess
  totalSeats: string;
  availableSeats: string;
  sharingType: string;
  bedProvided: boolean;
  tableChairProvided: boolean;
  attachedBathroom: boolean;
  foodIncluded: boolean;
  wifiAvailable: boolean;

  // Single Room / Sublet
  roomSize: string;
  furnished: boolean;
  balcony: boolean;
  kitchenAccess: string;
  floorNumber: string;

  // Shared Room (extends single room specs)
  totalBeds: string;
  availableBeds: string;
  sharedBedProvided: boolean;

  // Flat / Apartment
  bedrooms: string;
  bathrooms: string;
  balconyCount: string;
  drawingRoom: boolean;
  dining: boolean;
  kitchen: string;
  lift: boolean;
  parking: boolean;
  squareFeet: string;

  // Rules
  petsAllowed: boolean | null;
  smokingAllowed: boolean | null;
  genderRestriction: string;

  // Media
  coverImageFile: File | null;
  coverImageCaption: string;
  coverImagePreview: string;
  photoFiles: MediaFile[];
  videoFiles: MediaFile[];

  // Page 3 — Rental (flat fields per type)
  // Hostel
  rentPerSeat: string;
  mealCost: string;

  // Single/Sublet/Shared
  monthlyRent: string;
  utilityIncluded: boolean;
  rentType: string;

  // Flat/Apartment
  serviceCharge: string;
  utilities: string;

  // Common
  advance: string;
  availableFrom: string;
  negotiable: boolean;
  remarks: string;

  // Commercial mock specs
  floorArea: string;
  commercialRooms: string;
  cabins: string;
  receptionArea: boolean;
  acAvailable: boolean;
  generatorAvailable: boolean;
  internetReady: boolean;
  shopSize: string;
  frontWidth: string;
  glassFront: boolean;
  storageSpace: boolean;
  footTrafficLevel: string;
  ceilingHeight: string;
  loadingFacility: boolean;
  truckAccess: boolean;
  security: boolean;
  electricityType: string;
  kitchenSpace: boolean;
  gasLine: boolean;
  seatingCapacity: string;
  exhaustSystem: boolean;
  visibilityType: string;
  minimumContractDuration: string;

  // Recreational mock specs
  starRating: string;
  totalRooms: string;
  hasPool: boolean;
  hasGym: boolean;
  hasRestaurant: boolean;
  hasConferenceHall: boolean;
  hasPlayground: boolean;
  hasBBQArea: boolean;
  hasGarden: boolean;
  hasScenic: boolean;
  hasAirportPickup: boolean;
  hasRoomService: boolean;
  hasLaundry: boolean;
  hasTourAssistance: boolean;
  hasCarRental: boolean;
  outsideFoodAllowed: boolean | null;
  cancellationPolicy: string;
  refundPolicy: string;

  // Recreational pricing
  pricePerNight: string;
  weekendPrice: string;
  holidayPrice: string;
  extraBedCost: string;
  minimumStay: string;
  taxIncluded: boolean;
  recServiceCharge: string;
}

export const INITIAL_WIZARD_DATA: WizardData = {
  useType: "",
  propertyType: "",
  propertyName: "",
  title: "",
  description: "",
  division: "",
  city: "",
  area: "",
  fullAddress: "",
  latitude: "23.8103",
  longitude: "90.4125",
  nearbyLandmark: "",
  contactPerson: "",
  mobile: "",
  whatsapp: "",
  contactEmail: "",
  commPreferences: [],
  targetGroup: [],
  totalSeats: "",
  availableSeats: "",
  sharingType: "TWO_PERSON",
  bedProvided: true,
  tableChairProvided: true,
  attachedBathroom: false,
  foodIncluded: false,
  wifiAvailable: false,
  roomSize: "",
  furnished: false,
  balcony: false,
  kitchenAccess: "NONE",
  floorNumber: "",
  totalBeds: "",
  availableBeds: "",
  sharedBedProvided: false,
  bedrooms: "",
  bathrooms: "",
  balconyCount: "0",
  drawingRoom: false,
  dining: false,
  kitchen: "1",
  lift: false,
  parking: false,
  squareFeet: "",
  petsAllowed: null,
  smokingAllowed: null,
  genderRestriction: "",
  coverImageFile: null,
  coverImageCaption: "",
  coverImagePreview: "",
  photoFiles: [],
  videoFiles: [],
  rentPerSeat: "",
  mealCost: "",
  monthlyRent: "",
  utilityIncluded: false,
  rentType: "PER_BED",
  serviceCharge: "",
  utilities: "",
  advance: "",
  availableFrom: "",
  negotiable: false,
  remarks: "",
  floorArea: "",
  commercialRooms: "",
  cabins: "",
  receptionArea: false,
  acAvailable: false,
  generatorAvailable: false,
  internetReady: false,
  shopSize: "",
  frontWidth: "",
  glassFront: false,
  storageSpace: false,
  footTrafficLevel: "",
  ceilingHeight: "",
  loadingFacility: false,
  truckAccess: false,
  security: false,
  electricityType: "",
  kitchenSpace: false,
  gasLine: false,
  seatingCapacity: "",
  exhaustSystem: false,
  visibilityType: "",
  minimumContractDuration: "",
  starRating: "",
  totalRooms: "",
  hasPool: false,
  hasGym: false,
  hasRestaurant: false,
  hasConferenceHall: false,
  hasPlayground: false,
  hasBBQArea: false,
  hasGarden: false,
  hasScenic: false,
  hasAirportPickup: false,
  hasRoomService: false,
  hasLaundry: false,
  hasTourAssistance: false,
  hasCarRental: false,
  outsideFoodAllowed: null,
  cancellationPolicy: "",
  refundPolicy: "",
  pricePerNight: "",
  weekendPrice: "",
  holidayPrice: "",
  extraBedCost: "",
  minimumStay: "",
  taxIncluded: false,
  recServiceCharge: "",
};

function num(v: string): number {
  return parseFloat(v) || 0;
}

function numOrNull(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function dateOrNull(v: string): string | null {
  return v.trim() || null;
}

function strOrNull(v: string): string | null {
  return v.trim() || null;
}

function buildPayload(d: WizardData) {
  const basicInfo = {
    propertyName: d.propertyName.trim(),
    title: d.title.trim(),
    description: d.description.trim(),
  };

  const location = {
    division: d.division.trim(),
    city: d.city.trim(),
    area: d.area.trim(),
    fullAddress: d.fullAddress.trim(),
    gpsLocation: {
      latitude: parseFloat(d.latitude) || 23.8103,
      longitude: parseFloat(d.longitude) || 90.4125,
    },
    nearbyLandmark: strOrNull(d.nearbyLandmark),
  };

  const rules = {
    petsAllowed: d.petsAllowed,
    smokingAllowed: d.smokingAllowed,
    genderRestriction: d.genderRestriction || null,
  };

  const coverImage = { caption: strOrNull(d.coverImageCaption) };

  const media = {
    photos: d.photoFiles.map((p) => ({ caption: strOrNull(p.caption) })),
    videos: d.videoFiles.map((v) => ({ caption: strOrNull(v.caption) })),
  };

  const targetGroup = d.targetGroup as ("STUDENT" | "BACHELOR" | "FAMILY")[];

  const pt = d.propertyType as ResidentialPropertyType;

  if (pt === "HOSTEL_MESS") {
    return {
      basicInfo,
      location,
      targetGroup,
      rules,
      coverImage,
      media,
      specifications: {
        totalSeats: num(d.totalSeats),
        availableSeats: num(d.availableSeats),
        sharingType: d.sharingType,
        bedProvided: d.bedProvided,
        tableChairProvided: d.tableChairProvided,
        attachedBathroom: d.attachedBathroom,
        foodIncluded: d.foodIncluded,
        wifiAvailable: d.wifiAvailable,
      },
      rentalDetails: {
        rentPerSeat: num(d.rentPerSeat),
        advance: numOrNull(d.advance),
        mealCost: numOrNull(d.mealCost),
        availableFrom: dateOrNull(d.availableFrom),
        negotiable: d.negotiable,
        remarks: strOrNull(d.remarks),
      },
    };
  }

  if (pt === "SINGLE_ROOM" || pt === "SUBLET") {
    return {
      basicInfo,
      location,
      targetGroup,
      rules,
      coverImage,
      media,
      specifications: {
        roomSize: numOrNull(d.roomSize),
        attachedBathroom: d.attachedBathroom,
        balcony: d.balcony,
        furnished: d.furnished,
        kitchenAccess: d.kitchenAccess,
        floorNumber: numOrNull(d.floorNumber),
      },
      rentalDetails: {
        monthlyRent: num(d.monthlyRent),
        utilityIncluded: d.utilityIncluded,
        advance: numOrNull(d.advance),
        availableFrom: dateOrNull(d.availableFrom),
        negotiable: d.negotiable,
        remarks: strOrNull(d.remarks),
      },
    };
  }

  if (pt === "SHARED_ROOM") {
    return {
      basicInfo,
      location,
      targetGroup,
      rules,
      coverImage,
      media,
      specifications: {
        roomSize: numOrNull(d.roomSize),
        attachedBathroom: d.attachedBathroom,
        balcony: d.balcony,
        furnished: d.furnished,
        kitchenAccess: d.kitchenAccess,
        floorNumber: numOrNull(d.floorNumber),
        totalBeds: num(d.totalBeds),
        availableBeds: num(d.availableBeds),
        sharingType: d.sharingType,
        bedProvided: d.sharedBedProvided,
      },
      rentalDetails: {
        monthlyRent: num(d.monthlyRent),
        utilityIncluded: d.utilityIncluded,
        advance: numOrNull(d.advance),
        availableFrom: dateOrNull(d.availableFrom),
        negotiable: d.negotiable,
        remarks: strOrNull(d.remarks),
        rentType: d.rentType,
      },
    };
  }

  if (pt === "FLAT" || pt === "APARTMENT") {
    return {
      basicInfo,
      location,
      targetGroup,
      rules,
      coverImage,
      media,
      specifications: {
        bedrooms: num(d.bedrooms),
        bathrooms: num(d.bathrooms),
        balcony: num(d.balconyCount),
        drawingRoom: d.drawingRoom,
        dining: d.dining,
        kitchen: num(d.kitchen),
        floorNumber: numOrNull(d.floorNumber),
        lift: d.lift,
        parking: d.parking,
        squareFeet: numOrNull(d.squareFeet),
      },
      rentalDetails: {
        monthlyRent: num(d.monthlyRent),
        serviceCharge: numOrNull(d.serviceCharge),
        utilities: numOrNull(d.utilities),
        advance: numOrNull(d.advance),
        availableFrom: dateOrNull(d.availableFrom),
        negotiable: d.negotiable,
        remarks: strOrNull(d.remarks),
      },
    };
  }

  throw new Error(`Unsupported residential property type: ${pt}`);
}

export async function submitResidentialProperty(d: WizardData): Promise<unknown> {
  if (!d.coverImageFile) throw new Error("Cover image is required");

  const pt = d.propertyType as ResidentialPropertyType;
  const endpoint = RESIDENTIAL_ENDPOINT[pt];
  if (!endpoint) throw new Error(`Unknown property type: ${pt}`);

  const payload = buildPayload(d);

  const fd = new FormData();
  fd.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  fd.append("coverImageFile", d.coverImageFile);
  d.photoFiles.forEach((p) => fd.append("photoFiles", p.file));
  d.videoFiles.forEach((v) => fd.append("videoFiles", v.file));

  return api(endpoint, { method: "POST", body: fd });
}
