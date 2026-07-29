import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-start-support-view", { write: true }, async ({ body, userId, service }) => {
    const targetUserId = String(body.targetUserId || body.target_user_id || "");
    const organizationId = body.organizationId || body.organization_id || null;
    if (!targetUserId) return jsonResponse({ error: "targetUserId required" }, 400);

    await service
      .from("support_view_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("admin_user_id", userId)
      .eq("active", true);

    const { data: session, error } = await service
      .from("support_view_sessions")
      .insert({
        admin_user_id: userId,
        target_user_id: targetUserId,
        organization_id: organizationId,
        active: true,
      })
      .select("*")
      .single();
    if (error) throw error;

    const { data: profile } = await service.from("profiles").select("*").eq("id", targetUserId).maybeSingle();
    const { data: workspace } = await service
      .from("rodstack_workspaces")
      .select("payload, organization_id, updated_at")
      .eq("user_id", targetUserId)
      .maybeSingle();

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.start_support_view",
      resource_type: "profile",
      resource_id: targetUserId,
      organization_id: organizationId,
      metadata: { sessionId: session.id },
    });

    return jsonResponse({
      ok: true,
      session,
      supportView: {
        profile,
        workspace,
        readOnly: true,
      },
    });
  })
);
