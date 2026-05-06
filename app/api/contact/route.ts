import { NextResponse } from "next/server";
import { Resend } from "resend";

type Payload = {
  name: string;
  email: string;
  message: string;
};

function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status: 400 }
  );
}

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Email service not configured." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  const { name, email, message } = (body ?? {}) as Partial<Payload>;

  if (!name || !email || !message) {
    return badRequest("Missing required fields.", { name, email, message });
  }

  const cleanName = String(name).trim().slice(0, 120);
  const cleanEmail = String(email).trim().slice(0, 180);
  const cleanMessage = String(message).trim().slice(0, 4000);

  // minimal validation (keeps UX clean without adding deps)
  if (cleanName.length < 2) return badRequest("Name is too short.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return badRequest("Invalid email address.");
  }
  if (cleanMessage.length < 10) return badRequest("Message is too short.");

  const resend = new Resend(key);

  // Resend requires a verified domain for the "from" address.
  // Use a generic sender and reply-to the user.
  const from = process.env.CONTACT_FROM ?? "myrk.si <onboarding@resend.dev>";
  const to = process.env.CONTACT_TO ?? "adrian@myrk.si";

  const subject = `myrk.si — new message from ${cleanName}`;

  const text = [
    "New message from myrk.si",
    "",
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    "",
    cleanMessage,
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: cleanEmail,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to send email." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to send email." },
      { status: 502 }
    );
  }
}

