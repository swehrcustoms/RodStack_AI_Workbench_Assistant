import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminOverview() {
  const { platformRole, memberships } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Owner subscription troubleshooting</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Search users, inspect subscriptions, preview tiers, open support view, refresh entitlements,
          and apply manual overrides. Mutations go through Supabase Edge Functions with audit logging.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Users", "/admin/users", "Search & inspect accounts"],
          ["Subscriptions", "/admin/subscriptions", "Tier, overrides, preview"],
          ["Entitlements", "/admin/entitlements", "Refresh feature flags"],
          ["Organizations", "/admin/organizations", "Tenant membership"],
          ["Audit", "/admin/audit", "Security event trail"],
          ["System", "/admin/system", "Health & role info"],
        ].map(([label, to, desc]) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 hover:border-slate-600"
          >
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="mt-1 text-xs text-slate-500">{desc}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-xs text-slate-400">
        <p>
          Signed in as <span className="text-violet-300">{platformRole}</span>
        </p>
        <p className="mt-1">Your org memberships: {memberships.length || 0}</p>
      </div>
    </div>
  );
}
