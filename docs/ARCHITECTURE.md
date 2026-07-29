# Architecture — RodStack AI Workbench Assistant

## Overview

RodStack is a **client-first SPA** for custom fishing-rod workshop workflows: marketing landing, build bench, vault, CRM, inventory, analytics, forms, and (currently disabled) admin tooling.

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Vite SPA)                       │
│  main.jsx → marketing App OR disabled AdminGate              │
│  RodStackDataProvider → modules (bench, vault, CRM, …)       │
│  localStorage / IndexedDB / sessionStorage                   │
└───────────────┬──────────────────────────┬──────────────────┘
                │ optional                 │ optional
                ▼                          ▼
        Supabase Auth +              Forms webhook
        rodstack_workspaces          (Apps Script / Edge)
```

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 18 + JSX (TS foundation with `allowJs`) |
| Build | Vite 6 |
| Styling | Tailwind CSS |
| Auth (optional) | Supabase Auth; else local SHA-256 users |
| Persistence | localStorage, IndexedDB (`idb`), optional Supabase |
| Deploy | Vercel static (`vercel.json` SPA rewrites) |
| Validation | Zod (client env), ESLint, Prettier, Vitest, Playwright |

## Entry & routing

`src/main.jsx`:

- `#admin` or path ending `/admin` → `AdminGate` (disabled notice)
- Otherwise → `RodStackDataProvider` + `App.jsx`

App views use hash routing (`#view=<name>`), not React Router:

`marketing` | `landing` | `onboarding` | `bench` | `vault` | `crm` | `inventory` | `analytics` | `profile` | `scraper` | `forms`

## Source layout

```
src/
  main.jsx                 # Root router (admin vs app)
  App.jsx                  # Workshop shell + hash views
  MarketingLanding.jsx     # Marketing first viewport
  admin/                   # Gate (disabled) + legacy DB UI
  context/                 # Platform data + auth
  data/                    # Blueprints, forms store
  forms/                   # Signup / support / feature / welcome
  lib/                     # supabase, sync queue, photos, env
  modules/                 # Feature panels by domain
supabase/schema.sql        # Optional cloud table + RLS
```

## State management

- **Platform data:** `RodStackDataContext` (`rodstack.platform.v1`)
- **App UI / blueprint inventory:** `App.jsx` (`rodstack.app.v2`) — syncs builds into context
- **Photos:** IndexedDB `rodstack-photos`
- **Offline cloud writes:** `syncQueue` in localStorage

No Redux/Zustand; React context + local component state.

## Backend boundary

There is **no application backend in this repository**. Production capabilities that need secrets (Anthropic, admin ops, service role) must be implemented as:

- Supabase Edge Functions, or
- Vercel serverless / separate API, or
- Authenticated Google Apps Script webhooks

## Admin subsystem (legacy)

| Component | Role | Status |
|-----------|------|--------|
| `AdminGate` | Access control | **Disabled** — no password auth |
| `AdminDatabase` | Local user CRUD UI | Retained, unreachable |
| `AdminRecords` | Form submission viewer | Retained, unreachable |

Re-enable only after server-backed authorization (see roadmap).

## Deployment topology

1. `npm run build` → `dist/`
2. Vercel serves static assets
3. `vercel.json` rewrites all paths to `index.html` for SPA deep links (`/admin`)

## Design principles for production

1. **Public client env only** — validated by `src/lib/env.ts`
2. **RLS is mandatory** if Supabase is enabled
3. **Local-first OK** for workshop UX; cloud is sync, not source of truth unless product requires it
4. **Admin is privileged** — never client-string-compare passwords
