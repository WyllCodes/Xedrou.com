# Xedruo — Full-Stack Rebuild (Next.js + Express + Supabase + Docker)

This is your Base44 app (`xedruo`), migrated off Base44's hosting onto a stack you fully
own. **The UI is unchanged** — every file in `frontend/src/pages` (now `frontend/src/screens`,
see note below) and `frontend/src/components` is byte-for-byte what Base44 generated. Only the
data layer underneath changed.

# Xedruo — Full-Stack Rebuild (Next.js + Express + Supabase + Docker)

This is your Base44 app (`xedruo`), migrated off Base44's hosting onto a stack you fully
own. **The UI is unchanged** — every file in `frontend/src/screens` and `frontend/src/components`
is byte-for-byte what Base44 generated. Only the data layer underneath changed.

## Full backend independence

The frontend has **zero dependency on Base44 or Supabase** — it only ever talks to your own
Express API (`NEXT_PUBLIC_API_URL`). There is no `@base44/sdk` and no `@supabase/supabase-js`
anywhere in `frontend/`. Express is the single backend the browser depends on:

- **Auth** — login, register, OTP verify/resend, password reset, OAuth, refresh, logout: all
  proxied through `backend/src/routes/auth.ts`. The frontend stores the resulting access/refresh
  tokens itself and sends them as a Bearer header; it never calls Supabase's auth API directly.
- **Data** — generic CRUD through `backend/src/routes/entities.ts`.
- **Realtime** — Express holds the one server-side Supabase Realtime subscription per live
  table and re-broadcasts changes to the frontend over its own Socket.IO server
  (`backend/src/realtime.ts`). The frontend connects to `NEXT_PUBLIC_API_URL` via
  `socket.io-client`, never to Supabase.
- **Integrations** — file upload, LLM calls, email, transcription: all proxied through Express
  so secret keys (Supabase service role, Anthropic API key, SMTP credentials) never reach the
  browser.

Supabase is purely the database/auth *provider* Express is built on — the same role any managed
Postgres would play. Swap it for something else later and only `backend/` needs to change.

## What changed, and why it's safe

| Before (Base44) | Now | Why your UI still looks/works identically |
|---|---|---|
| `@base44/sdk` client, app-token auth | Express REST + Socket.IO, backed by Supabase | `frontend/src/api/base44Client.js` is a drop-in shim exposing the **exact same** `base44.entities.X.*`, `base44.auth.*`, `base44.integrations.Core.*` methods your pages already call. No page/component code changed. |
| Base44-hosted Postgres, 21 entity types | Real Postgres via Supabase, auto-generated from your `base44/entities/*.jsonc` schemas | `scripts/gen-schema.js` converts each entity's JSON Schema into a `CREATE TABLE` + RLS policies. |
| Vite + `react-router-dom` | Next.js App Router shell, wrapping the **same** `react-router-dom` app | `frontend/app/[[...slug]]/page.tsx` mounts your untouched `App.jsx` (with its own `<BrowserRouter>`) inside one Next.js catch-all route. |
| `src/pages/` | `src/screens/` | Next.js reserves `src/pages/` for its own (legacy) Pages Router. Renamed folder, updated the one file that imports from it (`App.jsx`). |
| Base44 OAuth/session handling | Express-issued sessions (Supabase Auth under the hood, never exposed to the browser) | New `frontend/src/screens/AuthCallback.jsx` handles the OAuth redirect; everything else in `AuthContext.jsx` kept its exact same exported interface. |

## Project layout

```
xedruo-fullstack/
├── frontend/          Next.js 14 + TypeScript shell around your unchanged React app
│   ├── app/            Next.js App Router shell (layout + catch-all route)
│   └── src/             <- your original app, unchanged (screens/, components/, hooks/, lib/)
├── backend/           Express + TypeScript API
│   └── src/
│       ├── routes/entities.ts        generic CRUD for all 21 entities
│       ├── routes/auth.ts            profile/role endpoint pairing with Supabase Auth
│       ├── routes/integrations.ts    file upload, LLM, email, transcription
│       └── entities/registry.ts      auto-generated — do not hand-edit
├── supabase/
│   └── migrations/0001_init.sql       auto-generated — run this against your Supabase project
├── scripts/gen-schema.js              regenerates the SQL + registry.ts from base44_entities_src/
├── base44_entities_src/               your original base44/entities/*.jsonc (source of truth)
└── docker-compose.yml
```

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard → New project.
2. Once it's up, go to **Project Settings → API** and copy: `Project URL`, `anon public` key,
   `service_role` key. All three go in `backend/.env` only — the frontend never sees them.
