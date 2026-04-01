import { NextResponse } from "next/server";

export type EnvResult =
  | { ok: true; value: string }
  | { ok: false; response: NextResponse };

export function safeMustEnv(name: string): EnvResult {
  const value = process.env[name];
  if (!value) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Missing required server environment variable",
          variable: name,
          hint: "Configure this value in Netlify environment variables and redeploy.",
        },
        { status: 500 },
      ),
    };
  }
  return { ok: true, value };
}

export async function fetchUpstream(
  url: string,
  init: RequestInit,
  service: "nest" | "fastapi",
) {
  try {
    const response = await fetch(url, init);
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Upstream service request failed",
        service,
        url,
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 502 },
    );
  }
}
