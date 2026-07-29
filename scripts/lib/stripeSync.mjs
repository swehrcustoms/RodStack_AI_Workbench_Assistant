/** Plain JS twin of src/lib/stripeSync.ts for Node scripts. */

export function mapStripeStatus(status) {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    case "paused":
      return "incomplete";
    default:
      return "incomplete";
  }
}

export function mapPriceToTier(priceId, metadata, priceMap = {}) {
  const metaTier = String(metadata?.tier || metadata?.plan || "").toLowerCase();
  if (metaTier === "free" || metaTier === "pro" || metaTier === "enterprise") {
    return metaTier;
  }
  if (priceId && priceMap.enterprise && priceId === priceMap.enterprise) return "enterprise";
  if (priceId && priceMap.pro && priceId === priceMap.pro) return "pro";
  if (!priceId) return "free";
  return "pro";
}

export function unixToIso(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

export function extractOrganizationId(metadata) {
  const id = metadata?.organization_id || metadata?.organizationId || metadata?.org_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
