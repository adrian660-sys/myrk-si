// Supabase Edge Function — mirrors an uploaded statement file to Google Drive.
//
// Request:  POST { path: string, filename: string, kind: 'DH_PDF' | 'Revolut_PDF' | 'CSV' }
// Response: { fileId: string, url: string }
//
// Uses a long-lived refresh token belonging to the admin's Google account
// (see README "Google Drive setup" for how to mint one). Scope:
//   https://www.googleapis.com/auth/drive.file
// which limits app access to files this function itself creates.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
  path: string;
  filename: string;
  kind: 'DH_PDF' | 'Revolut_PDF' | 'CSV';
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: Body = await req.json();
    if (!body.path || !body.filename || !body.kind) {
      return json({ error: 'path, filename, kind required' }, 400);
    }
    if (!clientId || !clientSecret || !refreshToken) {
      return json({ error: 'Google credentials not configured' }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: blob, error } = await supabase.storage
      .from('bank-statements').download(body.path);
    if (error || !blob) {
      return json({ error: `download failed: ${error?.message ?? 'no data'}` }, 500);
    }

    const accessToken = await refreshAccessToken();
    const folder = await ensureFolderPath(accessToken, [
      'PM Finance',
      'Bank Statements',
      sourceFolderName(body.kind),
      String(new Date().getFullYear()),
    ]);

    const fileId = await driveUpload(
      accessToken,
      folder,
      body.filename,
      blob.type || mimeFor(body.kind),
      new Uint8Array(await blob.arrayBuffer()),
    );

    return json({ fileId, url: `https://drive.google.com/file/d/${fileId}/view` });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function refreshAccessToken(): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) throw new Error(`Google token refresh failed: ${await r.text()}`);
  const data = await r.json() as { access_token: string };
  return data.access_token;
}

async function ensureFolderPath(token: string, segments: string[]): Promise<string> {
  let parent = 'root';
  for (const name of segments) {
    parent = await ensureFolder(token, name, parent);
  }
  return parent;
}

async function ensureFolder(token: string, name: string, parent: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' ` +
    `and trashed=false and '${parent}' in parents`,
  );
  const search = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!search.ok) throw new Error(`Drive search failed: ${await search.text()}`);
  const { files } = await search.json() as { files: Array<{ id: string }> };
  if (files.length > 0) return files[0].id;

  const create = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parent],
    }),
  });
  if (!create.ok) throw new Error(`Drive folder create failed: ${await create.text()}`);
  return (await create.json() as { id: string }).id;
}

async function driveUpload(
  token: string,
  parent: string,
  name: string,
  mime: string,
  bytes: Uint8Array,
): Promise<string> {
  const boundary = '----pmf-' + crypto.randomUUID();
  const metadata = JSON.stringify({ name, parents: [parent] });
  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const r = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!r.ok) throw new Error(`Drive upload failed: ${await r.text()}`);
  return (await r.json() as { id: string }).id;
}

function sourceFolderName(kind: Body['kind']): string {
  if (kind === 'DH_PDF') return 'DH';
  if (kind === 'Revolut_PDF') return 'Revolut';
  return 'CSV';
}

function mimeFor(kind: Body['kind']): string {
  return kind === 'CSV' ? 'text/csv' : 'application/pdf';
}
