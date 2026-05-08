import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import { markSeen, withImap } from "@/app/lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isPortalAuthed()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const folder = String(body?.folder || "INBOX");
  const id = Number(body?.id);
  const seen = Boolean(body?.seen);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid id." }, { status: 400 });
  }

  try {
    await withImap(async (client) => {
      await markSeen(client, folder, id, seen);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to update flags: ${msg}` },
      { status: 500 }
    );
  }
}

