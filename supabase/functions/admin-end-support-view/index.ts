import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-end-support-view", { write: true }, async ({ body, userId, service }) => {
    const sessionId = body.sessionId || body.session_id;

    let query = service
      .from("support_view_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("admin_user_id", userId)
      .eq("active", true);
    if (sessionId) query = query.eq("id", String(sessionId));

    const { data: sessions, error } = await query.select("*");
    if (error) throw error;

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.end_support_view",
      resource_type: "support_view_session",
      resource_id: sessionId ? String(sessionId) : null,
      metadata: { ended: sessions?.length ?? 0 },
    });

    return jsonResponse({ ok: true, ended: sessions || [] });
  })
);
