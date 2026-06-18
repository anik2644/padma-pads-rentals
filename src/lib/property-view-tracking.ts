import { api } from "@/lib/api-client";

export type ViewerType = "REGISTERED" | "GUEST";

export interface PropertyView {
  id: string;
  advertisementId: string;
  propertyId: string;
  viewerId?: string;
  viewerType: ViewerType;
  ipAddress?: string;
  deviceType?: string;
  audit: {
    viewedAt: string;
  };
}

export interface PropertyViewListResponse {
  items: PropertyView[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    sortOrder: string;
  };
}

const DEDUPE_KEY = "homebee-property-view-api-dedupe";

function readTrackedKeys() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(DEDUPE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeTrackedKeys(keys: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEDUPE_KEY, JSON.stringify([...keys]));
}

function getDeviceType() {
  if (typeof window === "undefined") return undefined;
  return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
}

function viewKey(input: {
  advertisementId: string;
  propertyId: string;
  viewerType: ViewerType;
  viewerId?: string;
}) {
  return [
    input.advertisementId,
    input.propertyId,
    input.viewerType,
    input.viewerId ?? "guest",
  ].join(":");
}

export async function trackPropertyView(input: {
  advertisementId: string;
  propertyId: string;
  viewerType: ViewerType;
  viewerId?: string;
}) {
  const keys = readTrackedKeys();
  const key = viewKey(input);
  if (keys.has(key)) return { tracked: false };

  const view = await api<PropertyView>("/api/v1/property-views", {
    method: "POST",
    body: {
      advertisementId: input.advertisementId,
      propertyId: input.propertyId,
      viewerType: input.viewerType,
      deviceType: getDeviceType(),
    },
  });
  keys.add(key);
  writeTrackedKeys(keys);
  return { tracked: true, event: view };
}

export function listPropertyViewEvents(query: Record<string, unknown> = {}) {
  return api<PropertyViewListResponse>("/api/v1/property-views", {
    query: { sortBy: "viewedAt", sortOrder: "desc", ...query },
  });
}

export function updatePropertyView(viewId: string, body: Partial<PropertyView>) {
  return api<PropertyView>(`/api/v1/property-views/${viewId}`, { method: "PATCH", body });
}

export function deletePropertyView(viewId: string) {
  return api<void>(`/api/v1/property-views/${viewId}`, { method: "DELETE" });
}
