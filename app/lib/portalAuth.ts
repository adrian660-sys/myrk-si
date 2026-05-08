import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "portal_session";
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  iat: number; // unix seconds
};

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function secret() {
  // Optional separate secret; falls back to PORTAL_PASSWORD to keep setup minimal.
  return (
    process.env.PORTAL_COOKIE_SECRET ||
    process.env.PORTAL_PASSWORD ||
    "dev-secret"
  );
}

function sign(raw: string) {
  return crypto.createHmac("sha256", secret()).update(raw).digest("base64url");
}

export function createSessionToken(): string {
  const payload: SessionPayload = { iat: Math.floor(Date.now() / 1000) };
  const raw = base64url(JSON.stringify(payload));
  const sig = sign(raw);
  return `${raw}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return false;
  const expected = sign(raw);
  try {
    // constant-time compare
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(base64urlDecode(raw)) as SessionPayload;
    if (!payload?.iat) return false;
    const age = Math.floor(Date.now() / 1000) - payload.iat;
    if (age < 0 || age > MAX_AGE_S) return false;
    return true;
  } catch {
    return false;
  }
}

export function setPortalSessionCookie() {
  const token = createSessionToken();
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export function clearPortalSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isPortalAuthed(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

