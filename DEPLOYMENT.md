# RodStack Multi-Tenant Deployment Guide

This guide covers deploying the RodStack multi-tenant white-label system from purchase to live client portal.

## Prerequisites

- Supabase project with `supabase/multi-tenant-schema.sql` applied
- Stripe account with products/prices for each tier
- Vercel account with API token
- SendGrid account for transactional email
- Wildcard DNS: `*.rodstack.app` → `cname.vercel-dns.com`

## Initial Setup

### 1. Database

Run the full schema in Supabase SQL Editor:

```bash
# File: supabase/multi-tenant-schema.sql
```

This creates `clients`, `feature_flags`, `client_team_members`, `client_activity_log`, `api_usage_logs`, `invoices`, and RLS policies.

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values. Set the same variables in Vercel project settings.

### 3. Stripe Webhooks

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://rodstack.app/api/webhooks/stripe`
3. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Deploy Main App

```bash
npm install
npm run build
vercel --prod
```

## Automated Client Onboarding Flow

```
Customer purchases on rodstack.app
  → Stripe webhook (/api/webhooks/stripe)
  → Client record created in Supabase
  → Deployment queued (/api/deploy-client)
  → Vercel project created for {slug}
  → Custom domain configured (Pro+)
  → Welcome + portal-ready emails sent
  → Client accesses https://{slug}.rodstack.app
```

Typical deployment time: 2–5 minutes.

## White-Glove Manual Deployment

1. Navigate to `https://rodstack.app/#admin`
2. Sign in with admin password
3. Open **Client Portals** tab
4. Fill in Create Client Form (company, tier, branding)
5. Submit — deployment queues automatically
6. Edit client details, preview portal
7. Click **Send** to email handoff template to client

## Per-Tenant Vercel Deployment

Each client gets a Vercel project named `rodstack-{slug}` with environment variables:

| Variable | Purpose |
|----------|---------|
| `VITE_TENANT_ID` | UUID from `clients` table |
| `VITE_CLIENT_SLUG` | Subdomain slug |
| `VITE_SUBSCRIPTION_TIER` | Feature tier |
| `VITE_FEATURES` | JSON feature flags |
| `VITE_BRAND_COLOR_*` | Branding |
| `VITE_LOGO_URL` | Client logo |

## Custom Domains (Pro+)

For `pro`, `business`, and `enterprise` tiers, the deployment pipeline automatically assigns `{slug}.rodstack.app` via the Vercel Domains API.

Enterprise customers can set `custom_domain` on the client record for full white-label.

## Redeploying After Config Changes

When tier or branding changes require a portal rebuild:

```bash
curl -X POST https://rodstack.app/api/deploy-client \
  -H "Authorization: Bearer $DEPLOY_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<uuid>","slug":"acme","tier":"pro"}'
```

## Monitoring

Track these metrics in production:

- Deployment success rate (target: >99%)
- Webhook processing latency (target: <100ms)
- Portal uptime (target: >99.9%)
- Failed deployments (alert if 5+ consecutive)

## Security Checklist

- [ ] RLS enabled on all tenant tables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only on server
- [ ] Stripe webhook signature validation enabled
- [ ] `DEPLOY_WEBHOOK_SECRET` set for deploy endpoint
- [ ] `ADMIN_API_SECRET` rotated from default
- [ ] JWT `tenant_id` claim set on user signup
