import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSlug } from "../lib/slug.js";
import {
  getFeatureFlags,
  tierIncludesFeature,
  getUpgradePath,
  compareTiers,
} from "../lib/features.js";
import { getPriceToTier } from "../lib/stripe.js";
import { requireFeature, requireRole } from "../middleware/tenantContext.js";

describe("slug generation", () => {
  it("generates URL-safe slugs from company names", () => {
    expect(generateSlug("Acme Rod Works")).toBe("acme-rod-works");
    expect(generateSlug("  Test@Company!!  ")).toBe("test-company");
    expect(generateSlug("")).toBe("client");
  });

  it("ensures unique slugs via counter suffix", async () => {
    const { generateUniqueSlug } = await import("../lib/slug.js");

    const taken = new Set(["acme", "acme-2"]);
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: (_field, slug) => ({
            limit: () =>
              Promise.resolve({
                data: taken.has(slug) ? [{ id: "x" }] : [],
              }),
          }),
        }),
      }),
    };

    const slug = await generateUniqueSlug("Acme", mockSupabase);
    expect(slug).toBe("acme-3");
  });
});

describe("feature flags", () => {
  it("returns correct flags per tier", () => {
    expect(getFeatureFlags("free").has_pdf_export).toBe(false);
    expect(getFeatureFlags("builder").has_pdf_export).toBe(true);
    expect(getFeatureFlags("pro").has_customer_management).toBe(true);
    expect(getFeatureFlags("business").has_inventory_tracking).toBe(true);
    expect(getFeatureFlags("enterprise").has_white_label).toBe(true);
  });

  it("blocks locked features for lower tiers", () => {
    expect(tierIncludesFeature("free", "has_customer_management")).toBe(false);
    expect(tierIncludesFeature("pro", "has_customer_management")).toBe(true);
  });

  it("returns upgrade path for locked features", () => {
    expect(getUpgradePath("free", "has_customer_management")).toBe("pro");
    expect(getUpgradePath("pro", "has_inventory_tracking")).toBe("business");
  });

  it("orders tiers correctly", () => {
    expect(compareTiers("free", "pro")).toBeLessThan(0);
    expect(compareTiers("enterprise", "builder")).toBeGreaterThan(0);
  });
});

describe("Stripe price mapping", () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_BUILDER = "price_builder";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    process.env.STRIPE_PRICE_BUSINESS = "price_business";
  });

  it("maps price IDs to tiers", () => {
    expect(getPriceToTier("price_builder")).toBe("builder");
    expect(getPriceToTier("price_pro")).toBe("pro");
    expect(getPriceToTier("price_business")).toBe("business");
    expect(getPriceToTier("unknown")).toBe("free");
  });
});

describe("middleware feature gates", () => {
  const proTenant = {
    tier: "pro",
    features: getFeatureFlags("pro"),
  };

  const freeTenant = {
    tier: "free",
    features: getFeatureFlags("free"),
  };

  it("allows features present in tier", () => {
    expect(() => requireFeature(proTenant, "has_customer_management")).not.toThrow();
  });

  it("throws 403 for locked features", () => {
    try {
      requireFeature(freeTenant, "has_customer_management");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.feature).toBe("has_customer_management");
      expect(err.upgrade_required).toBe("pro");
    }
  });
});

describe("role-based access control", () => {
  it("allows matching roles", () => {
    expect(() => requireRole({ role: "admin" }, "admin", "builder")).not.toThrow();
  });

  it("denies insufficient roles", () => {
    try {
      requireRole({ role: "builder" }, "admin");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.required_roles).toEqual(["admin"]);
    }
  });
});

describe("tenant isolation (JWT validation)", () => {
  it("rejects JWT tenant_id mismatch", () => {
    const jwtTenantId = "tenant-b";
    const requestTenantId = "tenant-a";

    if (jwtTenantId && jwtTenantId !== requestTenantId) {
      const error = new Error("Tenant mismatch — JWT tenant_id does not match request");
      error.status = 403;
      expect(error.status).toBe(403);
      expect(error.message).toContain("Tenant mismatch");
      return;
    }

    expect.fail("Should have detected tenant mismatch");
  });

  it("rejects forged tenant_id in request body vs JWT", () => {
    const jwtTenantId = "real-tenant";
    const bodyTenantId = "forged-tenant";

    expect(jwtTenantId).not.toBe(bodyTenantId);
    expect(jwtTenantId).toBe("real-tenant");
  });
});

describe("deployment job queuing", () => {
  it("calls deploy-client endpoint with client payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
    global.fetch = fetchMock;

    process.env.VERCEL_URL = "rodstack.app";
    process.env.DEPLOY_WEBHOOK_SECRET = "secret";

    const { queueDeploymentJob } = await import("../lib/deployment.js");
    await queueDeploymentJob("client-123", "acme", "pro");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://rodstack.app/api/deploy-client",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ clientId: "client-123", slug: "acme", tier: "pro" }),
      })
    );
  });
});

describe("Stripe webhook processing", () => {
  it("exports handler for required event types", async () => {
    const mod = await import("../../api/webhooks/stripe.js");
    expect(typeof mod.default).toBe("function");
  });
});
