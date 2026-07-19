import { useState } from "react";
import { Loader2 } from "lucide-react";

const TIERS = ["free", "builder", "pro", "business", "enterprise"];

const defaultForm = {
  companyName: "",
  companyEmail: "",
  ownerName: "",
  tier: "pro",
  logoUrl: "",
  brandColorPrimary: "#1a4a7a",
  brandColorAccent: "#a8d96c",
  adminNotes: "",
};

export default function CreateClientForm({ onCreated, adminToken }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create client");

      setSuccess(`Portal created for ${data.client.client_slug}.rodstack.app — deployment queued.`);
      setForm(defaultForm);
      onCreated?.(data.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Create Client Portal</h2>
        <p className="mt-1 text-sm text-slate-400">White-glove onboarding — customize before sending to client.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Company Name *</span>
          <input
            required
            value={form.companyName}
            onChange={update("companyName")}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Company Email *</span>
          <input
            required
            type="email"
            value={form.companyEmail}
            onChange={update("companyEmail")}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Owner Name</span>
          <input
            value={form.ownerName}
            onChange={update("ownerName")}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Subscription Tier</span>
          <select
            value={form.tier}
            onChange={update("tier")}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-400">Logo URL</span>
          <input
            type="url"
            value={form.logoUrl}
            onChange={update("logoUrl")}
            placeholder="https://cdn.example.com/logo.svg"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Primary Brand Color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={form.brandColorPrimary} onChange={update("brandColorPrimary")} className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-slate-950" />
            <input value={form.brandColorPrimary} onChange={update("brandColorPrimary")} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white" />
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Accent Color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={form.brandColorAccent} onChange={update("brandColorAccent")} className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-slate-950" />
            <input value={form.brandColorAccent} onChange={update("brandColorAccent")} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white" />
          </div>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-400">Admin Notes</span>
          <textarea
            value={form.adminNotes}
            onChange={update("adminNotes")}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Creating Portal..." : "Create Portal"}
      </button>
    </form>
  );
}
