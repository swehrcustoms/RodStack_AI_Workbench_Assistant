import { Lock, ArrowUpRight } from "lucide-react";
import { useTenant } from "../hooks/useTenant.js";
import { FEATURE_TIER_MAP } from "../lib/features.js";

function getUpgradeTier(feature) {
  const tier = FEATURE_TIER_MAP[feature] || "pro";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function DefaultUpgradePrompt({ feature, tier }) {
  const upgradeTier = getUpgradeTier(feature);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
        <Lock className="text-amber-400" size={22} />
      </div>
      <h3 className="text-lg font-semibold text-white">Feature Locked</h3>
      <p className="mt-2 text-sm text-slate-400">
        This feature is available on the <strong className="text-amber-300">{upgradeTier}</strong> plan or higher.
        You are currently on <strong className="text-slate-300">{tier}</strong>.
      </p>
      <a
        href="/pricing"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        Upgrade to {upgradeTier}
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}

export function FeatureGate({ feature, children, fallback }) {
  const { tenant, loading, error, hasFeature, tier } = useTenant();

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Unable to verify feature access: {error.message}
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
        Tenant context not available.
      </div>
    );
  }

  const enabled = hasFeature(feature) || Boolean(tenant.features?.[feature]);

  if (!enabled) {
    if (fallback) return fallback;
    return <DefaultUpgradePrompt feature={feature} tier={tier} />;
  }

  return children;
}

export default FeatureGate;
