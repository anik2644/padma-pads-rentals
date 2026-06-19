const FILE_UPLOAD_URL = "http://213.136.73.10:8050/files/upload";

/** Upload a profile photo and return the server-generated access URL. */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket_name", "profile-photos");
  fd.append("file_name", `profile_${Date.now()}_${file.name}`);

  const res = await fetch(FILE_UPLOAD_URL, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status})${text ? `: ${text}` : ""}`);
  }

  const data: unknown = await res.json().catch(() => null);

  // Try the most common response shapes APIs return for file URLs
  const url =
    extractString(data, "url") ??
    extractString(data, "access_url") ??
    extractString(data, "file_url") ??
    extractString(data, "fileUrl") ??
    extractString(data, "path") ??
    (typeof data === "string" ? data : null);

  if (!url) {
    console.error("[uploadProfilePhoto] unexpected response shape:", data);
    throw new Error("Upload succeeded but no URL found in response");
  }

  return url;
}

function extractString(obj: unknown, key: string): string | null {
  if (obj && typeof obj === "object" && key in (obj as object)) {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === "string" && val) return val;
  }
  return null;
}
