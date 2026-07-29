import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { useAuth } from "../../context/AuthContext.jsx";
import { canManageOverrides, canMutatePlatform, canPreviewPlans } from "../../lib/auth/roles";
import { supabase } from "../../lib/supabaseClient.js";

export default function AdminSubscriptions() {
  const { platformRole } = useAuth();
  const [organizationId, setOrganizationId] = useState("");
  const [detail, setDetail] = useState(null);
  const [tier, setTier] = useState("pro");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setError("");
    setMessage("");
    try {
      const res = await adminApi.getSubscription(organizationId);
      setDetail(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const refresh = async () => {
    try {
      await adminApi.refreshEntitlements(organizationId);
      setMessage("Entitlements refreshed");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startPreview = async () => {
    try {
      await adminApi.startPlanPreview(organizationId, tier);
      setMessage(`Preview ${tier} started`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const endPreview = async () => {
    try {
      await adminApi.endPlanPreview({ organizationId });
      setMessage("Preview ended");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const applyOverride = async () => {
    try {
      await adminApi.manualOverride({ organizationId, tier, reason });
      setMessage("Override applied");
      setReason("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Subscriptions</h1>
      <div className="flex flex-wrap gap-2">
        <input
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          placeholder="Organization UUID"
          className="min-w-[280px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
        />
        <button type="button" onClick={load} className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white">
          Inspect
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {detail && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-sm">
            <p>
              Tier: <span className="text-cyan-300">{detail.subscription?.tier}</span> · Status:{" "}
              {detail.subscription?.status}
            </p>
            {detail.activePreview && (
              <p className="mt-2 text-amber-300">
                Active preview: {detail.activePreview.preview_tier}
              </p>
            )}
            <pre className="mt-3 max-h-48 overflow-auto rounded bg-slate-950 p-3 text-[11px] text-slate-400">
              {JSON.stringify(detail, null, 2)}
            </pre>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 p-4">
            <label className="text-xs text-slate-500">
              Tier
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="mt-1 block rounded border border-slate-800 bg-slate-950 px-2 py-2 text-sm"
              >
                <option value="free">free</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
            </label>

            {canMutatePlatform(platformRole) && (
              <button type="button" onClick={refresh} className="rounded border border-slate-600 px-3 py-2 text-xs">
                Refresh entitlements
              </button>
            )}
            {canPreviewPlans(platformRole) && (
              <>
                <button
                  type="button"
                  onClick={startPreview}
                  className="rounded border border-violet-500/40 px-3 py-2 text-xs text-violet-200"
                >
                  Start tier preview
                </button>
                <button type="button" onClick={endPreview} className="rounded border border-slate-600 px-3 py-2 text-xs">
                  End preview
                </button>
              </>
            )}
          </div>

          {canManageOverrides(platformRole) && (
            <div className="space-y-2 rounded-xl border border-slate-800 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Manual override</p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required)"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={applyOverride}
                className="rounded bg-amber-600/80 px-3 py-2 text-xs font-semibold text-white"
              >
                Apply override
              </button>
            </div>
          )}
        </div>
      )}

      {!supabase && (
        <p className="text-xs text-slate-500">Supabase client not configured — edge calls will fail.</p>
      )}
    </div>
  );
}
