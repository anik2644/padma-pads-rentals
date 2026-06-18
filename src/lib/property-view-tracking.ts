export type ViewerType = "REGISTERED" | "GUEST";

export interface PropertyViewEvent {
  advertisementId: string;
  propertyId: string;
  viewerType: ViewerType;
  viewerId?: string;
  viewedAt: string;
}

const STORAGE_KEY = "homebee-property-view-events";

function readEvents(): PropertyViewEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as PropertyViewEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: PropertyViewEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function viewKey(input: Omit<PropertyViewEvent, "viewedAt">) {
  return [
    input.advertisementId,
    input.propertyId,
    input.viewerType,
    input.viewerId ?? "guest",
  ].join(":");
}

export function trackPropertyView(input: Omit<PropertyViewEvent, "viewedAt">) {
  const events = readEvents();
  const nextKey = viewKey(input);
  const alreadyTracked = events.some((event) => viewKey(event) === nextKey);
  if (alreadyTracked) return { tracked: false };

  const event: PropertyViewEvent = {
    ...input,
    viewedAt: new Date().toISOString(),
  };
  writeEvents([event, ...events]);
  return { tracked: true, event };
}

export function listPropertyViewEvents() {
  return readEvents();
}
