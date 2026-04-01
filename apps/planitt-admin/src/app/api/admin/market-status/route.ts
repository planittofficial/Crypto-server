import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const fastapi = mustEnv("FASTAPI_BASE_URL").replace(/\/$/, "");
  const apiKey = mustEnv("FASTAPI_INTERNAL_API_KEY");
  const url = `${fastapi}/api/v1/signals/market/status`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "x-correlation-id": correlationId("market"),
    },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

