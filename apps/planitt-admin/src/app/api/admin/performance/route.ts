import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const nestBase = mustEnv("NEST_API_BASE_URL");
  const internalApiKey = process.env.NEST_API_INTERNAL_API_KEY;
  const route = internalApiKey ? "/internal/performance" : "/performance";
  const url = `${nestBase.replace(/\/$/, "")}${route}`;
  const headers: Record<string, string> = {
    "x-correlation-id": correlationId("perf"),
  };
  if (internalApiKey) {
    headers["x-api-key"] = internalApiKey;
  } else {
    headers.Authorization = `Bearer ${mustEnv("NEST_API_JWT")}`;
  }
  const res = await fetch(url, {
    headers,
    next: { revalidate: 15 },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

