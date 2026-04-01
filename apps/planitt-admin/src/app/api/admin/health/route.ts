import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

async function statusCheck(url: string, headers?: Record<string, string>) {
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const nestBase = mustEnv("NEST_API_BASE_URL").replace(/\/$/, "");
  const nestInternalApiKey = process.env.NEST_API_INTERNAL_API_KEY;
  const fastapi = mustEnv("FASTAPI_BASE_URL").replace(/\/$/, "");
  const fastapiKey = mustEnv("FASTAPI_INTERNAL_API_KEY");
  const corr = correlationId("health");
  const nestPath = nestInternalApiKey ? "/internal/performance" : "/performance";
  const nestHeaders: Record<string, string> = { "x-correlation-id": corr };
  if (nestInternalApiKey) {
    nestHeaders["x-api-key"] = nestInternalApiKey;
  } else {
    nestHeaders.Authorization = `Bearer ${mustEnv("NEST_API_JWT")}`;
  }

  const [nest, fast, news, market] = await Promise.all([
    statusCheck(`${nestBase}${nestPath}`, nestHeaders),
    statusCheck(`${fastapi}/health`),
    statusCheck(`${fastapi}/api/v1/news?limit=1`, { "x-api-key": fastapiKey, "x-correlation-id": corr }),
    statusCheck(`${fastapi}/api/v1/signals/market/status`, { "x-api-key": fastapiKey, "x-correlation-id": corr }),
  ]);

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    services: {
      nest_api: nest,
      fastapi_health: fast,
      fastapi_news: news,
      fastapi_market_status: market,
    },
  });
}

