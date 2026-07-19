import { jwtDecode } from "jwt-decode";
import { getSupabaseAdmin, getSupabaseForUser } from "../lib/supabaseAdmin.js";
import { getFeatureFlagsFromDb, getUpgradePath } from "../lib/features.js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const RESERVED_SLUGS = new Set(["www", "api", "admin", "app", "mail", "staging"]);

/**
 * Extract tenant slug from subdomain or query/path parameter.
 */
export function getSlugFromRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const querySlug = url.searchParams.get("slug");
  if (querySlug) return querySlug;

  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  if (parts.length >= 3) {
    const sub = parts[0];
    if (!RESERVED_SLUGS.has(sub)) return sub;
  }

  const pathMatch = url.pathname.match(/^\/api\/tenant\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

/**
 * Look up client by slug and attach tenant context.
 */
export async function extractTenantContext(req) {
  const slug = getSlugFromRequest(req);
  if (!slug) {
    const error = new Error("No tenant context found");
    error.status = 400;
    throw error;
  }

  const supabase = getSupabaseAdmin();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("client_slug", slug)
    .single();

  if (error || !client) {
    const notFound = new Error("Tenant not found");
    notFound.status = 404;
    throw notFound;
  }

  if (client.subscription_status !== "active") {
    const inactive = new Error("Subscription inactive");
    inactive.status = 403;
    inactive.subscription_status = client.subscription_status;
    throw inactive;
  }

  const features = await getFeatureFlagsFromDb(supabase, client.subscription_tier);

  return {
    id: client.id,
    slug: client.client_slug,
    tier: client.subscription_tier,
    companyName: client.company_name,
    companyEmail: client.company_email,
    logoUrl: client.logo_url,
    brandColorPrimary: client.brand_color_primary,
    brandColorAccent: client.brand_color_accent,
    features,
    raw: client,
  };
}

/**
 * Verify JWT and ensure user belongs to the tenant.
 */
export async function authenticateUser(req, tenant) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    const error = new Error("No authentication token");
    error.status = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch {
    const error = new Error("Invalid token");
    error.status = 401;
    throw error;
  }

  const supabase = getSupabaseForUser(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    const error = new Error("Invalid token");
    error.status = 401;
    throw error;
  }

  const jwtTenantId = decoded.app_metadata?.tenant_id;
  if (jwtTenantId && jwtTenantId !== tenant.id) {
    const error = new Error("Tenant mismatch — JWT tenant_id does not match request");
    error.status = 403;
    throw error;
  }

  const email = userData.user.email?.toLowerCase();
  const admin = getSupabaseAdmin();

  const { data: teamMember } = await admin
    .from("client_team_members")
    .select("*")
    .eq("client_id", tenant.id)
    .eq("user_email", email)
    .maybeSingle();

  const isAdmin = ADMIN_EMAILS.includes(email) || decoded.app_metadata?.is_admin === true;

  if (!teamMember && !isAdmin) {
    const error = new Error("User not in tenant");
    error.status = 403;
    throw error;
  }

  return {
    email,
    role: teamMember?.role || (isAdmin ? "admin" : "builder"),
    tenantId: tenant.id,
    isAdmin,
    token,
  };
}

/**
 * Require admin API access (service key or admin email JWT).
 */
export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  const adminPassword = process.env.ADMIN_API_SECRET;

  if (adminPassword && token === adminPassword) {
    return { email: "system", isAdmin: true };
  }

  if (!token) {
    const error = new Error("Admin authentication required");
    error.status = 401;
    throw error;
  }

  const supabase = getSupabaseForUser(token);
  const { data: userData, error } = await supabase.auth.getUser(token);

  if (error || !userData?.user) {
    const err = new Error("Invalid admin token");
    err.status = 401;
    throw err;
  }

  const email = userData.user.email?.toLowerCase();
  let decoded = {};
  try {
    decoded = jwtDecode(token);
  } catch {
  }

  if (!ADMIN_EMAILS.includes(email) && decoded.app_metadata?.is_admin !== true) {
    const err = new Error("Insufficient permissions");
    err.status = 403;
    throw err;
  }

  return { email, isAdmin: true, token };
}

/**
 * Check if tenant tier includes a feature; throws 403 if not.
 */
export function requireFeature(tenant, featureName) {
  if (!tenant?.features?.[featureName]) {
    const error = new Error("Feature not available in your plan");
    error.status = 403;
    error.feature = featureName;
    error.tier = tenant.tier;
    error.upgrade_required = getUpgradePath(tenant.tier, featureName);
    throw error;
  }
}

/**
 * Enforce role-based access control.
 */
export function requireRole(user, ...roles) {
  if (!user || !roles.includes(user.role)) {
    const error = new Error("Insufficient permissions");
    error.status = 403;
    error.required_roles = roles;
    error.your_role = user?.role;
    throw error;
  }
}

/**
 * Send JSON error response from middleware errors.
 */
export function handleMiddlewareError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({
    error: error.message,
    ...(error.feature && { feature: error.feature }),
    ...(error.tier && { tier: error.tier }),
    ...(error.upgrade_required && { upgrade_required: error.upgrade_required }),
    ...(error.subscription_status && { subscription_status: error.subscription_status }),
    ...(error.required_roles && { required_roles: error.required_roles }),
    ...(error.your_role && { your_role: error.your_role }),
  });
}

/**
 * Parse JSON body from Vercel request.
 */
export async function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Read raw body for Stripe webhook signature verification.
 */
export async function readRawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
