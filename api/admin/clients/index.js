import { getSupabaseAdmin } from "../../src/lib/supabaseAdmin.js";
import { generateUniqueSlug } from "../../src/lib/slug.js";
import { queueDeploymentJob } from "../../src/lib/deployment.js";
import { logActivity } from "../../src/lib/activity.js";
import { requireAdmin, parseBody, handleMiddlewareError } from "../../src/middleware/tenantContext.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const admin = await requireAdmin(req);
    const supabase = getSupabaseAdmin();

    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const search = url.searchParams.get("search") || "";
      const tier = url.searchParams.get("tier") || "";
      const status = url.searchParams.get("status") || "";
      const sort = url.searchParams.get("sort") || "created_at";
      const order = url.searchParams.get("order") === "asc";

      let query = supabase.from("clients").select("*");

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,client_slug.ilike.%${search}%,company_email.ilike.%${search}%`
        );
      }
      if (tier) query = query.eq("subscription_tier", tier);
      if (status) query = query.eq("subscription_status", status);

      query = query.order(sort, { ascending: order });

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return res.status(200).json({ clients: data || [] });
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const {
        companyName,
        companyEmail,
        ownerName,
        ownerEmail,
        tier = "pro",
        logoUrl,
        brandColorPrimary,
        brandColorAccent,
        adminNotes,
      } = body;

      if (!companyName || !companyEmail) {
        return res.status(400).json({ error: "companyName and companyEmail are required" });
      }

      const slug = await generateUniqueSlug(companyName, supabase);

      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          client_slug: slug,
          company_name: companyName,
          company_email: companyEmail,
          owner_name: ownerName || companyName,
          owner_email: ownerEmail || companyEmail,
          subscription_tier: tier,
          subscription_status: "active",
          logo_url: logoUrl || null,
          brand_color_primary: brandColorPrimary || "#1a4a7a",
          brand_color_accent: brandColorAccent || "#a8d96c",
          is_white_glove: true,
          admin_notes: adminNotes || null,
          deployment_status: "pending",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("client_team_members").insert({
        client_id: client.id,
        user_email: ownerEmail || companyEmail,
        role: "admin",
      });

      await logActivity(client.id, "client_created", admin.email, {
        tier,
        slug,
        source: "admin",
        white_glove: true,
      });

      await queueDeploymentJob(client.id, slug, tier);

      return res.status(201).json({ client });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return handleMiddlewareError(res, error);
  }
}
