# Secure Auth & Owner Console Setup

## Stack note

RodStack is a **Vite + React SPA** on Vercel with **Supabase Auth, Postgres RLS, and Edge Functions**. There is no Next.js API layer; privileged work runs in Edge Functions and local server-only CLI scripts.

Full staging runbook: [STAGING_CHECKLIST.md](./STAGING_CHECKLIST.md)

## 1. Apply database migrations

```bash
supabase login
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
```

Or paste both files from `supabase/migrations/` into the Dashboard SQL editor (in timestamp order).

## 2. Configure Auth

Dashboard → Authentication → Providers → Email enabled.

Recommended:

- Enable **Confirm email**
- Set Site URL to your Vercel URL
- Add redirect URLs: `http://localhost:5173/**`, `https://<your-app>.vercel.app/**`

Password reset redirects to `/#view=profile` (handled by the SPA hash router).

## 3. Client env

```bash
cp .env.example .env.local
```

Set only browser-safe values:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Production **requires** these (local password auth is disabled when `import.meta.env.PROD`).

## 4. Deploy Edge Functions

```bash
npm run deploy:staging
```

Or individually:

```bash
supabase functions deploy admin-get-user
supabase functions deploy admin-search-users
supabase functions deploy admin-get-subscription
supabase functions deploy admin-refresh-entitlements
supabase functions deploy admin-start-plan-preview
supabase functions deploy admin-end-plan-preview
supabase functions deploy admin-start-support-view
supabase functions deploy admin-end-support-view
supabase functions deploy admin-manual-override
supabase functions deploy ask-claude
supabase functions deploy stripe-webhook --no-verify-jwt
```

Set secrets (never `VITE_*`):

```bash
supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=claude-sonnet-4-20250514
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...
supabase secrets set STRIPE_PRICE_PRO=price_... STRIPE_PRICE_ENTERPRISE=price_...
```

Hosted functions also receive `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically.

## 5. Promote a platform owner

After signup (profile + org created by `handle_new_user`):

```bash
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."   # service role — local shell only
npm run admin:promote-owner -- --email owner@example.com
```

This calls `public.promote_platform_owner(...)`, which:

- Confirms the profile exists
- Upserts `platform_admins`
- Writes an `audit_logs` row
- Is **revoked** from `anon` / `authenticated` (service_role only)

Do **not** promote via a client page with a service-role key.

Roles:

| Role | Access |
|------|--------|
| `platform_owner` | Full owner console + mutations |
| `support_admin` | Troubleshooting mutations (preview, support view, overrides, Ask Claude) |
| `read_only_support` | Read-only admin console |

Org roles: `owner` | `admin` | `builder` | `viewer`

## 6. Use the console

- App auth: Profile view → sign up / sign in / reset password / change password
- Owner console login: `/admin/login`
- Protected routes (require `platform_admins` row):
  - `/admin`
  - `/admin/users`
  - `/admin/organizations`
  - `/admin/subscriptions`
  - `/admin/entitlements`
  - `/admin/ask`
  - `/admin/audit`
  - `/admin/system`

Authorization is enforced by:

1. `ProtectedRoute` (client UX gate)
2. `platform_admins` RLS reads
3. Edge Functions (`requirePlatformAdmin` + service role writes)

## 7. Ask Claude

Open `/admin/ask` as `platform_owner` or `support_admin`. The browser calls `ask-claude`; the key stays in Edge secrets.

## 8. Stripe subscriptions

Webhook URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

Include `organization_id` in Checkout/Subscription metadata. Reconcile with:

```bash
npm run stripe:reconcile -- --subscription-id sub_xxx
```

## 9. Verify

```bash
npm run validate
npm run test:e2e:staging   # when PLAYWRIGHT_BASE_URL + E2E_* are set
```
