import { getSupabaseAdmin } from "../../../src/lib/supabaseAdmin.js";
import { sendPortalReadyEmail, getHandoffEmailTemplate } from "../../../src/lib/email.js";
import { logActivity } from "../../../src/lib/activity.js";
import { requireAdmin, parseBody, handleMiddlewareError } from "../../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const admin = await requireAdmin(req);
    const body = await parseBody(req);
    const { clientId, sendEmail = true } = body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const supabase = getSupabaseAdmin();
    const { data: client, error } = await supabase.from("clients").select("*").eq("id", clientId).single();

    if (error || !client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const emailTemplate = getHandoffEmailTemplate(client);
    let emailResult = { skipped: true };

    if (sendEmail) {
      emailResult = await sendPortalReadyEmail(client);
    }

    await logActivity(clientId, "portal_handoff", admin.email, { sendEmail });

    return res.status(200).json({
      success: true,
      emailTemplate,
      emailResult,
      portalUrl: client.deployment_url || `https://${client.client_slug}.rodstack.app`,
    });
  } catch (error) {
    return handleMiddlewareError(res, error);
  }
}
