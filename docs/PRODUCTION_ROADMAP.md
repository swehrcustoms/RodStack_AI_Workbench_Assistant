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

## P1 — Secure auth & admin (Prompt 2) — implemented

- [x] Force Supabase Auth in production (local auth disabled when `PROD`)
- [x] Platform roles via `platform_admins` (`platform_owner` / `support_admin` / `read_only_support`)
- [x] Org roles: owner / admin / builder / viewer + memberships
- [x] Admin Edge Functions for subscription troubleshooting
- [x] Secure AdminApp at `/admin/*` (Supabase session + platform role)
- [ ] Anthropic proxy Edge Function (deferred — restore Ask Claude later)
- [ ] Rotate any historically leaked Anthropic / admin credentials in Vercel

See [AUTH_SETUP.md](./AUTH_SETUP.md).

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

## Prompt 2 status

Delivered: migrations, AuthProvider, protected `/admin` console, org/platform roles, subscription troubleshooting Edge Functions, audit logging, unit tests.

Remaining: Anthropic proxy; live integration tests against a real Supabase project; Stripe billing sync into `subscriptions`.

See [AUTH_SETUP.md](./AUTH_SETUP.md).

## Prompt 2 recommendation (historical)

**Focus:** Secure authentication and a server-backed admin path.

Concrete deliverables for Prompt 2:

1. Production auth policy (Supabase-only in prod)
2. Admin role + Edge Function stubs (`/admin/*` APIs)
3. Anthropic proxy stub
4. Wire AdminGate to real session/role without reintroducing client secrets
5. Update SECURITY_AUDIT + RELEASE_CHECKLIST when admin is safely re-enabled
