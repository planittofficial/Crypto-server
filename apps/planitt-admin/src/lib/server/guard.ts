import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await readSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, session };
}

