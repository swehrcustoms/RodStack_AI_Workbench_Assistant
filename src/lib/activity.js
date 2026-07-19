import { getSupabaseAdmin } from "./supabaseAdmin.js";

/**
 * Record an action in the client activity audit log.
 */
export async function logActivity(clientId, action, actorEmail, changes = {}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    action,
    actor_email: actorEmail,
    changes,
  });
  if (error) {
    console.error("[activity] Failed to log:", error.message);
  }
}
