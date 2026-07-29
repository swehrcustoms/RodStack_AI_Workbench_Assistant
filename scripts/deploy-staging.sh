#!/usr/bin/env bash
# Staging/pilot deploy helper — does NOT run destructive production wipe commands.
# Requires: supabase CLI logged in and linked to the target project.
#
# Usage:
#   npm run deploy:staging
#   SKIP_DB_PUSH=1 npm run deploy:staging   # functions only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Checking Supabase CLI"
if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [[ "${SKIP_DB_PUSH:-0}" != "1" ]]; then
  echo "==> Pushing migrations (linked project)"
  supabase db push
else
  echo "==> Skipping db push (SKIP_DB_PUSH=1)"
fi

echo "==> Reminder: set secrets before first AI/Stripe use:"
echo "    supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=claude-sonnet-4-20250514"
echo "    supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=..."

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

FAILED=0
for fn in "${FUNCTIONS[@]}"; do
  echo "---- deploying $fn"
  if [[ "$fn" == "stripe-webhook" ]]; then
    if ! supabase functions deploy "$fn" --no-verify-jwt; then
      echo "WARN: failed to deploy $fn"
      FAILED=1
    fi
  else
    if ! supabase functions deploy "$fn"; then
      echo "WARN: failed to deploy $fn"
      FAILED=1
    fi
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  echo "==> One or more function deploys failed. Fix CLI auth/link and retry."
  exit 1
fi

echo "==> Done. Next for pilot:"
echo "  1. Sign up on the live app"
echo "  2. npm run admin:promote-owner -- --email you@example.com"
echo "  3. Open /admin/login"
echo "  4. Invite shop user; optionally:"
echo "     npm run admin:add-user-to-org -- --email builder@shop.com --org-id <uuid>"
