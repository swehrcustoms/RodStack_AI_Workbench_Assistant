import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

/** Manual subscription tier override for troubleshooting. */
Deno.serve(
  adminHandler("admin-manual-override", { write: true }, async ({ body, userId, service }) => {
    const organizationId = String(body.organizationId || body.organization_id || "");
    const tier = String(body.tier || "");
    const reason = String(body.reason || "").trim();
    const endsAt = body.endsAt || body.ends_at || null;

    if (!organizationId) return jsonResponse({ error: "organizationId required" }, 400);
    if (!["free", "pro", "enterprise"].includes(tier)) {
      return jsonResponse({ error: "Invalid tier" }, 400);
    }
    if (!reason) return jsonResponse({ error: "reason required" }, 400);

    await service
      .from("subscription_overrides")
      .update({ active: false })
      .eq("organization_id", organizationId)
      .eq("active", true);

    const { data: override, error } = await service
      .from("subscription_overrides")
      .insert({
        organization_id: organizationId,
        tier,
        reason,
        ends_at: endsAt,
        created_by: userId,
        active: true,
      })
      .select("*")
      .single();
    if (error) throw error;

    await service.rpc("refresh_org_entitlements", { org_id: organizationId, src: "override" });

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.manual_override",
      resource_type: "subscription_override",
      resource_id: override.id,
      organization_id: organizationId,
      metadata: { tier, reason },
    });

    return jsonResponse({ ok: true, override });
  })
);
