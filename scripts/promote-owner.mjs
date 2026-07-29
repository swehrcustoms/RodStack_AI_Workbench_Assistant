#!/usr/bin/env node
/**
 * Promote a user to platform_owner (or another platform role).
 * Uses SUPABASE_SERVICE_ROLE_KEY only — never call from the browser.
 *
 * Usage:
 *   npm run admin:promote-owner -- --email owner@example.com
 *   npm run admin:promote-owner -- --user-id <uuid> --role support_admin
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
  const userId = arg("user-id");
  const role = arg("role") || "platform_owner";
  const dryRun = flag("dry-run");

  if (!email && !userId) {
    console.error("Usage: npm run admin:promote-owner -- --email user@example.com [--role platform_owner]");
    process.exit(1);
  }

  if (!["platform_owner", "support_admin", "read_only_support"].includes(role)) {
    console.error(`Invalid role: ${role}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, email, userId, role }, null, 2));
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in the environment."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("promote_platform_owner", {
    target_email: email,
    target_user_id: userId,
    desired_role: role,
  });

  if (error) {
    console.error("Promotion failed:", error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
