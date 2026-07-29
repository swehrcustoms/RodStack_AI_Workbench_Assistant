import { describe, expect, it } from "vitest";
import {
  assertTenantIsolation,
  canAccessAdminConsole,
  canMutatePlatform,
  canPreviewPlans,
  featuresForTier,
  hasMinOrgRole,
  resolveEffectiveTier,
} from "../src/lib/auth/roles";
import { authorizeAdminAction, buildAuditEvent, computeEntitlementKeys } from "../src/lib/auth/authorize";

describe("org roles", () => {
  it("ranks owner above builder", () => {
    expect(hasMinOrgRole("owner", "admin")).toBe(true);
    expect(hasMinOrgRole("builder", "admin")).toBe(false);
    expect(hasMinOrgRole("viewer", "viewer")).toBe(true);
  });
});

describe("platform roles", () => {
  it("allows all platform roles into admin console", () => {
    expect(canAccessAdminConsole("platform_owner")).toBe(true);
    expect(canAccessAdminConsole("support_admin")).toBe(true);
    expect(canAccessAdminConsole("read_only_support")).toBe(true);
    expect(canAccessAdminConsole(null)).toBe(false);
  });

  it("blocks read_only_support from mutations", () => {
    expect(canMutatePlatform("read_only_support")).toBe(false);
    expect(canPreviewPlans("read_only_support")).toBe(false);
    expect(canMutatePlatform("support_admin")).toBe(true);
  });
});

describe("tenant isolation", () => {
  it("allows same-org access and denies cross-tenant without platform role", () => {
    expect(assertTenantIsolation("org-a", "org-a")).toBe(true);
    expect(assertTenantIsolation("org-a", "org-b")).toBe(false);
    expect(assertTenantIsolation("org-a", "org-b", "platform_owner")).toBe(true);
  });
});

describe("preview mode entitlements", () => {
  it("prefers preview over override over subscription", () => {
    expect(
      resolveEffectiveTier({
        subscriptionTier: "free",
        overrideTier: "pro",
        previewTier: "enterprise",
      })
    ).toBe("enterprise");

    const computed = computeEntitlementKeys({
      subscriptionTier: "free",
      previewTier: "pro",
    });
    expect(computed.source).toBe("preview");
    expect(computed.features).toEqual(featuresForTier("pro"));
  });
});

describe("authorization + audit", () => {
  it("denies write actions for read_only_support", () => {
    expect(authorizeAdminAction("read_only_support", "admin.search_users").ok).toBe(true);
    expect(authorizeAdminAction("read_only_support", "admin.refresh_entitlements").ok).toBe(false);
    expect(authorizeAdminAction("support_admin", "admin.start_plan_preview").ok).toBe(true);
  });

  it("builds audit payloads", () => {
    expect(
      buildAuditEvent({
        actorId: "u1",
        action: "admin.get_user",
        resourceType: "profile",
        resourceId: "u2",
      })
    ).toMatchObject({
      actor_id: "u1",
      action: "admin.get_user",
      resource_type: "profile",
      resource_id: "u2",
    });
  });
});
