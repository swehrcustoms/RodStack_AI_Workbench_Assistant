import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminOrganizations() {
  const { isAdmin } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin || !supabaseEnabled || !supabase) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("organizations")
        .select("id, name, slug, owner_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) setError(err.message);
      else setOrgs(data || []);
    })();
  }, [isAdmin]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Organizations</h1>
      <p className="text-sm text-slate-400">Tenant list visible to platform admins via RLS.</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-slate-900">
                <td className="px-3 py-2 text-slate-200">{o.name}</td>
                <td className="px-3 py-2">{o.slug}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{o.id}</td>
              </tr>
            ))}
            {!orgs.length && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-slate-600">
                  No organizations loaded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
