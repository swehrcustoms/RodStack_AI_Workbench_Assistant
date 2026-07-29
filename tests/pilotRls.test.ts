import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260729210000_pilot_org_workspace_rls.sql"),
  "utf8"
);

describe("pilot org workspace RLS migration", () => {
  it("defines org-aware workspace policies", () => {
    expect(migration).toContain("workspace_select_tenant");
    expect(migration).toContain("is_org_member(organization_id)");
    expect(migration).toContain("add_user_to_organization");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("from authenticated");
  });
});
