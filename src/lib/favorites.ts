import { api } from "@/lib/api-client";

export interface Favorite {
  id: string;
  userId: string;
  advertisementId: string;
  propertyId: string;
  audit: {
    createdAt: string;
    createdBy: string;
    deletedAt: string | null;
    deletedBy: string | null;
  };
}

export interface FavoriteListResponse {
  items: Favorite[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    sortOrder: string;
  };
}

export function listFavorites(query: Record<string, unknown> = {}) {
  return api<FavoriteListResponse>("/api/v1/favorites", {
    query: { includeDeleted: false, sortBy: "createdAt", sortOrder: "desc", ...query },
  });
}

export function createFavorite(body: { advertisementId: string; propertyId: string }) {
  return api<Favorite>("/api/v1/favorites", { method: "POST", body });
}

export function updateFavorite(
  favoriteId: string,
  body: Partial<{ advertisementId: string; propertyId: string }>,
) {
  return api<Favorite>(`/api/v1/favorites/${favoriteId}`, { method: "PATCH", body });
}

export function deleteFavorite(body: { advertisementId: string }) {
  return api<void>("/api/v1/favorites", { method: "DELETE", body });
}
