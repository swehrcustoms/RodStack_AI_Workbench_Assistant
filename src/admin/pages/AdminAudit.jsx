import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminAudit() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin || !supabaseEnabled || !supabase) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, resource_type, resource_id, organization_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) setError(err.message);
      else setLogs(data || []);
    })();
  }, [isAdmin]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Audit logs</h1>
      <p className="text-sm text-slate-400">Platform-admin readable trail of owner console actions.</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-slate-800 bg-[#0d1424] px-3 py-2 text-xs">
            <div className="flex flex-wrap gap-2 text-slate-300">
              <span className="text-cyan-300">{log.action}</span>
              <span>{log.resource_type}</span>
              <span className="text-slate-600">{log.created_at}</span>
            </div>
            <pre className="mt-1 overflow-auto text-[10px] text-slate-500">
              {JSON.stringify(
                {
                  resource_id: log.resource_id,
                  organization_id: log.organization_id,
                  metadata: log.metadata,
                },
                null,
                2
              )}
            </pre>
          </div>
        ))}
        {!logs.length && <p className="text-slate-600">No audit events yet</p>}
      </div>
    </div>
  );
}
