#!/usr/bin/env bash
# Staging deploy helper — does NOT run destructive production commands.
# Requires: supabase CLI logged in and linked to a staging project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Checking Supabase CLI"
if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "==> Pushing migrations (staging/linked project)"
supabase db push

echo "==> Setting secrets (skip empty)"
# Usage example before this script:
#   supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=claude-sonnet-4-20250514
#   supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_PRICE_PRO=... STRIPE_PRICE_ENTERPRISE=...

echo "==> Deploying Edge Functions"
FUNCTIONS=(
  admin-get-user
  admin-search-users
  admin-get-subscription
  admin-refresh-entitlements
  admin-start-plan-preview
  admin-end-plan-preview
  admin-start-support-view
  admin-end-support-view
  admin-manual-override
  ask-claude
  stripe-webhook
)

for fn in "${FUNCTIONS[@]}"; do
  if [[ "$fn" == "stripe-webhook" ]]; then
    supabase functions deploy "$fn" --no-verify-jwt
  else
    supabase functions deploy "$fn"
  fi
done

echo "==> Done. Next:"
echo "  1. Sign up a user in the staging app"
echo "  2. npm run admin:promote-owner -- --email you@example.com"
echo "  3. Open /admin/login"
echo "  4. Point Stripe webhook to:"
echo "     https://<project-ref>.supabase.co/functions/v1/stripe-webhook"
