# Staging Deployment Checklist

Use a **staging** Supabase project and Vercel Preview/staging deployment. Do not run these against production until accepted.

## Prerequisites

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] `supabase login`
- [ ] Staging project created in Supabase Dashboard
- [ ] Vercel project with Preview env vars ready

## 1. Link and migrate

```bash
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
```

Migrations applied (ordered):

1. `20260729120000_auth_orgs_subscriptions.sql`
2. `20260729140000_stripe_sync_and_promote_owner.sql`

## 2. Auth settings

Dashboard → Authentication:

- [ ] Email provider enabled
- [ ] Confirm email enabled (recommended)
- [ ] Site URL = staging Vercel URL
- [ ] Redirect URLs include `http://localhost:5173/**` and staging URL `/**`

## 3. Function secrets

```bash
supabase secrets set \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-sonnet-4-20250514}" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  STRIPE_PRICE_PRO="$STRIPE_PRICE_PRO" \
  STRIPE_PRICE_ENTERPRISE="$STRIPE_PRICE_ENTERPRISE"
```

## 4. Deploy functions

```bash
npm run deploy:staging
# or manually:
# supabase functions deploy ask-claude
# supabase functions deploy stripe-webhook --no-verify-jwt
# …plus all admin-* functions
```

## 5. Vercel env (browser-safe only)

| Variable | Scope |
|----------|--------|
| `VITE_SUPABASE_URL` | Preview/Staging |
| `VITE_SUPABASE_ANON_KEY` | Preview/Staging |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional |

Redeploy after setting env vars.

## 6. Promote first platform owner

1. Sign up via the staging app (Profile → Create Account)
2. Confirm email if required
3. Run (server-side secrets in your shell — not Vercel `VITE_*`):

```bash
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."   # Dashboard → Settings → API
npm run admin:promote-owner -- --email you@example.com
```

Expected JSON includes `previous_role`, `platform_role: "platform_owner"`.

## 7. Verify `/admin/login`

- [ ] Anonymous user can open `/admin/login`
- [ ] Owner signs in and reaches `/admin`
- [ ] Non-admin signed-in user sees “Not a platform admin”
- [ ] Sign out returns to login
- [ ] Ask Claude at `/admin/ask` (needs Anthropic secret)
- [ ] System page lists Edge Functions

## 8. Stripe webhook

Stripe Dashboard → Webhooks → endpoint:

`https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`

Local:

```bash
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

Checkout sessions **must** include metadata `organization_id=<uuid>`.

Reconcile:

```bash
npm run stripe:reconcile -- --subscription-id sub_xxx
```

## 9. Staging E2E

```bash
export PLAYWRIGHT_BASE_URL="https://your-staging.vercel.app"
export E2E_PLATFORM_OWNER_EMAIL="..."
export E2E_PLATFORM_OWNER_PASSWORD="..."
export E2E_STANDARD_USER_EMAIL="..."
export E2E_STANDARD_USER_PASSWORD="..."
npm run test:e2e:staging
```

## 10. Acceptance

- [ ] Supabase migrations applied
- [ ] Edge Functions deployed
- [ ] First user promoted to `platform_owner`
- [ ] `/admin/login` verified
- [ ] Admin routes blocked for non-owners
- [ ] Ask Claude request succeeds (or controlled `not_configured`)
- [ ] Anthropic key remains server-side
- [ ] Stripe checkout creates subscription state
- [ ] Stripe subscription changes synchronize
- [ ] Stripe cancellation updates access
- [ ] RLS isolation verified
- [ ] Staging E2E suite passes
- [ ] `npm run validate` passes
