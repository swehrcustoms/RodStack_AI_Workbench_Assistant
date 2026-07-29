import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260729120000_auth_orgs_subscriptions.sql"),
  "utf8"
);

describe("RLS migration smoke", () => {
  const tables = [
    "profiles",
    "organizations",
    "organization_members",
    "platform_admins",
    "subscriptions",
    "subscription_overrides",
    "feature_entitlements",
    "audit_logs",
    "plan_preview_sessions",
    "support_view_sessions",
  ];

  it("defines required tables", () => {
    for (const table of tables) {
      expect(migration).toContain(`create table if not exists public.${table}`);
    }
  });

  it("enables RLS on tenant tables", () => {
    for (const table of tables) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("includes org roles and platform roles", () => {
    expect(migration).toContain("'owner', 'admin', 'builder', 'viewer'");
    expect(migration).toContain("'platform_owner', 'support_admin', 'read_only_support'");
  });

  it("includes refresh_org_entitlements and audit_logs", () => {
    expect(migration).toContain("refresh_org_entitlements");
    expect(migration).toContain("create table if not exists public.audit_logs");
  });
});
