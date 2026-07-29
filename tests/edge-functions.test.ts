import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const requiredFns = [
  "admin-get-user",
  "admin-search-users",
  "admin-get-subscription",
  "admin-refresh-entitlements",
  "admin-start-plan-preview",
  "admin-end-plan-preview",
  "admin-start-support-view",
  "admin-end-support-view",
  "admin-manual-override",
  "ask-claude",
  "stripe-webhook",
];

describe("edge function stubs", () => {
  it("includes required admin, AI, and Stripe functions", () => {
    const base = resolve(__dirname, "../supabase/functions");
    const dirs = readdirSync(base);
    for (const name of requiredFns) {
      expect(dirs).toContain(name);
      const src = readFileSync(resolve(base, name, "index.ts"), "utf8");
      expect(src).toContain("Deno.serve");
    }
  });

  it("keeps Anthropic key server-side in ask-claude", () => {
    const src = readFileSync(
      resolve(__dirname, "../supabase/functions/ask-claude/index.ts"),
      "utf8"
    );
    expect(src).toContain("ANTHROPIC_API_KEY");
    expect(src).not.toContain("VITE_ANTHROPIC");
    expect(src).toContain("requirePlatformAdmin");
  });

  it("verifies Stripe signatures in webhook", () => {
    const src = readFileSync(
      resolve(__dirname, "../supabase/functions/stripe-webhook/index.ts"),
      "utf8"
    );
    expect(src).toContain("stripe-signature");
    expect(src).toContain("verifyStripeSignature");
    expect(src).toContain("stripe_events");
  });
});
