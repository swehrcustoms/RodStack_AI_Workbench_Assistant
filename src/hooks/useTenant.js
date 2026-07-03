import { useEffect, useState } from "react";
import { getFeatureFlags } from "../lib/features.js";
import { useTenantContext } from "../context/TenantProvider.jsx";

function parseEnvFeatures() {
  try {
    const raw = import.meta.env.VITE_FEATURES;
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function buildTenantFromEnv() {
  const slug = import.meta.env.VITE_CLIENT_SLUG;
  const id = import.meta.env.VITE_TENANT_ID;
  const tier = import.meta.env.VITE_SUBSCRIPTION_TIER || "free";

  if (!slug && !id) return null;

  return {
    id,
    slug,
    tier,
    companyName: import.meta.env.VITE_COMPANY_NAME || slug,
    logoUrl: import.meta.env.VITE_LOGO_URL,
    brandColorPrimary: import.meta.env.VITE_BRAND_COLOR_PRIMARY || "#1a4a7a",
    brandColorAccent: import.meta.env.VITE_BRAND_COLOR_ACCENT || "#a8d96c",
    features: parseEnvFeatures() || getFeatureFlags(tier),
    source: "env",
  };
}

/**
 * Read tenant context from environment variables or /api/tenant.
 * When wrapped in TenantProvider, uses shared context; otherwise loads independently.
 */
export function useTenant() {
  try {
    return useTenantContext();
  } catch {
    // Not inside provider — standalone mode
  }

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const envTenant = buildTenantFromEnv();
    if (envTenant) {
      setTenant(envTenant);
      setLoading(false);
      return;
    }

    async function fetchTenant() {
      try {
        const token = localStorage.getItem("sb-access-token");
        const slug = window.location.hostname.split(".")[0];
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/tenant?slug=${slug}`, { headers });
        if (!res.ok) throw new Error("Failed to load tenant");
        setTenant(await res.json());
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, []);

  return {
    tenant,
    loading,
    error,
    hasFeature: (name) => Boolean(tenant?.features?.[name]),
    tier: tenant?.tier || "free",
  };
}

export default useTenant;
