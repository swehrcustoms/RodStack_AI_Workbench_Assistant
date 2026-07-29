import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260729140000_stripe_sync_and_promote_owner.sql"),
  "utf8"
);

describe("promote_platform_owner SQL", () => {
  it("defines service_role-only promotion RPC", () => {
    expect(migration).toContain("promote_platform_owner");
    expect(migration).toContain("grant execute on function public.promote_platform_owner");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("revoke all on function public.promote_platform_owner");
    expect(migration).toContain("from authenticated");
  });

  it("adds stripe columns and event ledger", () => {
    expect(migration).toContain("stripe_subscription_id");
    expect(migration).toContain("create table if not exists public.stripe_events");
    expect(migration).toContain("enable row level security");
  });
});
