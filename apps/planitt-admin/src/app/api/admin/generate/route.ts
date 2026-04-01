import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { symbol?: string; timeframe?: string; strategy?: string };
  const symbol = (body.symbol || "").trim();
  const timeframe = (body.timeframe || "").trim();
  const strategy = (body.strategy || "planitt").trim();
  if (!symbol || !timeframe) {
    return NextResponse.json({ error: "symbol and timeframe are required" }, { status: 400 });
  }

  const fastapi = mustEnv("FASTAPI_BASE_URL").replace(/\/$/, "");
  const apiKey = mustEnv("FASTAPI_INTERNAL_API_KEY");
  const url = `${fastapi}/api/v1/signals/generate?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(
    timeframe,
  )}&strategy=${encodeURIComponent(strategy)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-correlation-id": correlationId("generate"),
    },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

