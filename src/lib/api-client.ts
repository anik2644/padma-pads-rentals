import { useAuthStore } from "@/store/authStore";

/** Frontend → same-origin proxy → backend. */
const PROXY_PREFIX = "/api/public/backend";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, unknown>;
  body?: unknown;
  /** Skip Authorization header even if a token is present. */
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${PROXY_PREFIX}${clean}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v == null || v === "") continue;
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)));
      else url.searchParams.set(k, String(v));
    }
  }
  return url.toString().replace(window.location.origin, "");
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { query, body, skipAuth, headers, ...rest } = opts;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("accept", "application/json");

  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) finalHeaders.set("authorization", `Bearer ${token}`);
  }

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalHeaders.set("content-type", "application/json");
      finalBody = JSON.stringify(body);
    }
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "detail" in data && String((data as { detail: unknown }).detail)) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, data, msg);
  }
  return data as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
