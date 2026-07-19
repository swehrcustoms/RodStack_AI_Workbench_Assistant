import { getSupabaseAdmin } from "../../../src/lib/supabaseAdmin.js";
import { requireAdmin, handleMiddlewareError } from "../../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const activityIndex = pathParts.indexOf("activity");
  const clientId = activityIndex > 0 ? pathParts[activityIndex - 1] : null;

  if (!clientId) {
    return res.status(400).json({ error: "Client ID required" });
  }

  try {
    await requireAdmin(req);
    const supabase = getSupabaseAdmin();

    const limit = Number(url.searchParams.get("limit") || 100);

    const { data, error } = await supabase
      .from("client_activity_log")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return res.status(200).json({ activity: data || [] });
  } catch (error) {
    return handleMiddlewareError(res, error);
  }
}
