# Security Audit — RodStack AI Workbench Assistant

**Audit date:** 2026-07-29

## Threat model (current)

Attackers can:

- Inspect the entire client bundle and `VITE_*` values
- Set arbitrary `localStorage` / `sessionStorage`
- Call public Supabase anon endpoints within RLS limits
- Hit optional forms webhooks if URL is guessable/public

Therefore: **anything in the browser is not a secret**, and **client-only gates are not authorization**.

## Fixed in this pass

### 1. Hard-coded / `VITE_` admin password

**Before:** `AdminGate` compared input to `import.meta.env.VITE_ADMIN_PASSWORD || "rodstack-admin-2026"` and set `sessionStorage["rodstack.admin.session"] = "1"`.

**After:** Admin route renders a disabled notice. No password field. Legacy session key cleared on load. Env validator rejects `VITE_ADMIN_PASSWORD`.

### 2. Anthropic API key in the browser

**Before:** `AdminDatabase` called `https://api.anthropic.com/v1/messages` with `VITE_ANTHROPIC_API_KEY` and `anthropic-dangerous-direct-browser-access`.

**After:** Ask Claude returns a disabled message. Env validator rejects `VITE_ANTHROPIC_API_KEY`. Future AI must use a server proxy.

### 3. Documentation password leakage

Admin navigation HTML/CSV no longer publish a default password.

## Open issues

### High — No privileged admin path → Resolved (Prompt 2)

Admin console is re-enabled at `/admin` using **Supabase Auth + `platform_admins`** and **Edge Functions** with the service role. Client password gates remain forbidden.

Open follow-ups: Anthropic proxy; live E2E against a staging Supabase project.

### Medium — Local auth password hashes

When Supabase is unset, `RodStackDataContext` stores unsalted SHA-256 hashes in `localStorage`. Acceptable only for demo; production should force Supabase Auth.

### Medium — Forms webhook

`VITE_FORMS_WEBHOOK_URL` is public once deployed. Protect with shared secret headers checked server-side, rate limits, and CAPTCHA if abuse appears.

### Medium — PII in localStorage / admin mock users

Form records and admin user JSON live in browser storage. Treat as device-local demo data until a real CRM backend exists.

### Low — Google Sheet IDs

Sheet IDs are not credentials; ensure sharing is locked down (anyone-with-link edit is unsafe).

## Forbidden client env keys

`src/lib/env.ts` rejects non-empty values for:

- `VITE_ADMIN_PASSWORD`
- `VITE_ANTHROPIC_API_KEY` / `VITE_ANTHROPIC_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_SERVICE_ROLE_KEY` / `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Allowed public client env

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (must be paired with correct RLS)
- `VITE_FORMS_WEBHOOK_URL` (treat as semi-public endpoint)

## Credential rotation checklist

If any of the following were ever set in Vercel or shared locally, rotate them:

1. Anthropic API keys used as `VITE_ANTHROPIC_API_KEY`
2. Any password matching the old default admin string
3. Supabase service role keys if ever pasted into `VITE_*`
4. Forms webhook URLs if they embed secrets in the path

## Secure admin re-enable criteria

Met for subscription troubleshooting console:

1. Server verifies platform admin via `platform_admins` (Edge Functions + JWT)
2. Mutations go through privileged Edge Functions (service role)
3. No admin password in client code or `VITE_*`
4. AI features still require a future Anthropic proxy (Ask Claude remains disabled)
