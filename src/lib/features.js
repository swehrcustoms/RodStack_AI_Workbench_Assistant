/** Minimum tier required to unlock each feature */
export const FEATURE_TIER_MAP = {
  has_pdf_export: "builder",
  has_component_calculator: "builder",
  has_customer_management: "pro",
  has_branded_quotes: "pro",
  has_pricing_dashboard: "pro",
  has_inventory_tracking: "business",
  has_analytics: "business",
  has_bundled_export: "business",
  has_role_based_permissions: "enterprise",
  has_multi_location: "enterprise",
  has_white_label: "enterprise",
};

export const TIER_ORDER = ["free", "builder", "pro", "business", "enterprise"];

/** Static fallback when DB is unavailable (matches feature_flags seed data). */
export const STATIC_FEATURE_FLAGS = {
  free: {
    max_ai_queries_per_month: 20,
    max_saved_builds: 3,
    has_pdf_export: false,
    has_component_calculator: false,
    has_customer_management: false,
    has_branded_quotes: false,
    has_pricing_dashboard: false,
    has_inventory_tracking: false,
    has_analytics: false,
    has_bundled_export: false,
    max_team_seats: 1,
    has_role_based_permissions: false,
    has_multi_location: false,
    has_white_label: false,
    support_level: "community",
  },
  builder: {
    max_ai_queries_per_month: null,
    max_saved_builds: null,
    has_pdf_export: true,
    has_component_calculator: true,
    has_customer_management: false,
    has_branded_quotes: false,
    has_pricing_dashboard: false,
    has_inventory_tracking: false,
    has_analytics: false,
    has_bundled_export: false,
    max_team_seats: 1,
    has_role_based_permissions: false,
    has_multi_location: false,
    has_white_label: false,
    support_level: "email",
  },
  pro: {
    max_ai_queries_per_month: null,
    max_saved_builds: null,
    has_pdf_export: true,
    has_component_calculator: true,
    has_customer_management: true,
    has_branded_quotes: true,
    has_pricing_dashboard: true,
    has_inventory_tracking: false,
    has_analytics: false,
    has_bundled_export: false,
    max_team_seats: 1,
    has_role_based_permissions: false,
    has_multi_location: false,
    has_white_label: false,
    support_level: "email",
  },
  business: {
    max_ai_queries_per_month: null,
    max_saved_builds: null,
    has_pdf_export: true,
    has_component_calculator: true,
    has_customer_management: true,
    has_branded_quotes: true,
    has_pricing_dashboard: true,
    has_inventory_tracking: true,
    has_analytics: true,
    has_bundled_export: true,
    max_team_seats: 3,
    has_role_based_permissions: false,
    has_multi_location: false,
    has_white_label: false,
    support_level: "priority",
  },
  enterprise: {
    max_ai_queries_per_month: null,
    max_saved_builds: null,
    has_pdf_export: true,
    has_component_calculator: true,
    has_customer_management: true,
    has_branded_quotes: true,
    has_pricing_dashboard: true,
    has_inventory_tracking: true,
    has_analytics: true,
    has_bundled_export: true,
    max_team_seats: null,
    has_role_based_permissions: true,
    has_multi_location: true,
    has_white_label: true,
    support_level: "dedicated",
  },
};

export function getFeatureFlags(tier) {
  return STATIC_FEATURE_FLAGS[tier] || STATIC_FEATURE_FLAGS.free;
}

export async function getFeatureFlagsFromDb(supabase, tier) {
  const { data, error } = await supabase.from("feature_flags").select("*").eq("tier", tier).single();
  if (error || !data) {
    return getFeatureFlags(tier);
  }
  const { tier: _tier, ...flags } = data;
  return flags;
}

export function getUpgradePath(currentTier, featureName) {
  return FEATURE_TIER_MAP[featureName] || "pro";
}

export function tierIncludesFeature(tier, featureName) {
  const flags = getFeatureFlags(tier);
  return Boolean(flags[featureName]);
}

export function compareTiers(a, b) {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}
