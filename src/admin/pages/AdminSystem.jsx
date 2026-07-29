import { useAuth } from "../../context/AuthContext.jsx";
import { supabaseEnabled } from "../../lib/supabaseClient.js";
import { getClientEnv } from "../../lib/env";

export default function AdminSystem() {
  const { platformRole, user, configError } = useAuth();
  const env = getClientEnv();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">System</h1>
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-sm text-slate-300">
        <p>Supabase client: {supabaseEnabled ? "configured" : "missing"}</p>
        <p className="mt-1">URL set: {env.supabaseUrl ? "yes" : "no"}</p>
        <p className="mt-1">User: {user?.email || "—"}</p>
        <p className="mt-1">
          Platform role: <span className="text-violet-300">{platformRole || "none"}</span>
        </p>
        {configError && <p className="mt-2 text-red-400">{configError}</p>}
      </div>
      <div className="rounded-xl border border-slate-800 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-300">Edge functions</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>admin-get-user</li>
          <li>admin-search-users</li>
          <li>admin-get-subscription</li>
          <li>admin-refresh-entitlements</li>
          <li>admin-start-plan-preview / admin-end-plan-preview</li>
          <li>admin-start-support-view / admin-end-support-view</li>
          <li>admin-manual-override</li>
        </ul>
      </div>
    </div>
  );
}
