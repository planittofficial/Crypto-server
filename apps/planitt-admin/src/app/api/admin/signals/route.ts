import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const nestBase = mustEnv("NEST_API_BASE_URL");
  const internalApiKey = process.env.NEST_API_INTERNAL_API_KEY;
  const jwt = process.env.NEST_API_JWT;
  const route = internalApiKey ? "/internal/signals" : "/signals";
  const url = new URL(`${nestBase.replace(/\/$/, "")}${route}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {
    "x-correlation-id": correlationId("signals"),
  };
  if (internalApiKey) {
    headers["x-api-key"] = internalApiKey;
  } else {
    headers.Authorization = `Bearer ${mustEnv("NEST_API_JWT")}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 10 },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

