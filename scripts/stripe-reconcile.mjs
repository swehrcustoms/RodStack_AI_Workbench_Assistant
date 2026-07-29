#!/usr/bin/env node
/**
 * Reconcile a Stripe subscription into RodStack subscriptions table.
 *
 * Usage:
 *   npm run stripe:reconcile -- --subscription-id sub_xxx
 *   npm run stripe:reconcile -- --organization-id <uuid>
 */

import { createClient } from "@supabase/supabase-js";
import {
  extractOrganizationId,
  mapPriceToTier,
  mapStripeStatus,
  unixToIso,
} from "./lib/stripeSync.mjs";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function stripeGet(path) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe API ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const subscriptionId = arg("subscription-id");
  const organizationIdArg = arg("organization-id");

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let subId = subscriptionId;
  if (!subId && organizationIdArg) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("organization_id", organizationIdArg)
      .maybeSingle();
    if (error) throw error;
    subId = data?.stripe_subscription_id;
  }
  if (!subId) throw new Error("--subscription-id or org with stripe_subscription_id required");

  const sub = await stripeGet(`subscriptions/${subId}`);
  const price = sub.items?.data?.[0]?.price;
  const metadata = { ...(sub.metadata || {}), ...(price?.metadata || {}) };
  const organizationId = extractOrganizationId(metadata) || organizationIdArg;
  if (!organizationId) {
    throw new Error("organization_id missing from Stripe metadata and CLI args");
  }

  const priceMap = {
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };

  const row = {
    organization_id: organizationId,
    tier: mapPriceToTier(price?.id, metadata, priceMap),
    status: mapStripeStatus(sub.status),
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
    stripe_subscription_id: sub.id,
    stripe_price_id: price?.id || null,
    stripe_product_id: typeof price?.product === "string" ? price.product : null,
    current_period_start: unixToIso(sub.current_period_start),
    current_period_end: unixToIso(sub.current_period_end),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    canceled_at: unixToIso(sub.canceled_at),
    trial_end: unixToIso(sub.trial_end),
    metadata,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "organization_id" });
  if (upsertError) throw upsertError;

  const { error: refreshError } = await supabase.rpc("refresh_org_entitlements", {
    org_id: organizationId,
    src: "subscription",
  });
  if (refreshError) throw refreshError;

  console.log(JSON.stringify({ ok: true, organizationId, subscription: row }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
