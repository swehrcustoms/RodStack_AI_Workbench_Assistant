import type { PlatformRole, SubscriptionTier } from "./roles";
import {
  canAccessAdminConsole,
  canManageOverrides,
  canMutatePlatform,
  canPreviewPlans,
  canStartSupportView,
  featuresForTier,
  resolveEffectiveTier,
} from "./roles";

export type AuditAction =
  | "admin.get_user"
  | "admin.search_users"
  | "admin.get_subscription"
  | "admin.refresh_entitlements"
  | "admin.start_plan_preview"
  | "admin.end_plan_preview"
  | "admin.start_support_view"
  | "admin.end_support_view"
  | "admin.manual_override"
  | "admin.ask_claude"
  | "admin.promote_platform_owner"
  | "stripe.webhook"
  | "auth.sign_up"

  | "auth.sign_in"
  | "auth.password_reset"
  | "profile.update";

export interface AuditEventInput {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}

export function buildAuditEvent(input: AuditEventInput) {
  return {
    actor_id: input.actorId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    organization_id: input.organizationId ?? null,
    metadata: input.metadata ?? {},
  };
}

export function authorizeAdminAction(
  role: PlatformRole | null | undefined,
  action: AuditAction
): { ok: boolean; reason?: string } {
  if (!canAccessAdminConsole(role ?? null)) {
    return { ok: false, reason: "Not a platform admin" };
  }

  const writeActions: AuditAction[] = [
    "admin.refresh_entitlements",
    "admin.start_plan_preview",
    "admin.end_plan_preview",
    "admin.start_support_view",
    "admin.end_support_view",
    "admin.manual_override",
    "admin.ask_claude",
    "admin.promote_platform_owner",
  ];

  if (writeActions.includes(action) && !canMutatePlatform(role ?? null)) {
    return { ok: false, reason: "Read-only support cannot mutate" };
  }

  if (
    (action === "admin.start_plan_preview" || action === "admin.end_plan_preview") &&
    !canPreviewPlans(role ?? null)
  ) {
    return { ok: false, reason: "Cannot preview plans" };
  }

  if (
    (action === "admin.start_support_view" || action === "admin.end_support_view") &&
    !canStartSupportView(role ?? null)
  ) {
    return { ok: false, reason: "Cannot start support view" };
  }

  if (action === "admin.manual_override" && !canManageOverrides(role ?? null)) {
    return { ok: false, reason: "Cannot manage overrides" };
  }

  return { ok: true };
}

export function computeEntitlementKeys(input: {
  subscriptionTier?: SubscriptionTier | null;
  overrideTier?: SubscriptionTier | null;
  previewTier?: SubscriptionTier | null;
}): { tier: SubscriptionTier; features: string[]; source: string } {
  const tier = resolveEffectiveTier(input);
  let source = "subscription";
  if (input.previewTier) source = "preview";
  else if (input.overrideTier) source = "override";
  return { tier, features: featuresForTier(tier), source };
}
