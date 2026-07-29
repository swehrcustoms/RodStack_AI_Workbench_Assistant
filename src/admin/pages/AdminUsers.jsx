import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { useAuth } from "../../context/AuthContext.jsx";
import { canStartSupportView } from "../../lib/auth/roles";

export default function AdminUsers() {
  const { platformRole } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [supportView, setSupportView] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.searchUsers(query);
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inspect = async (userId) => {
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.getUser({ userId });
      setSelected(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSupport = async () => {
    if (!selected?.profile?.id) return;
    setError("");
    try {
      const orgId = selected.memberships?.[0]?.organization_id;
      const res = await adminApi.startSupportView(selected.profile.id, orgId);
      setSupportView(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const endSupport = async () => {
    try {
      await adminApi.endSupportView(supportView?.session?.id);
      setSupportView(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Users</h1>
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, name, shop…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white">
          {loading ? "…" : "Search"}
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Builder</th>
              <th className="px-3 py-2">Shop</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-900">
                <td className="px-3 py-2 text-slate-200">{u.email}</td>
                <td className="px-3 py-2">{u.builder_name || "—"}</td>
                <td className="px-3 py-2">{u.shop_name || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="text-cyan-400 hover:underline"
                    onClick={() => inspect(u.id)}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-600">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">{selected.profile.email}</h2>
              <p className="mt-1 text-xs text-slate-500">{selected.profile.id}</p>
            </div>
            {canStartSupportView(platformRole) && (
              <div className="flex gap-2">
                {!supportView ? (
                  <button
                    type="button"
                    onClick={startSupport}
                    className="rounded border border-amber-500/40 px-3 py-1.5 text-xs text-amber-200"
                  >
                    Start support view
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={endSupport}
                    className="rounded border border-slate-600 px-3 py-1.5 text-xs"
                  >
                    End support view
                  </button>
                )}
              </div>
            )}
          </div>
          <pre className="mt-3 max-h-64 overflow-auto rounded bg-slate-950 p-3 text-[11px] text-slate-400">
            {JSON.stringify(
              {
                memberships: selected.memberships,
                subscriptions: selected.subscriptions,
                supportView: supportView?.supportView,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
