/**
 * Map Stripe price IDs to subscription tier names.
 */
export function getPriceToTier(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_FREE]: "free",
    [process.env.STRIPE_PRICE_BUILDER]: "builder",
    [process.env.STRIPE_PRICE_PRO]: "pro",
    [process.env.STRIPE_PRICE_BUSINESS]: "business",
    [process.env.STRIPE_PRICE_ENTERPRISE]: "enterprise",
  };
  return map[priceId] || "free";
}
