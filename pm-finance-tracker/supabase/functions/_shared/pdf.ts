// Wrapper around unpdf (a Deno/edge-friendly fork of pdfjs) for PDF text
// extraction. unpdf strips out the browser-only canvas dependency that breaks
// pdfjs-dist on Supabase Edge Functions, while preserving the same
// `getTextContent()` API so we can still group text items by y-coordinate.
//
// deno-lint-ignore-file no-explicit-any
import { getDocumentProxy } from 'https://esm.sh/unpdf@0.12.1';

export async function extractPdfLines(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocumentProxy(bytes);
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[] }>;

    // Group items by their y-coordinate (rounded) so each row from the original
    // PDF becomes a single line of text.
    const rows = new Map<number, Array<{ x: number; str: string }>>();
    for (const it of items) {
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      const arr = rows.get(y) ?? [];
      arr.push({ x, str: it.str });
      rows.set(y, arr);
    }
    const sortedY = [...rows.keys()].sort((a, b) => b - a); // top-to-bottom
    for (const y of sortedY) {
      const row = rows.get(y)!.sort((a, b) => a.x - b.x).map((c) => c.str).join(' ');
      const trimmed = row.replace(/\s+/g, ' ').trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  return lines;
}

/** "1.234,56" → 1234.56  or  "1,234.56" → 1234.56. Empty / non-numeric → null. */
export function parseSloveneNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[€\s]/g, '').replace(/ /g, '');
  if (!cleaned) return null;
  // Slovene format uses "." as thousands and "," as decimal.
  const dot = cleaned.lastIndexOf('.');
  const com = cleaned.lastIndexOf(',');
  let normalised: string;
  if (com > dot) normalised = cleaned.replace(/\./g, '').replace(',', '.');
  else normalised = cleaned.replace(/,/g, '');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

/** Matches DD.MM.YYYY (DH) and DD/MM/YYYY (Revolut). Returns YYYY-MM-DD. */
export function parseDate(raw: string): string | null {
  const m = raw.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const month = m[2].padStart(2, '0');
  let year = m[3];
  if (year.length === 2) year = '20' + year;
  return `${year}-${month}-${day}`;
}
