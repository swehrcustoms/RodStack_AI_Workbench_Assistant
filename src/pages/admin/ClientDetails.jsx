import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";

export default function ClientDetails({ clientId, adminToken, onBack, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
        setForm({
          companyName: json.client.company_name,
          companyEmail: json.client.company_email,
          ownerName: json.client.owner_name || "",
          ownerEmail: json.client.owner_email || "",
          subscriptionTier: json.client.subscription_tier,
          logoUrl: json.client.logo_url || "",
          brandColorPrimary: json.client.brand_color_primary || "#1a4a7a",
          brandColorAccent: json.client.brand_color_accent || "#a8d96c",
          adminNotes: json.client.admin_notes || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (clientId) load();
  }, [clientId, adminToken]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((prev) => ({ ...prev, client: json.client }));
      onUpdated?.(json.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-red-400">{error}</p>;
  }

  const { client, teamMembers, activityLog, apiUsageThisMonth } = data;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> Back to list
      </button>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{client.company_name}</h2>
            <p className="font-mono text-sm text-cyan-400">{client.client_slug}.rodstack.app</p>
          </div>
          <a
            href={client.deployment_url || `https://${client.client_slug}.rodstack.app`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10"
          >
            View Portal <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["companyName", "Company Name"],
            ["companyEmail", "Company Email"],
            ["ownerName", "Owner Name"],
            ["ownerEmail", "Owner Email"],
            ["logoUrl", "Logo URL"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-slate-400">{label}</span>
              <input
                value={form[key] || ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="text-slate-400">Tier</span>
            <select
              value={form.subscriptionTier}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionTier: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {["free", "builder", "pro", "business", "enterprise"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Primary Color</span>
            <input
              type="color"
              value={form.brandColorPrimary}
              onChange={(e) => setForm((f) => ({ ...f, brandColorPrimary: e.target.value }))}
              className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-700 bg-slate-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Accent Color</span>
            <input
              type="color"
              value={form.brandColorAccent}
              onChange={(e) => setForm((f) => ({ ...f, brandColorAccent: e.target.value }))}
              className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-700 bg-slate-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-400">Admin Notes</span>
            <textarea
              value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
          <h3 className="font-semibold text-white">Team Members</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {(teamMembers || []).map((m) => (
              <li key={m.id} className="flex justify-between rounded-lg border border-slate-800 px-3 py-2">
                <span className="text-slate-300">{m.user_email}</span>
                <span className="text-slate-500">{m.role}</span>
              </li>
            ))}
            {(!teamMembers || teamMembers.length === 0) && (
              <li className="text-slate-500">No team members yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
          <h3 className="font-semibold text-white">API Usage (This Month)</h3>
          <p className="mt-2 text-3xl font-bold text-cyan-400">{apiUsageThisMonth ?? 0}</p>
          <p className="text-sm text-slate-500">requests logged</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h3 className="font-semibold text-white">Activity Log</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {(activityLog || []).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-800 px-3 py-2">
              <div className="flex justify-between text-slate-400">
                <span className="font-mono text-cyan-400">{entry.action}</span>
                <span>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <p className="text-slate-500">{entry.actor_email}</p>
            </div>
          ))}
          {(!activityLog || activityLog.length === 0) && (
            <p className="text-slate-500">No activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
