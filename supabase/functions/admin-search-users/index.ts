import { adminHandler, jsonResponse, writeAudit } from "../_shared/handler.ts";

Deno.serve(
  adminHandler("admin-search-users", {}, async ({ body, userId, service }) => {
    const q = String(body.query || body.q || "").trim();
    const limit = Math.min(Number(body.limit) || 25, 100);
    if (!q) return jsonResponse({ error: "query required" }, 400);

    const { data, error } = await service
      .from("profiles")
      .select("id, email, full_name, builder_name, shop_name, email_verified_at, created_at")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%,builder_name.ilike.%${q}%,shop_name.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    await writeAudit(service, {
      actor_id: userId,
      action: "admin.search_users",
      resource_type: "profile",
      metadata: { query: q, count: data?.length ?? 0 },
    });

    return jsonResponse({ users: data || [] });
  })
);
