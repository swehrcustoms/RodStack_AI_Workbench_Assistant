# Data Flow — RodStack AI Workbench Assistant

## Workshop platform data

```
User edits (bench / CRM / inventory / quotes / profile)
        │
        ▼
RodStackDataContext setters
        │
        ├─► localStorage["rodstack.platform.v1"]   (always)
        │
        └─► if signed in + Supabase configured
                │
                ├─► debounced upsert → rodstack_workspaces
                └─► on failure/offline → syncQueue (localStorage)
```

`App.jsx` also persists UI + blueprint inventory to `rodstack.app.v2` and mirrors builds into the platform context.

## Authentication

```
AuthPanel → signIn / signUp
        │
        ├─► Supabase Auth (if VITE_SUPABASE_* set)
        │       session managed by supabase-js
        │
        └─► else local mode
                password → SHA-256 hash
                users → localStorage["rodstack.local.users"]
                session → localStorage["rodstack.local.auth.v1"]
```

## Forms suite

```
Signup / Support / Feature / Welcome
        │
        ├─► postToEndpoint(VITE_FORMS_WEBHOOK_URL)  // optional; else simulated ok
        ├─► append to localStorage forms store
        └─► signup upserts into local admin users store
```

Admin Form Records UI reads the same local stores (currently unreachable behind disabled gate).

## Photos

```
PhotoLogPanel → photoStore (IndexedDB "rodstack-photos") → data URLs
```

## AI flows

| Flow | Behavior |
|------|----------|
| Admin Ask Claude | **Disabled** — no client Anthropic key |
| “AI Extraction” scraper in App | Simulated (`setTimeout`); no network LLM |

Future AI:

```
Browser → authenticated API / Edge Function → Anthropic (server key) → response
```

## Admin route

```
/#admin or /admin → AdminGate → "Access disabled" (no data mutations)
```

Legacy `sessionStorage["rodstack.admin.session"]` is cleared on app load.

## External systems

| System | Direction | Notes |
|--------|-----------|-------|
| Supabase | Bidirectional | Auth + workspace JSON; RLS required |
| Forms webhook | Outbound POST | Optional |
| Google Sheets | Link-only / webhook | IDs in client; sync outside repo |
| Anthropic | — | Must not be called from browser |

## Storage key reference

| Key | Storage | Purpose |
|-----|---------|---------|
| `rodstack.platform.v1` | localStorage | Builds, CRM, inventory, quotes |
| `rodstack.app.v2` | localStorage | App UI + blueprint inventory |
| `rodstack.local.auth.v1` | localStorage | Local auth session |
| `rodstack.local.users` | localStorage | Local user accounts |
| `rodstack.benchMode` | localStorage | Bench mode flag |
| `rodstack.sync.queue.v1` | localStorage | Offline cloud sync |
| `rodstack.forms.records.v1` | localStorage | Form submissions |
| `rodstack.admin.users.v1` | localStorage | Admin user DB (local) |
| `rodstack.admin.session` | sessionStorage | Legacy admin unlock (cleared) |
| `rodstack-photos` | IndexedDB | Photo log |
