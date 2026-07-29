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
];

describe("edge function stubs", () => {
  it("includes required admin functions", () => {
    const base = resolve(__dirname, "../supabase/functions");
    const dirs = readdirSync(base);
    for (const name of requiredFns) {
      expect(dirs).toContain(name);
      const src = readFileSync(resolve(base, name, "index.ts"), "utf8");
      expect(src).toContain("Deno.serve");
      expect(src).toContain("writeAudit");
    }
  });
});
