import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-refresh-entitlements", { write: true }, async ({ body, userId, service }) => {
    const organizationId = String(body.organizationId || body.organization_id || "");
    if (!organizationId) return jsonResponse({ error: "organizationId required" }, 400);

    const { error } = await service.rpc("refresh_org_entitlements", {
      org_id: organizationId,
      src: "subscription",
    });
    if (error) throw error;

    const { data: entitlements } = await service
      .from("feature_entitlements")
      .select("*")
      .eq("organization_id", organizationId);

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.refresh_entitlements",
      resource_type: "organization",
      resource_id: organizationId,
      organization_id: organizationId,
      metadata: { count: entitlements?.length ?? 0 },
    });

    return jsonResponse({ ok: true, entitlements: entitlements || [] });
  })
);
