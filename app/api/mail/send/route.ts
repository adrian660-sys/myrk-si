import { NextResponse } from "next/server";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import {
  appendToFolder,
  MAIL_USER,
  parseRawMessage,
  smtpTransport,
  withImap,
} from "@/app/lib/mail";

export const runtime = "nodejs";

type ComposePayload = {
  to: string;
  subject: string;
  message: string;
};

type ReplyPayload = {
  replyToId: number;
  message: string;
};

type ForwardPayload = {
  forwardOfId: number;
  to: string;
  message: string;
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  if (!isPortalAuthed()) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
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

  const transport = smtpTransport();
  const from = MAIL_USER;

  // Reply flow
  if ((body as any)?.replyToId) {
    const { replyToId, message } = body as ReplyPayload;
    const uid = Number(replyToId);
    const replyText = String(message ?? "").trim();
    if (!Number.isFinite(uid) || uid <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid replyToId." },
        { status: 400 }
      );
    }
    if (replyText.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Message is too short." },
        { status: 400 }
      );
    }

    try {
      const original = await withImap(async (client) => {
        await client.mailboxOpen("INBOX");
        const msg = (await client.fetchOne(uid, {
          uid: true,
          source: true,
        })) as any;
        if (!msg || msg === false) return null;
        const parsed = msg.source ? await parseRawMessage(msg.source as Buffer) : null;
        return {
          to:
            parsed?.replyTo?.text ||
            parsed?.from?.text ||
            (parsed?.from?.value?.[0]?.address ?? ""),
          subject: parsed?.subject || "(no subject)",
          messageId: parsed?.messageId || undefined,
          references: parsed?.references || undefined,
        };
      });

      if (!original) {
        return NextResponse.json(
          { ok: false, error: "Reply target not found." },
          { status: 404 }
        );
      }

      const to = String(original.to || "").trim();
      if (!to) {
        return NextResponse.json(
          { ok: false, error: "Could not determine reply recipient." },
          { status: 400 }
        );
      }

      const subject = original.subject.toLowerCase().startsWith("re:")
        ? original.subject
        : `Re: ${original.subject}`;

      const info = await transport.sendMail({
        from,
        to,
        subject,
        text: replyText,
        inReplyTo: original.messageId,
        references: original.references,
      });

      // Best-effort: append to Sent
      try {
        const raw = (info as any)?.message?.toString?.() || "";
        if (raw) {
          await withImap(async (client) => {
            await appendToFolder(client, "Sent", raw);
          });
        }
      } catch {
        // ignore
      }

      return NextResponse.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json(
        { ok: false, error: `Failed to send reply: ${msg}` },
        { status: 502 }
      );
    }
  }

  // Forward flow
  if ((body as any)?.forwardOfId) {
    const { forwardOfId, to, message } = body as ForwardPayload;
    const uid = Number(forwardOfId);
    const cleanTo = String(to ?? "").trim();
    const extra = String(message ?? "").trim();

    if (!Number.isFinite(uid) || uid <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid forwardOfId." }, { status: 400 });
    }
    if (!cleanTo || !isEmail(cleanTo)) {
      return NextResponse.json({ ok: false, error: "Invalid recipient." }, { status: 400 });
    }

    try {
      const original = await withImap(async (client) => {
        await client.mailboxOpen("INBOX");
        const msg = (await client.fetchOne(uid, { uid: true, source: true })) as any;
        const raw = msg?.source as Buffer | undefined;
        const parsed = raw ? await parseRawMessage(raw) : null;
        return {
          subject: parsed?.subject || "(no subject)",
          from: (parsed?.from as any)?.text || "",
          date: (parsed?.date ? new Date(parsed.date) : new Date()).toISOString(),
          text: parsed?.text || "",
        };
      });

      const fwdSubject = original.subject.toLowerCase().startsWith("fwd:")
        ? original.subject
        : `Fwd: ${original.subject}`;

      const quoted = [
        extra,
        extra ? "" : "",
        "---- Forwarded message ----",
        original.from ? `From: ${original.from}` : "",
        `Date: ${new Date(original.date).toUTCString()}`,
        `Subject: ${original.subject}`,
        "",
        original.text || "",
      ]
        .filter(Boolean)
        .join("\n");

      const info = await transport.sendMail({
        from,
        to: cleanTo,
        subject: fwdSubject,
        text: quoted,
      });

      try {
        const raw = (info as any)?.message?.toString?.() || "";
        if (raw) {
          await withImap(async (client) => {
            await appendToFolder(client, "Sent", raw);
          });
        }
      } catch {
        // ignore
      }

      return NextResponse.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json(
        { ok: false, error: `Failed to forward email: ${msg}` },
        { status: 502 }
      );
    }
  }

  // Compose flow
  const { to, subject, message } = body as Partial<ComposePayload>;
  const cleanTo = String(to ?? "").trim();
  const cleanSubject = String(subject ?? "").trim().slice(0, 200);
  const cleanMessage = String(message ?? "").trim().slice(0, 20000);

  if (!cleanTo || !isEmail(cleanTo)) {
    return NextResponse.json(
      { ok: false, error: "Invalid recipient." },
      { status: 400 }
    );
  }
  if (!cleanSubject) {
    return NextResponse.json(
      { ok: false, error: "Subject required." },
      { status: 400 }
    );
  }
  if (cleanMessage.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Message is too short." },
      { status: 400 }
    );
  }

  try {
    const info = await transport.sendMail({
      from,
      to: cleanTo,
      subject: cleanSubject,
      text: cleanMessage,
    });

    try {
      const raw = (info as any)?.message?.toString?.() || "";
      if (raw) {
        await withImap(async (client) => {
          await appendToFolder(client, "Sent", raw);
        });
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to send email: ${msg}` },
      { status: 502 }
    );
  }
}

