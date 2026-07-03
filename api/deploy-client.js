import { deployClientPortal } from "../../src/lib/deployment.js";
import { parseBody } from "../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const deploySecret = process.env.DEPLOY_WEBHOOK_SECRET;
  if (deploySecret) {
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (auth !== deploySecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const body = await parseBody(req);
    const { clientId, slug, tier } = body;

    if (!clientId || !slug || !tier) {
      return res.status(400).json({ error: "clientId, slug, and tier are required" });
    }

    const url = await deployClientPortal(clientId, slug, tier);
    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.error("[deploy-client] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
