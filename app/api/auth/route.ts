import { NextResponse } from "next/server";
import {
  clearPortalSessionCookie,
  setPortalSessionCookie,
} from "@/app/lib/portalAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const portalPassword = process.env.PORTAL_PASSWORD;
  if (!portalPassword) {
    return NextResponse.json(
      { ok: false, error: "PORTAL_PASSWORD not configured." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const action = (body as any)?.action as string | undefined;
  if (action === "logout") {
    clearPortalSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const password = String((body as any)?.password ?? "");
  if (!password) {
    return NextResponse.json(
      { ok: false, error: "Password required." },
      { status: 400 }
    );
  }

  if (password !== portalPassword) {
    return NextResponse.json(
      { ok: false, error: "Invalid password." },
      { status: 401 }
    );
  }

  setPortalSessionCookie();
  return NextResponse.json({ ok: true });
}
