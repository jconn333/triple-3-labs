# triple-3-labs

The Triple 3 Labs website (triple3labs.io) and the CRM behind it, in one
Next.js 16 app. Deployed on Vercel from `main`; Supabase project
`cksdehpjxvkrvubmjjcl` holds the data.

## What lives where

| Area | Routes | Source |
|---|---|---|
| Marketing site | `/`, `/pricing`, `/work`, `/blog`, `/[vertical]`, `/takeoff-estimator`, … | `src/app/(marketing)/`, `src/components/` |
| CRM admin (login required) | `/admin/*` (see below) | `src/app/admin/`, `src/components/admin/`, `src/components/ui/` |
| Public client flows | `/sign/[token]` (e-sign), `/onboarding/[token]`, `/ticket/[id]`, `/support`, `/approve` | `src/app/…` |
| Prospect reports | `/r/[slug]` (view-tracked) | `src/app/r/` |
| API | `/api/*` | `src/app/api/` |

### Admin routes (Sept 2026 redesign)

| Page | Route | Was |
|---|---|---|
| Home | `/admin` | `/admin/command` + `/admin/dashboard` |
| Clients | `/admin/clients`, `/admin/clients/[id]` | `/admin/accounts/…` |
| Pipeline | `/admin/pipeline` (`?deal=<id>` opens the deal panel) | same |
| People | `/admin/people`, `/admin/people/[id]` | `/admin/contacts/…` |
| Tickets | `/admin/tickets`, `/admin/tickets/[id]` | same |
| Agents | `/admin/agents` | `/admin/mission-control` |
| Blog posts | `/admin/blog` (account menu) | same |

Old admin paths redirect. API paths are unchanged (`/api/accounts`,
`/api/contacts`, `/api/mission-control`, …).

### Admin design system

`/admin` is a light workspace (dark toggle in the account menu) scoped by the
`.admin` class in `src/app/globals.css`, set in Geist. Build every admin
surface from `src/components/ui/` and follow `src/components/ui/README.md`
(tokens, type scale, what colors may mean). Record pages use
`src/components/admin/RecordShell.tsx`; pages declare their title and actions
with `PageHeader`; ⌘K is `src/components/admin/CommandPalette.tsx`.

Dev fixture harnesses that need no login: `/dev/command-preview` (Home) and
`/dev/mc-preview` (Agents). 404 outside development.

## Scripts (`scripts/`)

- `crm.mjs` — Zeke's write path into the CRM (`find`, `move-deal`, `log`,
  `attach-link`, `record-delivery`, `set-mrr`, …). Service-role; loads
  `.env.local` itself. Used by the `crm` skill from Pingo sessions.
- `t3-private-brief.mjs`, `t3-agent-sweep.mjs`, `t3-ppc-sweep.mjs` — the
  7:15am private brief and its inputs (launchd plists alongside).
- `publish-report.mjs` — publish a prospect report to `/r/<slug>`.
- `register-stripe-webhook.mjs` — one-time Stripe webhook registration.
- Per-client one-offs (`*-link.mjs`, `*-subscription.mjs`) — payment links and
  subscriptions created for specific clients; keep for the audit trail.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (what Vercel runs)
npm run lint
```

Copy `.env.local` from Vercel or a teammate; it needs the Supabase URL,
anon and service-role keys, Stripe keys and webhook secret, Anthropic key,
Resend key, the ops Supabase pair, and `NEXT_PUBLIC_SITE_URL`.

The admin needs a Supabase-auth login. For headless UI checks, mint a
one-time magic link with the service role (`auth.admin.generateLink`) and
resolve it against localhost rather than typing a password anywhere.
