// parse-receipt — extracts amount, date, description from a receipt image or PDF
// using Claude vision / text API.
//
// Request:  POST { fileBase64: string, mediaType: string, storagePath: string }
//   mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
//   storagePath: already uploaded to `receipts` bucket
//
// Response: { amount: number|null, date: string|null, description: string|null }
//
// Requires edge secret: ANTHROPIC_API_KEY
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import { extractPdfLines } from '../_shared/pdf.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PROMPT = `Extract from this receipt or invoice:
1. Total amount paid (positive number, no currency symbol, e.g. 450.00)
2. Payment or invoice date (YYYY-MM-DD format)
3. Payee / vendor name (short, e.g. "Računovodstvo d.o.o.")

Respond with JSON only, no explanation:
{"amount": number_or_null, "date": "YYYY-MM-DD_or_null", "description": "string_or_null"}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function callClaude(content: any[]): Promise<{ amount: number | null; date: string | null; description: string | null }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text ?? '{}';
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { amount: null, date: null, description: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { fileBase64, mediaType, storagePath } = await req.json();
    if (!fileBase64 || !mediaType || !storagePath) {
      return json({ error: 'fileBase64, mediaType and storagePath are required' }, 400);
    }

    let result;

    if (mediaType === 'application/pdf') {
      // Extract text from PDF then send as text to Claude
      const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      const lines = await extractPdfLines(bytes);
      const text = lines.join('\n').slice(0, 4000);
      result = await callClaude([
        { type: 'text', text: `Receipt/invoice text:\n\n${text}\n\n${PROMPT}` },
      ]);
    } else {
      // Image: use Claude vision
      const validImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validImage.includes(mediaType)) {
        return json({ error: `Unsupported media type: ${mediaType}` }, 400);
      }
      result = await callClaude([
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } },
        { type: 'text', text: PROMPT },
      ]);
    }

    // Validate amount is a positive number
    if (result.amount !== null && (typeof result.amount !== 'number' || result.amount <= 0)) {
      result.amount = null;
    }
    // Validate date format
    if (result.date && !/^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
      result.date = null;
    }

    return json(result);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
