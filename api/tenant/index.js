import {
  extractTenantContext,
  authenticateUser,
  handleMiddlewareError,
} from "../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tenant = await extractTenantContext(req);
    const user = await authenticateUser(req, tenant);

    return res.status(200).json({
      id: tenant.id,
      slug: tenant.slug,
      tier: tenant.tier,
      companyName: tenant.companyName,
      companyEmail: tenant.companyEmail,
      logoUrl: tenant.logoUrl,
      brandColorPrimary: tenant.brandColorPrimary,
      brandColorAccent: tenant.brandColorAccent,
      features: tenant.features,
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    return handleMiddlewareError(res, error);
  }
}
