import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { mustEnv } from "@/lib/server/env";
import { correlationId } from "@/lib/api/fetcher";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const nestBase = mustEnv("NEST_API_BASE_URL");
  const internalApiKey = process.env.NEST_API_INTERNAL_API_KEY;
  const route = internalApiKey ? `/internal/signals/${id}` : `/signals/${id}`;
  const url = `${nestBase.replace(/\/$/, "")}${route}`;
  const headers: Record<string, string> = {
    "x-correlation-id": correlationId("signal-detail"),
  };
  if (internalApiKey) {
    headers["x-api-key"] = internalApiKey;
  } else {
    headers.Authorization = `Bearer ${mustEnv("NEST_API_JWT")}`;
  }
  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

