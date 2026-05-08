import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import { formatAddress, markSeen, parseRawMessage, withImap } from "@/app/lib/mail";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isPortalAuthed()) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const uid = Number(params.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    return NextResponse.json(
      { ok: false, error: "Invalid message id." },
      { status: 400 }
    );
  }

  try {
    const message = await withImap(async (client) => {
      await client.mailboxOpen("INBOX");
      const msg = (await client.fetchOne(uid, {
        uid: true,
        envelope: true,
        internalDate: true,
        source: true,
      })) as any;

      if (!msg || msg === false) return null;

      // mark read when opened (best effort)
      try {
        await markSeen(client, "INBOX", uid, true);
      } catch {
        // ignore
      }

      const raw = msg.source as Buffer | undefined;
      const parsed = raw ? await parseRawMessage(raw) : null;

      const from =
        (parsed?.from as any)?.text ||
        formatAddress(msg.envelope?.from?.[0] ?? null);
      const to =
        (parsed?.to as any)?.text ||
        (msg.envelope?.to
          ?.map((t: any) => formatAddress(t))
          .filter(Boolean)
          .join(", ") ||
          "");

      return {
        id: uid,
        subject: parsed?.subject || msg.envelope?.subject || "(no subject)",
        from,
        to,
        date: (msg.internalDate || new Date()).toISOString(),
        text: parsed?.text || "",
        html: typeof parsed?.html === "string" ? parsed.html : "",
      };
    });

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load message." },
      { status: 500 }
    );
  }
}

