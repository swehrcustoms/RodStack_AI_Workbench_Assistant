# Production Roadmap

Prioritized path from current secure-but-limited state to production-ready RodStack.

## P0 — Completed (Prompt 1)

- [x] Remove hard-coded / `VITE_` admin passwords
- [x] Disable insecure frontend admin authorization
- [x] Remove client Anthropic API usage
- [x] Env validation rejecting client secrets
- [x] Architecture / security / data-flow docs
- [x] TypeScript foundation, ESLint, Prettier, Vitest, Playwright, Zod
- [x] `.env.example` + `vercel.json`
- [x] Release checklist

## P1 — Secure auth & admin (Prompt 2 recommended)

1. **Force Supabase Auth in production** (disable local password store when `PROD`)
2. **Admin role** via `app_metadata.role = 'admin'` (or equivalent)
3. **Admin Edge Functions** for user/CRM ops using service role server-side
4. **Re-wire AdminGate** to Supabase session + role check (still no password in client)
5. **Anthropic proxy** Edge Function; restore Ask Claude without client keys
6. **Rotate** any leaked Anthropic / admin credentials in Vercel

## P2 — Data integrity

1. Unify `rodstack.app.v2` and `rodstack.platform.v1` into one schema
2. Zod schemas for workspace payload + form submissions
3. Migration helpers / versioned storage keys
4. Harden forms webhook (auth header, rate limit, spam protection)
5. Confirm Google Sheet sharing is not “anyone with link can edit”

## P3 — Product hardening

1. Split `App.jsx` into route-level modules; incremental TS migration
2. Real AI extraction (server) replacing simulated scraper
3. CI: GitHub Actions running `npm run validate` (+ e2e on main)
4. Error monitoring (e.g. Sentry) without capturing secrets
5. Accessibility pass on marketing + bench critical paths

## P4 — Launch ops

1. Staging project on Vercel + separate Supabase project
2. Backup/export story for workspace JSON
3. Privacy policy / data retention for forms PII
4. Load test forms webhook and Supabase RLS policies
5. Go/no-go using [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)

## Prompt 2 recommendation

**Focus:** Secure authentication and a server-backed admin path.

Concrete deliverables for Prompt 2:

1. Production auth policy (Supabase-only in prod)
2. Admin role + Edge Function stubs (`/admin/*` APIs)
3. Anthropic proxy stub
4. Wire AdminGate to real session/role without reintroducing client secrets
5. Update SECURITY_AUDIT + RELEASE_CHECKLIST when admin is safely re-enabled
