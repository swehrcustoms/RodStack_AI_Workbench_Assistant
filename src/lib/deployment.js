import { writeFile, mkdir, rm } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { getFeatureFlagsFromDb } from "./features.js";
import { logActivity } from "./activity.js";
import { sendPortalReadyEmail } from "./email.js";

const execAsync = promisify(exec);

const VERCEL_API = "https://api.vercel.com";
const GITHUB_REPO = process.env.GITHUB_REPO || "swehrcustoms/RodStack_AI_Workbench_Assistant";
const CUSTOM_DOMAIN_TIERS = new Set(["pro", "business", "enterprise"]);

/**
 * Queue deployment by calling the deploy-client API endpoint.
 */
export async function queueDeploymentJob(clientId, slug, tier) {
  const baseUrl =
    process.env.VITE_API_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const deploySecret = process.env.DEPLOY_WEBHOOK_SECRET;
  const headers = { "Content-Type": "application/json" };
  if (deploySecret) {
    headers.Authorization = `Bearer ${deploySecret}`;
  }

  const response = await fetch(`${baseUrl}/api/deploy-client`, {
    method: "POST",
    headers,
    body: JSON.stringify({ clientId, slug, tier }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[deploy] Queue failed:", text);
    throw new Error(`Deployment queue failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Full portal deployment pipeline.
 */
export async function deployClientPortal(clientId, slug, tier) {
  const supabase = getSupabaseAdmin();

  try {
    console.log(`[DEPLOY] Starting deployment for ${slug} (${tier})`);

    await supabase
      .from("clients")
      .update({ deployment_status: "in_progress", deployment_error: null })
      .eq("id", clientId);

    const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
    if (!client) {
      throw new Error("Client not found");
    }

    const envVars = await createEnvFile(clientId, slug, tier, client);
    const deploymentUrl = await deployToVercelViaAPI(slug, tier, envVars);

    if (CUSTOM_DOMAIN_TIERS.has(tier)) {
      await configureCustomDomain(slug);
    }

    await supabase
      .from("clients")
      .update({
        deployment_url: deploymentUrl,
        deployment_status: "active",
        deployed_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    await logActivity(clientId, "portal_deployed", "system", { url: deploymentUrl, tier });

    const { data: updatedClient } = await supabase.from("clients").select("*").eq("id", clientId).single();
    if (updatedClient) {
      await sendPortalReadyEmail(updatedClient);
    }

    console.log(`[DEPLOY] Success: ${deploymentUrl}`);
    return deploymentUrl;
  } catch (error) {
    console.error(`[DEPLOY ERROR] ${error.message}`);

    await supabase
      .from("clients")
      .update({
        deployment_status: "failed",
        deployment_error: error.message,
      })
      .eq("id", clientId);

    await logActivity(clientId, "portal_deploy_failed", "system", { error: error.message });
    throw error;
  }
}

/**
 * Build environment variable map for a tenant portal.
 */
export async function createEnvFile(clientId, slug, tier, client = {}) {
  const supabase = getSupabaseAdmin();
  const features = await getFeatureFlagsFromDb(supabase, tier);

  return {
    VITE_TENANT_ID: clientId,
    VITE_CLIENT_SLUG: slug,
    VITE_SUBSCRIPTION_TIER: tier,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    VITE_API_URL: `https://${slug}.rodstack.app/api`,
    VITE_FEATURES: JSON.stringify(features),
    VITE_BRAND_COLOR_PRIMARY: client.brand_color_primary || "#1a4a7a",
    VITE_BRAND_COLOR_ACCENT: client.brand_color_accent || "#a8d96c",
    VITE_LOGO_URL: client.logo_url || "https://cdn.rodstack.app/logos/default-rodstack.svg",
    VITE_COMPANY_NAME: client.company_name || slug,
    VITE_ENVIRONMENT: "production",
    VITE_APP_NAME: "RodStack AI Workbench",
  };
}

/**
 * Deploy to Vercel via REST API using GitHub source.
 */
export async function deployToVercelViaAPI(slug, tier, envVars) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    // Dev/test fallback when Vercel token is not configured
    const mockUrl = `https://${slug}.rodstack.app`;
    console.warn("[DEPLOY] VERCEL_TOKEN not set — using mock URL:", mockUrl);
    return mockUrl;
  }

  const projectName = `rodstack-${slug}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const teamId = process.env.VERCEL_TEAM_ID;
  const teamQuery = teamId ? `?teamId=${teamId}` : "";

  // Ensure project exists
  try {
    await fetch(`${VERCEL_API}/v9/projects/${projectName}${teamQuery}`, { headers });
  } catch {
  }

  const envArray = Object.entries(envVars).map(([key, value]) => ({
    key,
    value: String(value),
    type: key.includes("KEY") || key.includes("SECRET") ? "encrypted" : "plain",
    target: ["production", "preview", "development"],
  }));

  await fetch(`${VERCEL_API}/v10/projects${teamQuery}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: projectName,
      framework: "vite",
      environmentVariables: envArray,
    }),
  }).catch(() => {});

  const deployResponse = await fetch(`${VERCEL_API}/v13/deployments${teamQuery}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: projectName,
      target: "production",
      gitSource: {
        type: "github",
        repo: GITHUB_REPO,
        ref: process.env.GITHUB_DEPLOY_BRANCH || "main",
      },
      env: envVars,
    }),
  });

  if (!deployResponse.ok) {
    const errBody = await deployResponse.text();
    throw new Error(`Vercel deployment create failed: ${errBody}`);
  }

  const deployData = await deployResponse.json();
  const deploymentId = deployData.id;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery}`, {
      headers,
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    if (statusData.readyState === "READY") {
      const url = statusData.url ? `https://${statusData.url}` : `https://${slug}.rodstack.app`;
      return url;
    }
    if (statusData.readyState === "ERROR" || statusData.readyState === "CANCELED") {
      throw new Error("Vercel deployment failed");
    }
  }

  throw new Error("Deployment timeout after 2 minutes");
}

/**
 * Configure wildcard subdomain for tenant (Pro+ tiers).
 */
export async function configureCustomDomain(slug) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return;

  const projectName = `rodstack-${slug}`;
  const domain = `${slug}.rodstack.app`;
  const teamQuery = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";

  try {
    const response = await fetch(`${VERCEL_API}/v10/projects/${projectName}/domains${teamQuery}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[DEPLOY] Custom domain warning for ${domain}:`, body);
    } else {
      console.log(`[DEPLOY] Custom domain configured: ${domain}`);
    }
  } catch (error) {
    console.warn(`[DEPLOY] Custom domain configuration failed: ${error.message}`);
  }
}

/**
 * Clone repo and write .env.local (used for local/CLI deployments).
 */
export async function cloneAndPrepareEnv(slug, clientId, tier, client) {
  const repoPath = `/tmp/rodstack-${slug}-${Date.now()}`;
  await mkdir(repoPath, { recursive: true });

  const cmd = `git clone --depth 1 --branch ${process.env.GITHUB_DEPLOY_BRANCH || "main"} https://github.com/${GITHUB_REPO}.git ${repoPath}`;
  await execAsync(cmd);

  const envVars = await createEnvFile(clientId, slug, tier, client);
  const envContent = Object.entries(envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  await writeFile(`${repoPath}/.env.local`, envContent);
  return { repoPath, envVars };
}

export async function cleanupRepo(repoPath) {
  if (repoPath) {
    await rm(repoPath, { recursive: true, force: true }).catch(() => {});
  }
}
