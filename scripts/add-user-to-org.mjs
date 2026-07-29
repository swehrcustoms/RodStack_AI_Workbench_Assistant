#!/usr/bin/env node
/**
 * Add an existing RodStack user to a shop organization (service role only).
 *
 * Usage:
 *   npm run admin:add-user-to-org -- --email builder@shop.com --org-id <uuid>
 *   npm run admin:add-user-to-org -- --email builder@shop.com --org-id <uuid> --role admin --no-copy-workspace
 */

import { createClient } from "@supabase/supabase-js";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const email = arg("email");
  const orgId = arg("org-id");
  const role = arg("role") || "builder";
  const copyWorkspace = !flag("no-copy-workspace");
  const dryRun = flag("dry-run");

  if (!email || !orgId) {
    console.error(
      "Usage: npm run admin:add-user-to-org -- --email user@shop.com --org-id <uuid> [--role builder] [--no-copy-workspace]"
    );
    process.exit(1);
  }

  if (!["owner", "admin", "builder", "viewer"].includes(role)) {
    console.error(`Invalid role: ${role}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, email, orgId, role, copyWorkspace }, null, 2));
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("add_user_to_organization", {
    target_email: email,
    target_org_id: orgId,
    member_role: role,
    copy_workspace: copyWorkspace,
  });

  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
