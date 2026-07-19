import { useMemo, useState } from "react";
import { ExternalLink, Mail, Pencil, Search } from "lucide-react";

const TIER_COLORS = {
  free: "bg-slate-600",
  builder: "bg-blue-600",
  pro: "bg-purple-600",
  business: "bg-amber-600",
  enterprise: "bg-emerald-600",
};

const STATUS_COLORS = {
  active: "text-emerald-400",
  pending: "text-amber-400",
  in_progress: "text-cyan-400",
  failed: "text-red-400",
  cancelled: "text-slate-500",
};

export default function ClientList({ clients, loading, onSelect, onSendHandoff, adminToken }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = [...clients];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.client_slug?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.company_email?.toLowerCase().includes(q)
      );
    }
    if (tierFilter) list = list.filter((c) => c.subscription_tier === tierFilter);
    if (statusFilter) list = list.filter((c) => c.deployment_status === statusFilter || c.subscription_status === statusFilter);

    list.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [clients, search, tierFilter, statusFilter, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc((v) => !v);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSendHandoff = async (client) => {
    if (onSendHandoff) {
      onSendHandoff(client);
      return;
    }

    try {
      const res = await fetch("/api/admin/send-handoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ clientId: client.id, sendEmail: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await navigator.clipboard.writeText(data.emailTemplate);
      alert("Handoff email sent and template copied to clipboard.");
    } catch (err) {
      alert(`Handoff failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Client Portals ({filtered.length})</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="">All tiers</option>
            {["free", "builder", "pro", "business", "enterprise"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="in_progress">Deploying</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
              <th className="cursor-pointer py-3 pr-4" onClick={() => toggleSort("client_slug")}>
                Slug {sortField === "client_slug" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer py-3 pr-4" onClick={() => toggleSort("company_name")}>
                Company {sortField === "company_name" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer py-3 pr-4" onClick={() => toggleSort("subscription_tier")}>
                Tier {sortField === "subscription_tier" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="py-3 pr-4">Deploy</th>
              <th className="cursor-pointer py-3 pr-4" onClick={() => toggleSort("created_at")}>
                Created {sortField === "created_at" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                <td className="py-3 pr-4">
                  <a
                    href={client.deployment_url || `https://${client.client_slug}.rodstack.app`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:underline"
                  >
                    {client.client_slug}
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td className="py-3 pr-4 text-slate-200">{client.company_name}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${TIER_COLORS[client.subscription_tier] || "bg-slate-600"}`}>
                    {client.subscription_tier}
                  </span>
                </td>
                <td className={`py-3 pr-4 capitalize ${STATUS_COLORS[client.deployment_status] || "text-slate-400"}`}>
                  {client.deployment_status || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-400">
                  {client.created_at ? new Date(client.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect?.(client)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendHandoff(client)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      <Mail size={12} /> Send
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No clients match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