3. Go to **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and run it.
   (Or, if you use the Supabase CLI: `supabase link` then `supabase db push`.)
4. Go to **Storage** → create a bucket named `uploads` (matches `SUPABASE_STORAGE_BUCKET`), and
   mark it public if you want uploaded files (cover art, KYC docs, etc.) reachable by URL.
5. Go to **Database → Replication** and enable replication for the tables backing live updates:
   `artist_bookings`, `availability_slots`, `events`, `notifications`, `releases`,
   `royalty_statements`, `ticket_purchases`. Express subscribes to these server-side and
   re-broadcasts to the frontend over its own Socket.IO server — Supabase Realtime itself is
   never reached from the browser.
6. Go to **Authentication → Providers** and enable Email, plus Google if you want
   `loginWithProvider("google", ...)` (used on the Login/Register pages) to work. Under
   **URL Configuration**, no extra redirect URL is needed beyond what Express builds
   dynamically (`FRONTEND_ORIGIN/auth/callback`) — just make sure `FRONTEND_ORIGIN` in your env
   matches where the frontend is actually running.
7. Go to **Authentication → Email Templates** — Base44's register flow used a 6-digit OTP; if
   you want the same UX, switch the "Confirm signup" template to `{{ .Token }}` (OTP code)
   instead of the default magic link. Otherwise, `register()` still works, it just returns
   `requiresVerification: true` and the user clicks the emailed link instead of entering a code.

## 2. Configure environment variables

Copy the root example env and fill it in — it feeds both containers:

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from step 1, and
`ANTHROPIC_API_KEY` if you want the AI Assistant / voice-sample tools to work (they call Claude).

For local (non-Docker) dev, also copy the per-app examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Note `frontend/.env.example` only has one variable (`NEXT_PUBLIC_API_URL`) — that's not an
oversight, the frontend genuinely doesn't need anything else.

## 3. Run it

### With Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000/health

### Without Docker

```bash
# terminal 1
cd backend && npm install && npm run dev

# terminal 2
cd frontend && npm install && npm run dev
```

## Regenerating the schema

If you add/edit an entity in `base44_entities_src/*.jsonc`, regenerate the SQL and the backend's
entity registry, then re-run the new SQL in Supabase's SQL editor:

```bash
node scripts/gen-schema.js
```

## Known gaps / things to wire up yourself

- **`TranscribeAudio`** (`backend/src/routes/integrations.ts`) is a stub — Base44's built-in
  transcription doesn't have a drop-in open replacement, so pick a provider (OpenAI Whisper API,
  Deepgram, AssemblyAI) and fill in the TODO there. Everything else in `VoiceSampleTool.jsx`
  works unchanged once that one call is wired up.
- **`OAuthConsent.jsx`** is Base44's platform-hosted "let an AI client use this app" MCP consent
  screen. It calls Base44-only endpoints (`/api/apps/:id/mcp/...`) that have no equivalent here.
  The page still renders (via a no-op `appParams` stub in `src/lib/app-params.js`) but its
  approve/deny actions won't succeed against your new backend. Safe to delete if you don't need
  MCP/AI-client access to your app; otherwise you'd need to build an equivalent consent-info /
  authorize-grant pair of endpoints.
- **Stripe** (`@stripe/react-stripe-js`) is still a dependency (used by payment components) but
  needs your own Stripe keys wired into whatever component reads them — check
  `frontend/src/components/distribution/DistributionPaymentGate.jsx` and
  `frontend/src/components/app/PaymentModal.jsx`.
- **Admin role**: the first user doesn't automatically become admin. After registering, promote
  yourself in Supabase: `update user_profiles set role = 'admin' where id = '<your-auth-uid>';`
