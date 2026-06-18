import { api } from "@/lib/api-client";

export type VisitRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface VisitRequest {
  id: string;
  advertisementId: string;
  propertyId: string;
  requesterId: string;
  ownerId: string;
  status: VisitRequestStatus;
  preferredDate: string;
  preferredTime: string;
  alternateDate?: string | null;
  alternateTime?: string | null;
  message?: string | null;
  rejectionReason?: string | null;
  audit: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    approvedAt: string | null;
    approvedBy: string | null;
    rejectedAt: string | null;
    rejectedBy: string | null;
    cancelledAt: string | null;
    cancelledBy: string | null;
    deletedAt: string | null;
    deletedBy: string | null;
  };
}

export interface VisitRequestListResponse {
  items: VisitRequest[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    sortOrder: string;
  };
}

export interface CreateVisitRequestInput {
  advertisementId: string;
  propertyId: string;
  preferredDate: string;
  preferredTime: string;
  alternateDate?: string;
  alternateTime?: string;
  message?: string;
}

function toIsoDate(date: string) {
  return date.includes("T") ? date : new Date(`${date}T00:00:00`).toISOString();
}

export const visitRequestsApi = {
  async list(propertyId?: string) {
    const res = await api<VisitRequestListResponse>("/api/v1/visit-requests", {
      query: {
        propertyId,
        includeDeleted: false,
        sortBy: "createdAt",
        sortOrder: "desc",
        pageSize: 50,
      },
    });
    return res.items;
  },

  details(id: string) {
    return api<VisitRequestListResponse>("/api/v1/visit-requests", { query: { id } }).then(
      (res) => res.items[0] ?? null,
    );
  },

  create(input: CreateVisitRequestInput) {
    return api<VisitRequest>("/api/v1/visit-requests", {
      method: "POST",
      body: {
        advertisementId: input.advertisementId,
        propertyId: input.propertyId,
        preferredDate: toIsoDate(input.preferredDate),
        preferredTime: input.preferredTime,
        alternateDate: input.alternateDate ? toIsoDate(input.alternateDate) : undefined,
        alternateTime: input.alternateTime,
        message: input.message,
      },
    });
  },

  approve(id: string) {
    return api<VisitRequest>(`/api/v1/visit-requests/${id}`, {
      method: "PATCH",
      body: { status: "APPROVED" },
    });
  },

  reject(id: string, rejectionReason: string) {
    return api<VisitRequest>(`/api/v1/visit-requests/${id}`, {
      method: "PATCH",
      body: { status: "REJECTED", rejectionReason },
    });
  },

  cancel(id: string) {
    return api<VisitRequest>(`/api/v1/visit-requests/${id}`, {
      method: "PATCH",
      body: { status: "CANCELLED" },
    });
  },

  delete(id: string) {
    return api<void>(`/api/v1/visit-requests/${id}`, { method: "DELETE" });
  },
};
