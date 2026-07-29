import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-start-plan-preview", { write: true }, async ({ body, userId, service }) => {
    const organizationId = String(body.organizationId || body.organization_id || "");
    const previewTier = String(body.tier || body.previewTier || "pro");
    if (!organizationId) return jsonResponse({ error: "organizationId required" }, 400);
    if (!["free", "pro", "enterprise"].includes(previewTier)) {
      return jsonResponse({ error: "Invalid tier" }, 400);
    }

    await service
      .from("plan_preview_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("active", true);

    const { data: session, error } = await service
      .from("plan_preview_sessions")
      .insert({
        admin_user_id: userId,
        organization_id: organizationId,
        preview_tier: previewTier,
        active: true,
      })
      .select("*")
      .single();
    if (error) throw error;

    await service.rpc("refresh_org_entitlements", { org_id: organizationId, src: "preview" });

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.start_plan_preview",
      resource_type: "organization",
      resource_id: organizationId,
      organization_id: organizationId,
      metadata: { tier: previewTier, sessionId: session.id },
    });

    return jsonResponse({ ok: true, session });
  })
);
