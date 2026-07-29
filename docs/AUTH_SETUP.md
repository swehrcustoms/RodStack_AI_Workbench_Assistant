# Secure Auth & Owner Console Setup

## 1. Apply database migration

```bash
# With Supabase CLI linked to your project:
supabase db push

# Or paste into Dashboard → SQL:
# supabase/migrations/20260729120000_auth_orgs_subscriptions.sql
```

## 2. Configure Auth

Dashboard → Authentication → Providers → Email enabled.

Recommended:

- Enable **Confirm email**
- Set Site URL to your Vercel URL
- Add redirect URLs: `http://localhost:5173/**`, `https://<your-app>.vercel.app/**`

## 3. Client env

```bash
cp .env.example .env.local
```

Set only:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Production **requires** these (local password auth is disabled when `import.meta.env.PROD`).

## 4. Deploy Edge Functions

Requires service role on the server (never in `VITE_*`):

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
```

Secrets are injected automatically for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` on hosted functions.

## 5. Promote a platform owner

After your user signs up and the `handle_new_user` trigger creates a profile:

```sql
insert into public.platform_admins (user_id, platform_role)
values ('<your-auth-user-uuid>', 'platform_owner');
```

Roles:

| Role | Access |
|------|--------|
| `platform_owner` | Full owner console + mutations |
| `support_admin` | Troubleshooting mutations (preview, support view, overrides) |
| `read_only_support` | Read-only admin console |

Org roles: `owner` | `admin` | `builder` | `viewer`

## 6. Use the console

- App auth: Profile view → sign up / sign in / reset password
- Owner console: `/admin` (login at `/admin/login`)
- Routes: `/admin/users`, `/organizations`, `/subscriptions`, `/entitlements`, `/audit`, `/system`

## 7. Verify

```bash
npm run validate
```

Unit tests cover authorization, tenant isolation, preview entitlement merge, RLS migration smoke, and edge function stubs.
