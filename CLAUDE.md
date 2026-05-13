# CLAUDE.md — myrk.si

Personal portfolio & project management website for Adrian Džeka, based in Ljubljana.
Live at **https://www.myrk.si**

---

## Development Workflow

**Always use `npm`, not `yarn` or `pnpm`.**

```bash
# 1. Make changes
# 2. Typecheck & lint
npm run lint
# 3. Build & verify
npm run build
# 4. Run dev server to visually verify
npm run dev
# 5. Before committing
npm run lint && npm run build
```

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript / React
- **Styling:** Tailwind CSS — utility classes only, no CSS modules
- **Animations:** Framer Motion + custom Tailwind keyframes (`animate-scroll-bounce`, `animate-pulse-ring`)
- **Fonts:** Cormorant Garamond (headings) · DM Sans (body) — loaded via `next/font`, never CDN
- **Deployment:** Vercel

## Design Rules

- Dark, minimal aesthetic — black/near-black background, light text
- `antialiased` rendering always on
- Typography-driven: large serif headings, clean sans body
- Animations must be subtle — no flashy transitions, no bounce
- Single-page layout: Hero → About → Contact
- Full-viewport sections, centered content, generous whitespace
- Match existing font pairing exactly — don't introduce new fonts

## Project Structure (verify with `ls -la`)

```
myrk.si/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout (fonts, metadata)
│   ├── page.tsx          # Homepage
│   └── globals.css       # Tailwind base + custom animations
├── components/           # React components
├── public/               # Static assets, OG images
├── tailwind.config.ts    # Custom colors, fonts, animations
├── next.config.js
├── package.json
└── CLAUDE.md
```

## Code Conventions

- Code and variable names in **English**
- Site copy in **English**
- Functional components with hooks only — no class components
- Tailwind utility classes only — no inline `style` unless for dynamic animation values
- PascalCase for components, camelCase for variables/functions
- Custom keyframes go in `tailwind.config.ts` under `extend.animation`
- Use Framer Motion for scroll/enter/exit animations
- Keep the site fast and lightweight — no heavy libraries

## Common Mistakes (add to this list when Claude gets something wrong)

- ❌ Don't use Google Fonts CDN — use `next/font`
- ❌ Don't add CSS modules or styled-components — Tailwind only
- ❌ Don't make animations flashy or bouncy — keep them subtle
- ❌ Don't break the dark aesthetic with light backgrounds
- ❌ Don't use `yarn` or `pnpm` — this project uses `npm`
- ❌ Don't add new font families without explicit approval

## Contact Form

- Sends to `adrian@myrk.si`
- Check implementation in API route or external service
- Must validate inputs client-side before submission

## SEO

- OG title: "Adrian Džeka — Project Manager, Ljubljana"
- Meta description set in layout.tsx
- All images need alt text
- Keep semantic HTML structure

## Working With This File

> "Anytime we see Claude do something incorrectly we add it to the CLAUDE.md,
> so Claude knows not to do it next time." — Boris Cherny, creator of Claude Code

- **When Claude makes a mistake → add it to "Common Mistakes" above.** This is the single most important habit.
- Start complex changes in **Plan mode** (shift+tab twice) — iterate until the plan is solid, then execute.
- After finishing a task, ask Claude to **simplify the code** it just wrote.
- Always visually verify changes with `npm run dev` before committing.
- Keep this file in the **root of the repo**, checked into git.
