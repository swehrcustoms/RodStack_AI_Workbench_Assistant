import { useEffect, useState, useMemo, createContext, useContext } from "react";
import { getFeatureFlags } from "../lib/features.js";

const TenantContext = createContext(null);

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

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const envTenant = buildTenantFromEnv();
      if (envTenant) {
        if (!cancelled) {
          setTenant(envTenant);
          setLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem("sb-access-token") || localStorage.getItem("auth_token");
        const slug = window.location.hostname.split(".")[0];
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`/api/tenant?slug=${encodeURIComponent(slug)}`, { headers });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load tenant");
        }

        const data = await response.json();
        if (!cancelled) {
          setTenant({ ...data, source: "api" });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      tenant,
      loading,
      error,
      hasFeature: (name) => Boolean(tenant?.features?.[name]),
      tier: tenant?.tier || "free",
    }),
    [tenant, loading, error]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within TenantProvider");
  }
  return ctx;
}
