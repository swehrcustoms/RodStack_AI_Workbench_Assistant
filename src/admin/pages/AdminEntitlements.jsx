import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { useAuth } from "../../context/AuthContext.jsx";
import { canMutatePlatform } from "../../lib/auth/roles";

export default function AdminEntitlements() {
  const { platformRole } = useAuth();
  const [organizationId, setOrganizationId] = useState("");
  const [entitlements, setEntitlements] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await adminApi.getSubscription(organizationId);
      setEntitlements(res.entitlements || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const refresh = async () => {
    setError("");
    setMessage("");
    try {
      const res = await adminApi.refreshEntitlements(organizationId);
      setEntitlements(res.entitlements || []);
      setMessage("Refreshed");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Entitlements</h1>
      <div className="flex flex-wrap gap-2">
        <input
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          placeholder="Organization UUID"
          className="min-w-[280px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
        />
        <button type="button" onClick={load} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">
          Load
        </button>
        {canMutatePlatform(platformRole) && (
          <button type="button" onClick={refresh} className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white">
            Refresh entitlements
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <ul className="space-y-2">
        {entitlements.map((e) => (
          <li
            key={e.id || e.feature_key}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1424] px-3 py-2 text-sm"
          >
            <span className="text-slate-200">{e.feature_key}</span>
            <span className="text-xs text-slate-500">
              {e.enabled ? "on" : "off"} · {e.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
