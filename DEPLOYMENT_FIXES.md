# What was fixed in this copy

## 1. 🚨 Leaked Supabase credentials (critical — action required)

`backend/.env.example` had **real, live** Supabase keys committed to the repo,
including the `service_role` key (full admin access, bypasses RLS). That file
has been reset to empty placeholders here.

**You must still do this yourself, right now, if you haven't already:**
1. Supabase Dashboard → your project → Project Settings → API → click
   **Reset** next to both the `anon` and `service_role` keys.
2. Put the *new* keys into your actual `.env` files (never `.env.example`)
   and into your Render environment variables.
3. Check your git history — the old keys are still in past commits even
   after this fix. If this repo's history matters to you, either keep it
   private going forward and treat the old keys as burned (rotating is
   enough), or scrub history with `git filter-repo` / BFG if you need the
   repo public with a clean history.

## 2. Backend crash-prone PORT fallback (fixed)

`backend/src/index.ts` had:
```js
const PORT = Number(process.env.PORT || 'https://xedrou-com.vercel.app/');
```
A URL was accidentally used as the numeric port fallback (`Number(url)` is
`NaN`). Changed to:
```js
const PORT = Number(process.env.PORT) || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
```

## 3. Monorepo root directory (the actual 404 cause — needs a dashboard setting, not just a code fix)

This repo has **no root-level `package.json`** — `frontend/` and `backend/`
are each their own app. Vercel and Render can't auto-detect that. You must
set it explicitly:

### Vercel
1. Project → Settings → General → **Root Directory** → set to `frontend`
2. Project → Settings → Environment Variables → add:
   - `NEXT_PUBLIC_API_URL` = your live Render backend URL (e.g.
     `https://xedruo-backend.onrender.com`) — **not** `localhost:4000`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your new,
     rotated Supabase values
3. Redeploy.

### Render
Two options — pick one:
- **Manual:** Service → Settings → Root Directory → `backend`, Build
  Command → `npm install && npm run build`, Start Command → `npm start`.
- **Blueprint (recommended, added in this zip):** `render.yaml` is now at
  the repo root and already declares `rootDir: backend` plus all needed
  env var keys (values left blank for you to fill in via the Render
  dashboard when it prompts you, since `sync: false`). In Render: New →
  Blueprint → point at this repo → it reads `render.yaml` automatically.

Either way, also set `FRONTEND_ORIGIN` on the backend to your real Vercel
domain (e.g. `https://xedrou-com.vercel.app`) so CORS allows the frontend
to call it.

## 4. Not an issue (checked, ruled out)

- `ANTHROPIC_API_KEY` / `TRANSCRIPTION_PROVIDER_API_KEY` missing — both are
  read defensively (`null`/503 if unset), never crash the server, and only
  affect the two specific AI/transcription endpoints. Not related to 404s.
- The Next.js catch-all route folder is correctly named `[[...slug]]`
  (double brackets = optional catch-all, matches `/` too) — confirmed fine.
- `next.config.js` does not use static export — confirmed fine, this app
  needs the default Node/SSR output since routing is client-side.

## Redeploy checklist

1. Rotate Supabase keys (section 1).
2. Push this corrected code (or re-zip your own repo with these same edits).
3. Set Vercel Root Directory = `frontend`, add the three env vars above.
4. Deploy backend on Render via the included `render.yaml` Blueprint (or
   manual Root Directory = `backend`), fill in the prompted env vars.
5. Confirm `https://<your-backend>.onrender.com/health` returns
   `{"status":"ok"}`.
6. Confirm your Vercel domain loads the homepage.
