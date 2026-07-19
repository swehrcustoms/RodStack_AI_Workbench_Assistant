# RodStack Multi-Tenant Troubleshooting

Common issues and fixes for the multi-tenant system.

## Deployment Issues

### Portal stuck in `pending` or `in_progress`

**Cause:** Deploy webhook failed or Vercel token missing.

**Fix:**
1. Check Vercel function logs for `/api/deploy-client`
2. Verify `VERCEL_TOKEN` is set
3. Manually trigger redeploy:
   ```bash
   curl -X POST https://rodstack.app/api/deploy-client \
     -H "Authorization: Bearer $DEPLOY_WEBHOOK_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"clientId":"<id>","slug":"<slug>","tier":"pro"}'
   ```

### Deployment status `failed`

**Cause:** Vercel API error, GitHub repo access, or timeout.

**Fix:**
1. Read `deployment_error` column on client record
2. Confirm `GITHUB_REPO` is accessible
3. Check Vercel team permissions
4. Retry deployment after fixing root cause

### `{slug}.rodstack.app` not resolving

**Cause:** Wildcard DNS not configured.

**Fix:**
```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

## Stripe Webhook Issues

### Webhook returns 400 (signature error)

**Fix:** Ensure `STRIPE_WEBHOOK_SECRET` matches the endpoint signing secret in Stripe Dashboard. For local testing use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

### Client not created after purchase

**Fix:**
1. Confirm webhook subscribed to `checkout.session.completed`
2. Check `STRIPE_PRICE_*` env vars match Stripe price IDs
3. Review Supabase logs for insert errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

## Tenant Isolation Issues

### User sees another tenant's data

**Critical** — investigate immediately:

1. Verify JWT contains `app_metadata.tenant_id`
2. Confirm RLS policies are applied (`supabase/multi-tenant-schema.sql`)
3. Check API handlers use JWT tenant_id, not request body
4. Run test suite: `npm test`

### 403 Tenant mismatch

**Cause:** JWT `tenant_id` doesn't match portal slug.

**Fix:** Re-issue JWT with correct `tenant_id` on login. Set tenant_id in Supabase Auth user metadata during onboarding.

## Feature Gate Issues

### Feature locked but client paid for tier

**Fix:**
1. Verify `subscription_tier` on client record
2. Check `feature_flags` table has correct row
3. Redeploy portal to refresh `VITE_FEATURES` env var

### CRM/Analytics not showing after upgrade

**Fix:** Tier change updates DB immediately but portal env vars need redeploy.

## Email Issues

### Welcome/portal emails not sending

**Fix:**
1. Verify `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`
2. Confirm sender domain verified in SendGrid
3. Check function logs — emails skip gracefully if key missing

## Admin Portal Issues

### "Failed to load clients"

**Fix:**
1. Run `supabase/multi-tenant-schema.sql`
2. Set `ADMIN_API_SECRET` in Vercel and `VITE_ADMIN_API_SECRET` for frontend
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is configured

## Database Backup & Restore

### Backup (Supabase)

1. Dashboard → Database → Backups (Pro plan) or
2. `pg_dump` via connection string:
   ```bash
   pg_dump $DATABASE_URL > rodstack-backup-$(date +%Y%m%d).sql
   ```

### Restore

```bash
psql $DATABASE_URL < rodstack-backup-YYYYMMDD.sql
```

**Warning:** Restore affects all tenants. Test on staging first.

## Monitoring & Alerts

Recommended alerts:

| Alert | Threshold | Action |
|-------|-----------|--------|
| Deployment failures | 5 consecutive | Check Vercel token, GitHub access |
| Webhook failures | 5 in 10 min | Verify Stripe secret |
| API error rate | >0.1% | Review function logs |
| Portal downtime | <99% uptime | Check Vercel status |

## Getting Help

1. Check `client_activity_log` for the affected client
2. Review Vercel function logs
3. Run `npm test` to verify isolation logic
4. Contact support with client slug, timestamp, and error message
