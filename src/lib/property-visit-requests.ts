export type VisitRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface VisitRequest {
  id: string;
  advertisementId: string;
  propertyId: string;
  propertyTitle: string;
  requesterId: string;
  requesterName: string;
  preferredDate: string;
  preferredTime: string;
  alternateDate?: string;
  alternateTime?: string;
  message?: string;
  status: VisitRequestStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface CreateVisitRequestInput {
  advertisementId: string;
  propertyId: string;
  propertyTitle: string;
  requesterId: string;
  requesterName: string;
  preferredDate: string;
  preferredTime: string;
  alternateDate?: string;
  alternateTime?: string;
  message?: string;
}

const STORAGE_KEY = "homebee-visit-requests";

function now() {
  return new Date().toISOString();
}

function readRequests(): VisitRequest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as VisitRequest[];
  } catch {
    return [];
  }
}

function writeRequests(requests: VisitRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function updateRequest(id: string, patch: Partial<VisitRequest>) {
  const requests = readRequests();
  const updated = requests.map((request) =>
    request.id === id ? { ...request, ...patch, updatedAt: now() } : request,
  );
  writeRequests(updated);
  return updated.find((request) => request.id === id) ?? null;
}

export const visitRequestsApi = {
  list(propertyId?: string) {
    const requests = readRequests();
    return propertyId ? requests.filter((request) => request.propertyId === propertyId) : requests;
  },

  details(id: string) {
    return readRequests().find((request) => request.id === id) ?? null;
  },

  create(input: CreateVisitRequestInput) {
    const createdAt = now();
    const request: VisitRequest = {
      ...input,
      id: `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "PENDING",
      createdAt,
      updatedAt: createdAt,
    };
    writeRequests([request, ...readRequests()]);
    return request;
  },

  approve(id: string) {
    return updateRequest(id, { status: "APPROVED", approvedAt: now(), rejectionReason: undefined });
  },

  reject(id: string, rejectionReason: string) {
    return updateRequest(id, { status: "REJECTED", rejectedAt: now(), rejectionReason });
  },

  cancel(id: string) {
    return updateRequest(id, { status: "CANCELLED", cancelledAt: now() });
  },
};
