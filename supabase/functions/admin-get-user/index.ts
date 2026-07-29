import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-get-user", {}, async ({ body, userId, service }) => {
    const targetId = String(body.userId || body.user_id || "");
    const email = String(body.email || "").trim().toLowerCase();
    if (!targetId && !email) return jsonResponse({ error: "userId or email required" }, 400);

    let query = service.from("profiles").select("*");
    query = targetId ? query.eq("id", targetId) : query.ilike("email", email);
    const { data: profile, error } = await query.maybeSingle();
    if (error) throw error;
    if (!profile) return jsonResponse({ error: "User not found" }, 404);

    const { data: memberships } = await service
      .from("organization_members")
      .select("role, organization_id, organizations(id, name, slug)")
      .eq("user_id", profile.id);

    const orgIds = (memberships || []).map((m: { organization_id: string }) => m.organization_id);
    const { data: subscriptions } = orgIds.length
      ? await service.from("subscriptions").select("*").in("organization_id", orgIds)
      : { data: [] };

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.get_user",
      resource_type: "profile",
      resource_id: profile.id,
      metadata: { email: profile.email },
    });

    return jsonResponse({ profile, memberships: memberships || [], subscriptions: subscriptions || [] });
  })
);
