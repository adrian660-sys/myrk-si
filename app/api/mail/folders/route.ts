import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import { listFolders, unreadCount, withImap } from "@/app/lib/mail";

export const runtime = "nodejs";

const WANTED = [
  { key: "INBOX", label: "Inbox" },
  { key: "Sent", label: "Sent" },
  { key: "Drafts", label: "Drafts" },
  { key: "Trash", label: "Trash" },
  { key: "Junk", label: "Spam" },
];

function pickMailboxPath(all: { path: string; specialUse?: string | null }[], key: string) {
  const k = key.toLowerCase();
  // Prefer special-use if present
  const special =
    all.find((m) => (m.specialUse || "").toLowerCase().includes(k)) ||
    all.find((m) => m.path.toLowerCase() === k) ||
    all.find((m) => m.path.toLowerCase().endsWith("." + k)) ||
    all.find((m) => m.path.toLowerCase().endsWith("/" + k));
  return special?.path || (key === "INBOX" ? "INBOX" : key);
}

export async function GET() {
  if (!isPortalAuthed()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const folders = await withImap(async (client) => {
      const all = await listFolders(client);
      const mapped = await Promise.all(
        WANTED.map(async ({ key, label }) => {
          const path = pickMailboxPath(all, key);
          const unseen = await unreadCount(client, path);
          return { key, label, path, unseen };
        })
      );
      return mapped;
    });

    return NextResponse.json({ ok: true, folders });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load folders." }, { status: 500 });
  }
}

