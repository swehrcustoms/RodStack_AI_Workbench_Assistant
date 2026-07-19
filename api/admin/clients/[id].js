import { getSupabaseAdmin } from "../../../src/lib/supabaseAdmin.js";
import { logActivity } from "../../../src/lib/activity.js";
import { requireAdmin, parseBody, handleMiddlewareError } from "../../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const clientId = pathParts[pathParts.length - 1];

  if (!clientId || clientId === "clients") {
    return res.status(400).json({ error: "Client ID required" });
  }

  try {
    const admin = await requireAdmin(req);
    const supabase = getSupabaseAdmin();

    if (req.method === "GET") {
      const { data: client, error } = await supabase.from("clients").select("*").eq("id", clientId).single();
      if (error || !client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const { data: team } = await supabase
        .from("client_team_members")
        .select("*")
        .eq("client_id", clientId);

      const { data: activity } = await supabase
        .from("client_activity_log")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: apiUsageCount } = await supabase
        .from("api_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("created_at", startOfMonth.toISOString());

      return res.status(200).json({
        client,
        teamMembers: team || [],
        activityLog: activity || [],
        apiUsageThisMonth: apiUsageCount || 0,
      });
    }

    if (req.method === "PUT") {
      const body = await parseBody(req);
      const allowed = [
        "company_name",
        "company_email",
        "owner_name",
        "owner_email",
        "subscription_tier",
        "subscription_status",
        "logo_url",
        "brand_color_primary",
        "brand_color_accent",
        "custom_domain",
        "admin_notes",
      ];

      const updates = {};
      for (const key of allowed) {
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (body[camel] !== undefined) updates[key] = body[camel];
        if (body[key] !== undefined) updates[key] = body[key];
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const { data: client, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", clientId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await logActivity(clientId, "client_updated", admin.email, updates);

      return res.status(200).json({ client });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return handleMiddlewareError(res, error);
  }
}
