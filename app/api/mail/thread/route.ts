import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import { formatAddress, normalizeSubject, withImap } from "@/app/lib/mail";

export const runtime = "nodejs";

function hasSeenFlag(flags: unknown) {
  if (!flags) return false;
  if (Array.isArray(flags)) return flags.includes("\\Seen");
  if (typeof (flags as any).has === "function") return (flags as any).has("\\Seen");
  try {
    return Array.from(flags as any).includes("\\Seen");
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!isPortalAuthed()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const folder = url.searchParams.get("folder") || "INBOX";
  const threadKey = (url.searchParams.get("threadKey") || "").trim().toLowerCase();
  if (!threadKey) {
    return NextResponse.json({ ok: false, error: "threadKey required" }, { status: 400 });
  }

  try {
    const messages = await withImap(async (client) => {
      await client.mailboxOpen(folder);

      // Broad search by subject text. Works across most servers.
      const uids = (await (client as any).search?.({ header: ["subject", threadKey] })) as
        | number[]
        | undefined;

      const uidList = Array.isArray(uids) ? uids : [];
      if (!uidList.length) return [];

      const out: Array<{
        id: number;
        from: string;
        subject: string;
        date: string;
        unread: boolean;
      }> = [];

      for await (const msg of client.fetch(uidList as any, {
        uid: true,
        envelope: true,
        internalDate: true,
        flags: true,
      })) {
        const subject = msg.envelope?.subject || "(no subject)";
        if (normalizeSubject(subject) !== threadKey) continue;
        out.push({
          id: msg.uid,
          from: formatAddress(msg.envelope?.from?.[0] ?? null),
          subject,
          date: new Date((msg as any).internalDate || Date.now()).toISOString(),
          unread: !hasSeenFlag((msg as any).flags),
        });
      }

      out.sort((a, b) => (a.date < b.date ? -1 : 1));
      return out;
    });

    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to load thread: ${msg}` },
      { status: 500 }
    );
  }
}

