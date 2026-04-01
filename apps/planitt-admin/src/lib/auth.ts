import crypto from "node:crypto";
import { cookies } from "next/headers";

export type SessionPayload = {
  username: string;
  role: "admin";
  iat: number;
  exp: number;
};

const COOKIE_NAME = "planitt_admin_session";

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function secret(): string {
  return process.env.NEXTAUTH_SECRET || "dev-only-change-me";
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = sign(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(encoded).toString("utf8")) as SessionPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (parsed.role !== "admin") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function writeSession(username: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    username,
    role: "admin",
    iat: now,
    exp: now + 60 * 60 * 12,
  };
  const token = createSessionToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function isValidAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";
  return username === expectedUser && password === expectedPass;
}

