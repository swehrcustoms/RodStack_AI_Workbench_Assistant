/** Shared Stripe → RodStack subscription mapping (used by tests + docs; Edge copies logic). */

export type SubscriptionTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export function mapStripeStatus(status: string | null | undefined): SubscriptionStatus {
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

export function mapPriceToTier(
  priceId: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  priceMap: { pro?: string; enterprise?: string } = {}
): SubscriptionTier {
  const metaTier = String(metadata?.tier || metadata?.plan || "").toLowerCase();
  if (metaTier === "free" || metaTier === "pro" || metaTier === "enterprise") {
    return metaTier;
  }
  if (priceId && priceMap.enterprise && priceId === priceMap.enterprise) return "enterprise";
  if (priceId && priceMap.pro && priceId === priceMap.pro) return "pro";
  if (!priceId) return "free";
  return "pro";
}

export function unixToIso(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

export interface NormalizedSubscriptionUpdate {
  organizationId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEnd: string | null;
  metadata: Record<string, unknown>;
}

export function extractOrganizationId(metadata: Record<string, unknown> | null | undefined): string | null {
  const id = metadata?.organization_id || metadata?.organizationId || metadata?.org_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
