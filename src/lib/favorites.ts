import { api } from "@/lib/api-client";

export const FAVORITES_CHANGED_EVENT = "homebee:favorites-changed";

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

export function countFavorites(query: Record<string, unknown> = {}) {
  return listFavorites({ page: 1, pageSize: 1, ...query }).then((res) => res.meta.totalItems);
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

export function notifyFavoritesChanged() {
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}
