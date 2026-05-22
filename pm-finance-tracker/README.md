# PM Finance Tracker

Personal finance app for a Slovenian freelance PM (sole proprietor / s.p.):
tracks money across **Cash**, **DH** (Delavska Hranilnica) and **Revolut Business**,
links transactions to **trips**, and computes the cash carried-forward
**last balance** per trip automatically.

Two roles:

- **Admin** (`adrian@myrk.si`) — full CRUD.
- **Guest** (any other authenticated user) — read-only dashboard, can upload
  bank statements but cannot edit or delete anything.

> This app lives inside the `myrk-si` repo as a self-contained subproject
> (`pm-finance-tracker/`). The portfolio site at the repo root is unrelated.

---

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend / Auth / DB:** Supabase (EU — Frankfurt)
- **PDF parsing:** Supabase Edge Function (Deno + `pdfjs-dist`)
- **File mirroring:** Google Drive via the official REST API
- **Hosting:** Vercel (frontend) + Supabase (backend)

---

## Quick start

```bash
cd pm-finance-tracker
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Type-check / build:

```bash
npm run lint    # tsc --noEmit
npm run build
```

---

## Supabase setup

1. Create a project in the **Frankfurt (eu-central-1)** region.
2. Open the SQL editor and run `supabase/migrations/0001_initial_schema.sql`.
   Optionally also `supabase/seed.sql` for a few demo rows.
3. In **Auth → Users**, create two accounts:
   - `adrian@myrk.si` — becomes the admin via the RLS policy.
   - Any other email (the senior PM) — becomes a read-only guest.
4. The migration creates the `bank-statements` storage bucket and policies.

If you use the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy parse-statement
supabase functions deploy drive-upload
supabase secrets set \
  GOOGLE_CLIENT_ID=... \
  GOOGLE_CLIENT_SECRET=... \
  GOOGLE_REFRESH_TOKEN=...
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are populated by Supabase for
Edge Functions automatically.

---

## Google Drive setup

Each uploaded statement is mirrored to:

```
PM Finance / Bank Statements / <DH|Revolut|CSV> / <YYYY> /
```

To mint a long-lived refresh token for the admin Google account:

1. Create an OAuth client in the Google Cloud Console (**Web application**).
   Add `https://developers.google.com/oauthplayground` as a redirect URI.
2. Open the **OAuth 2.0 Playground**, click the gear, tick *Use your own OAuth
   credentials* and paste your client ID / secret.
3. Authorise `https://www.googleapis.com/auth/drive.file` while signed in as
   the admin account.
4. Exchange the auth code for tokens — copy the refresh token.
5. Store the three values as Supabase secrets:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

The `drive.file` scope is intentionally minimal: the app can only touch files
it has itself created.

---

## Deployment (Vercel)

- Set the project root to `pm-finance-tracker/`.
- Add the `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
  `VITE_ADMIN_EMAIL` environment variables.
- Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.

---

## Trip "Last balance" — the formula

```
Last Balance(N) = Last Balance(N-1) + Fresh cash received(N) - Cash expenses(N)
Last Balance(0) =                     Fresh cash received(0) - Cash expenses(0)
```

`Cash expenses(N)` are every Cash transaction with a negative amount that is
either linked directly to trip N or unlinked but dated in the window
(previous trip end, this trip end]. A flight bought months earlier still
belongs to whichever trip it is manually linked to.

See `src/lib/tripBalance.ts` for the implementation.

---

## Notable rules

- **Categories** are defined in `src/lib/constants.ts`. Per Diem (€110/day) and
  Remote Work (€50/day) are calculated automatically — the transaction form
  shows a "How many days?" field that fills in the amount.
- **Drafts** are transactions without a date. They surface in a "Needs
  attention" card on the dashboard.
- **Duplicates** on import are detected by `(date, amount, description)` and
  skipped silently — counted in `import_logs.rows_skipped`.
- **Row-Level Security** in Postgres is the only authoritative check:
  the frontend hides admin-only buttons for the guest, but RLS would reject
  any forged write anyway.
