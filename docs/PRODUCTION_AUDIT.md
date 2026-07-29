# Production Audit — RodStack AI Workbench Assistant

**Date:** 2026-07-29  
**Scope:** Full repository security, architecture, tooling, and production readiness  
**Status:** Security foundation complete; admin console disabled pending server auth

## Executive summary

RodStack is a Vite + React SPA for custom rod builders with optional Supabase sync, local-first storage, forms, and a legacy admin console. This audit removed immediate client-side secret exposure and frontend-only admin authorization, then added TypeScript, lint/format/test tooling, env validation, and production documentation.

## Critical findings (resolved in this pass)

| Finding | Severity | Action taken |
|---------|----------|--------------|
| Hard-coded admin password `rodstack-admin-2026` | Critical | Removed; admin gate disabled |
| `VITE_ADMIN_PASSWORD` client auth | Critical | Removed; not allowed by env validation |
| `VITE_ANTHROPIC_API_KEY` browser Anthropic calls | Critical | Removed; Ask Claude disabled pending server proxy |
| Frontend-only admin + `sessionStorage` flag | Critical | Gate no longer unlocks; legacy session cleared |
| Password published in docs/CSV | High | Docs updated to “disabled” |

## Remaining production risks (not fully resolved)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| No server-backed admin auth | High | Prompt 2: Supabase roles / Edge Functions |
| Local auth: unsalted SHA-256 in `localStorage` | Medium | Require Supabase Auth in production |
| Forms webhook optional / unauthenticated | Medium | Authenticated Edge Function or Apps Script token |
| Google Sheet IDs in client source | Low | Acceptable if sheets are not world-writable |
| Dual storage (`rodstack.app.v2` + platform v1) | Medium | Unify data model |
| No CI yet | Medium | Add GitHub Actions for `validate` |
| Large `App.jsx` monolith | Medium | Incremental modularization + TS migration |

## Architecture snapshot

- **Frontend only** in-repo; deploy as static Vite app on Vercel
- **Optional cloud:** Supabase Auth + `rodstack_workspaces` JSON blob (RLS)
- **Local-first:** `localStorage` + IndexedDB photos + offline sync queue
- **Admin:** UI retained under `src/admin/` but **unreachable** via secure gate

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [DATA_FLOW.md](./DATA_FLOW.md).

## Tooling added

- TypeScript (`allowJs`, strict for new `.ts`)
- ESLint 9 flat config + Prettier
- Vitest + React Testing Library
- Playwright e2e (landing + admin disabled)
- Zod client env validation (`src/lib/env.ts`)
- `.env.example`, `vercel.json` SPA rewrites
- Scripts: `typecheck`, `lint`, `test`, `test:e2e`, `validate`

## Completion checks

- [x] No default admin passwords in source
- [x] No client-side secret `VITE_*` usage
- [x] Admin production access disabled until secure auth
- [x] Documentation suite created
- [x] Build / lint / typecheck / unit tests (run via `npm run validate`)
- [x] Landing page e2e specs added (`e2e/landing.spec.ts`)
  - Note: Playwright browsers are unavailable on macOS 12 locally; run `npm run test:e2e` on CI or macOS 13+ / Linux

## Safe production path (short)

1. Keep admin disabled (current state).
2. Configure only public env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (+ optional forms webhook).
3. Apply `supabase/schema.sql` and verify RLS.
4. Rotate any Anthropic/admin credentials that were ever set in Vercel.
5. Follow [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) for Prompt 2+.

## Related docs

- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATA_FLOW.md](./DATA_FLOW.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md)
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
