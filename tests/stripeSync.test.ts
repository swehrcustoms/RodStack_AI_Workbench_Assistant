import { describe, expect, it } from "vitest";
import {
  extractOrganizationId,
  mapPriceToTier,
  mapStripeStatus,
  unixToIso,
} from "../src/lib/stripeSync";

describe("stripe sync mapping", () => {
  it("maps Stripe statuses", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("unpaid")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
  });

  it("maps price metadata and env price IDs to tiers", () => {
    expect(mapPriceToTier("price_1", { tier: "enterprise" })).toBe("enterprise");
    expect(mapPriceToTier("price_pro", {}, { pro: "price_pro" })).toBe("pro");
    expect(mapPriceToTier(null, {})).toBe("free");
  });

  it("extracts organization ids from metadata", () => {
    expect(extractOrganizationId({ organization_id: "org-1" })).toBe("org-1");
    expect(extractOrganizationId({ organizationId: "org-2" })).toBe("org-2");
    expect(extractOrganizationId({})).toBeNull();
  });

  it("converts unix timestamps", () => {
    expect(unixToIso(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(unixToIso(null)).toBeNull();
  });
});

describe("stripe webhook idempotency contract", () => {
  it("treats event id as unique ledger key", () => {
    const events = new Set<string>();
    const process = (id: string) => {
      if (events.has(id)) return { duplicate: true };
      events.add(id);
      return { duplicate: false };
    };
    expect(process("evt_1").duplicate).toBe(false);
    expect(process("evt_1").duplicate).toBe(true);
  });
});
