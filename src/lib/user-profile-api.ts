import { api } from "@/lib/api-client";

interface ProfileFieldResponse {
  value: string | null;
  updatedBy: string | null;
}

export interface ProfileUpdateResponse {
  displayName: ProfileFieldResponse;
  firstName: ProfileFieldResponse;
  middleName: ProfileFieldResponse;
  lastName: ProfileFieldResponse;
  photoUrl: ProfileFieldResponse;
}

interface UpdateProfilePayload {
  displayName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  profilePhoto?: File | null;
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const fd = new FormData();
  if (payload.displayName !== undefined) fd.append("displayName", payload.displayName ?? "");
  if (payload.firstName !== undefined) fd.append("firstName", payload.firstName ?? "");
  if (payload.middleName !== undefined) fd.append("middleName", payload.middleName ?? "");
  if (payload.lastName !== undefined) fd.append("lastName", payload.lastName ?? "");
  if (payload.profilePhoto) fd.append("profilePhoto", payload.profilePhoto);

  return api<ProfileUpdateResponse>("/api/v1/users/me/profile", {
    method: "PATCH",
    body: fd,
  });
}
