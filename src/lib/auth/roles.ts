/** Org and platform role helpers (client + tests). */

export const ORG_ROLES = ["owner", "admin", "builder", "viewer"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PLATFORM_ROLES = [
  "platform_owner",
  "support_admin",
  "read_only_support",
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const SUBSCRIPTION_TIERS = ["free", "pro", "enterprise"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

const ORG_RANK: Record<OrgRole, number> = {
  viewer: 1,
  builder: 2,
  admin: 3,
  owner: 4,
};

const PLATFORM_WRITE: PlatformRole[] = ["platform_owner", "support_admin"];
const PLATFORM_ADMIN_CONSOLE: PlatformRole[] = [
  "platform_owner",
  "support_admin",
  "read_only_support",
];

export function hasMinOrgRole(role: OrgRole | null | undefined, min: OrgRole): boolean {
  if (!role) return false;
  return ORG_RANK[role] >= ORG_RANK[min];
}

export function canAccessAdminConsole(role: PlatformRole | null | undefined): boolean {
  return !!role && PLATFORM_ADMIN_CONSOLE.includes(role);
}

export function canMutatePlatform(role: PlatformRole | null | undefined): boolean {
  return !!role && PLATFORM_WRITE.includes(role);
}

export function canManageOverrides(role: PlatformRole | null | undefined): boolean {
  return role === "platform_owner" || role === "support_admin";
}

export function canStartSupportView(role: PlatformRole | null | undefined): boolean {
  return role === "platform_owner" || role === "support_admin";
}

export function canPreviewPlans(role: PlatformRole | null | undefined): boolean {
  return role === "platform_owner" || role === "support_admin";
}

export function isReadOnlySupport(role: PlatformRole | null | undefined): boolean {
  return role === "read_only_support";
}

/** Effective tier: preview > active override > subscription. */
export function resolveEffectiveTier(input: {
  subscriptionTier?: SubscriptionTier | null;
  overrideTier?: SubscriptionTier | null;
  previewTier?: SubscriptionTier | null;
}): SubscriptionTier {
  if (input.previewTier) return input.previewTier;
  if (input.overrideTier) return input.overrideTier;
  return input.subscriptionTier || "free";
}

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ["bench", "vault", "forms"],
  pro: ["bench", "vault", "forms", "crm", "inventory", "analytics", "photos"],
  enterprise: [
    "bench",
    "vault",
    "forms",
    "crm",
    "inventory",
    "analytics",
    "photos",
    "api",
    "sso",
    "priority_support",
  ],
};

export function featuresForTier(tier: SubscriptionTier): string[] {
  return [...TIER_FEATURES[tier]];
}

export function assertTenantIsolation(
  actorOrgId: string | null | undefined,
  resourceOrgId: string | null | undefined,
  platformRole?: PlatformRole | null
): boolean {
  if (canAccessAdminConsole(platformRole ?? null)) return true;
  if (!actorOrgId || !resourceOrgId) return false;
  return actorOrgId === resourceOrgId;
}
