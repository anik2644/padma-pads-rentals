import { api } from "@/lib/api-client";

export type MessageRole = "OWNER" | "TENANT" | "GUEST";

export interface PropertyMessage {
  id: string;
  advertisementId: string;
  propertyId: string;
  senderId: string;
  receiverId: string;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  message: string;
  isRead: boolean;
  readAt: string | null;
  audit: {
    createdAt: string;
    createdBy: string;
    deletedAt: string | null;
    deletedBy: string | null;
    deleteReason: string | null;
  };
}

export interface MessageListResponse {
  items: PropertyMessage[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    sortOrder: string;
  };
}

export function listMessages(query: Record<string, unknown> = {}) {
  return api<MessageListResponse>("/api/v1/messages", {
    query: { includeDeleted: false, sortBy: "createdAt", sortOrder: "asc", pageSize: 100, ...query },
  });
}

export function createMessage(body: {
  advertisementId: string;
  propertyId: string;
  receiverId: string;
  senderRole: MessageRole;
  receiverRole: MessageRole;
  message: string;
}) {
  return api<PropertyMessage>("/api/v1/messages", { method: "POST", body });
}

export function updateMessage(messageId: string, body: Partial<PropertyMessage>) {
  return api<PropertyMessage>(`/api/v1/messages/${messageId}`, { method: "PATCH", body });
}

export function deleteMessage(messageId: string, deleteReason?: string) {
  return api<void>(`/api/v1/messages/${messageId}`, {
    method: "DELETE",
    query: { deleteReason },
  });
}
