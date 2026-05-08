import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import { formatAddress, normalizeSubject, withImap } from "@/app/lib/mail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isPortalAuthed()) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const folder = url.searchParams.get("folder") || "INBOX";
  const q = (url.searchParams.get("q") || "").trim();

  try {
    const items = await withImap(async (client) => {
      const mailbox = await client.mailboxOpen(folder);
      const exists = mailbox.exists || 0;
      if (exists === 0) return [];

      // Search (IMAP SEARCH) by from/subject/body. Keep it safe if server rejects.
      let uids: number[] | null = null;
      if (q) {
        try {
          // Prefer TEXT for “sender/subject/body”; it’s broad but matches user expectation.
          uids = (await (client as any).search?.({ text: q })) as number[];
        } catch {
          // ignore search errors; fall back to latest range
          uids = null;
        }
      }

      const limit = 50;
      const startSeq = Math.max(1, exists - limit + 1);
      const range = `${startSeq}:${exists}`;

      const out: {
        id: number;
        from: string;
        subject: string;
        date: string;
        unread: boolean;
        threadKey: string;
      }[] = [];

      const fetchSource =
        uids && Array.isArray(uids) && uids.length
          ? uids.slice(-limit) // newest-ish
          : range;

      for await (const msg of client.fetch(fetchSource as any, {
        uid: true,
        envelope: true,
        internalDate: true,
        flags: true,
      })) {
        const from = formatAddress(msg.envelope?.from?.[0] ?? null);
        const subject = msg.envelope?.subject || "(no subject)";
        const norm = normalizeSubject(subject);
        out.push({
          id: msg.uid,
          from,
          subject,
          date: new Date((msg as any).internalDate || Date.now()).toISOString(),
          unread: !((msg as any).flags || []).includes("\\Seen"),
          threadKey: norm || "(no subject)",
        });
      }

      // newest first
      out.sort((a, b) => (a.id < b.id ? 1 : -1));
      return out;
    });

    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load inbox." },
      { status: 500 }
    );
  }
}
