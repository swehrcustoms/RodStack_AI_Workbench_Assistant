import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-get-subscription", {}, async ({ body, userId, service }) => {
    const organizationId = String(body.organizationId || body.organization_id || "");
    if (!organizationId) return jsonResponse({ error: "organizationId required" }, 400);

    const { data: subscription, error } = await service
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw error;

    const { data: overrides } = await service
      .from("subscription_overrides")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    const { data: entitlements } = await service
      .from("feature_entitlements")
      .select("*")
      .eq("organization_id", organizationId);

    const { data: preview } = await service
      .from("plan_preview_sessions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .maybeSingle();

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.get_subscription",
      resource_type: "subscription",
      resource_id: subscription?.id ?? null,
      organization_id: organizationId,
    });

    return jsonResponse({
      subscription,
      overrides: overrides || [],
      entitlements: entitlements || [],
      activePreview: preview,
    });
  })
);
