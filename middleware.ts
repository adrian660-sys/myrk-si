import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "portal_session";
const MAX_AGE_S = 60 * 60 * 24 * 7;

function secret() {
  return (
    process.env.PORTAL_COOKIE_SECRET ||
    process.env.PORTAL_PASSWORD ||
    "dev-secret"
  );
}

function base64url(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  const b64 = btoa(bin);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  // bin is latin-1; convert to utf-8-ish string (payload is ASCII JSON)
  return bin;
}

async function sign(raw: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  return base64url(sig);
}

async function verify(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return false;
  try {
    const expected = await sign(raw);
    if (sig !== expected) return false;
    const payload = JSON.parse(base64urlDecode(raw)) as { iat?: number };
    if (!payload?.iat) return false;
    const age = Math.floor(Date.now() / 1000) - payload.iat;
    if (age < 0 || age > MAX_AGE_S) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");
  const isMailApi = pathname.startsWith("/api/mail/");

  if (!isPortal && !isMailApi) return NextResponse.next();

  // Allow login page + auth endpoint without session.
  if (pathname === "/portal/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await verify(token);

  if (authed) return NextResponse.next();

  if (isMailApi) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/portal/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/portal/:path*", "/api/mail/:path*"],
};

