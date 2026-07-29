import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-end-plan-preview", { write: true }, async ({ body, userId, service }) => {
    const organizationId = String(body.organizationId || body.organization_id || "");
    const sessionId = body.sessionId || body.session_id;
    if (!organizationId && !sessionId) {
      return jsonResponse({ error: "organizationId or sessionId required" }, 400);
    }

    let query = service
      .from("plan_preview_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("active", true);
    query = sessionId ? query.eq("id", String(sessionId)) : query.eq("organization_id", organizationId);
    const { data: sessions, error } = await query.select("*");
    if (error) throw error;

    const orgId = organizationId || sessions?.[0]?.organization_id;
    if (orgId) {
      await service.rpc("refresh_org_entitlements", { org_id: orgId, src: "subscription" });
    }

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.end_plan_preview",
      resource_type: "organization",
      resource_id: orgId ?? null,
      organization_id: orgId ?? null,
      metadata: { ended: sessions?.length ?? 0 },
    });

    return jsonResponse({ ok: true, ended: sessions || [] });
  })
);
