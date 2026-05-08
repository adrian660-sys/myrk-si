import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";

const IMAP = {
  host: "mail.myrk.si",
  port: 993,
  secure: true,
  user: "adrian@myrk.si",
};

const SMTP = {
  host: "mail.myrk.si",
  port: 465,
  secure: true,
  user: "adrian@myrk.si",
};

function password() {
  const pw = process.env.MAIL_PASSWORD;
  if (!pw) throw new Error("MAIL_PASSWORD not configured");
  return pw;
}

function insecureTls() {
  return process.env.MAIL_TLS_INSECURE === "true";
}

export async function withImap<T>(fn: (client: ImapFlow) => Promise<T>) {
  const client = new ImapFlow({
    host: IMAP.host,
    port: IMAP.port,
    secure: IMAP.secure,
    auth: { user: IMAP.user, pass: password() },
    tls: insecureTls() ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }
}

export function smtpTransport() {
  return nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    secure: SMTP.secure,
    auth: { user: SMTP.user, pass: password() },
    tls: insecureTls() ? { rejectUnauthorized: false } : undefined,
  });
}

export async function parseRawMessage(raw: Buffer) {
  return await simpleParser(raw, { skipImageLinks: true, skipHtmlToText: true });
}

export function formatAddress(a?: { name?: string; address?: string } | null) {
  if (!a?.address) return "";
  return a.name ? `${a.name} <${a.address}>` : a.address;
}

export const MAIL_USER = IMAP.user;

export function normalizeSubject(input: string) {
  const s = (input || "").trim();
  return s
    .replace(/^\s*(re|fw|fwd)\s*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type FolderInfo = {
  path: string;
  name: string;
  specialUse?: string | null;
};

export async function listFolders(client: ImapFlow): Promise<FolderInfo[]> {
  const out: FolderInfo[] = [];
  // imapflow list() is an async iterator; keep it defensive
  const iter: any = (client as any).list?.({}) ?? (client as any).list?.() ?? null;
  if (iter && typeof iter[Symbol.asyncIterator] === "function") {
    for await (const m of iter) {
      if (!m?.path) continue;
      out.push({
        path: String(m.path),
        name: String(m.name || m.path),
        specialUse: m.specialUse ?? null,
      });
    }
  }
  return out;
}

export async function unreadCount(client: ImapFlow, mailbox: string) {
  try {
    const status =
      (await (client as any).status?.(mailbox, { unseen: true })) ??
      (await (client as any).mailboxStatus?.(mailbox, { unseen: true })) ??
      null;
    const unseen =
      status?.unseen ??
      status?.unseenMessages ??
      status?.unseenCount ??
      undefined;
    if (typeof unseen === "number") return unseen;
  } catch {
    // ignore
  }
  return 0;
}

export async function markSeen(
  client: ImapFlow,
  mailbox: string,
  uid: number,
  seen: boolean
) {
  await client.mailboxOpen(mailbox);
  if (seen) {
    await (client as any).messageFlagsAdd({ uid }, ["\\Seen"]);
  } else {
    await (client as any).messageFlagsRemove({ uid }, ["\\Seen"]);
  }
}

export async function appendToFolder(
  client: ImapFlow,
  mailbox: string,
  raw: string
) {
  await (client as any).append?.(mailbox, raw, ["\\Seen"], new Date());
}

