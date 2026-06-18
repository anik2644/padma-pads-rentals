import { createFileRoute } from "@tanstack/react-router";

const BACKEND_BASE = "http://213.136.73.10:8060";

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const splat = params._splat ?? "";
  const url = new URL(request.url);
  const target = `${BACKEND_BASE}/${splat}${url.search}`;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  headers.set("accept", "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const res = await fetch(target, init);
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        detail: "Upstream backend unreachable",
        target,
        error: (err as Error).message,
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/public/backend/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
    },
  },
});
