import { useState } from "react";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import { ORDER_STATUSES } from "../../data/buildRecord.js";
import BuildSheetModal from "../buildsheet/BuildSheetModal.jsx";

export default function CRMView() {
  const { data, addCustomer, updateCustomer, addQuote, advanceBuildStatus, crmStats, deductInventoryForBuild } = useRodStackData();
  const [tab, setTab] = useState("dashboard");
  const [sheetBuild, setSheetBuild] = useState(null);
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "", species: "", techniques: "" });
  const [quoteForm, setQuoteForm] = useState({ customerId: "", labor: 45, markup: 25, sell: 0 });

  const customers = data.customers || [];
  const builds = data.builds || [];

  const lineItems = [
    { label: "Blank", cost: 89 },
    { label: "Guide train", cost: 42 },
    { label: "Handle components", cost: 38 },
    { label: "Thread & finish", cost: 22 },
  ];
  const materials = lineItems.reduce((s, i) => s + i.cost, 0);
  const labor = Number(quoteForm.labor) || 0;
  const subtotal = materials + labor;
  const total = subtotal + (subtotal * (Number(quoteForm.markup) || 0)) / 100;

  const exportQuotePdf = async () => {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.text("RodStack Quote", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["Item", "Cost"]],
      body: [...lineItems.map((i) => [i.label, `$${i.cost}`]), ["Labor", `$${labor}`], ["Total", `$${total.toFixed(2)}`]],
    });
    doc.save("rodstack-quote.pdf");
  };

  if (!customers.length && tab === "customers") {
    return (
      <section className="rounded-2xl border border-dashed border-slate-600 p-10 text-center">
        <p className="text-white">No customers yet</p>
        <p className="mt-2 text-sm text-slate-400">Add your first customer profile to link builds, quotes, and order status.</p>
        <button type="button" onClick={() => setTab("add")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Add Customer
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["dashboard", "customers", "orders", "quotes", "add"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs capitalize ${tab === t ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs text-slate-500">Open Orders</p>
            <p className="text-2xl font-bold text-amber-300">{crmStats.open}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-cyan-300">{crmStats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs text-slate-500">Completed This Month</p>
            <p className="text-2xl font-bold text-emerald-300">{crmStats.completedMonth}</p>
          </div>
        </div>
      )}

      {tab === "add" && (
        <form
          className="rounded-xl border border-slate-700 bg-slate-900/80 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            addCustomer({ ...custForm, techniques: custForm.techniques.split(",").map((s) => s.trim()) });
            setCustForm({ name: "", email: "", phone: "", species: "", techniques: "" });
            setTab("customers");
          }}
        >
          <h3 className="font-semibold text-white">New Customer</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {["name", "email", "phone", "species"].map((f) => (
              <input key={f} required={f === "name"} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder={f} value={custForm[f]} onChange={(e) => setCustForm((p) => ({ ...p, [f]: e.target.value }))} />
            ))}
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2" placeholder="Techniques (comma separated)" value={custForm.techniques} onChange={(e) => setCustForm((p) => ({ ...p, techniques: e.target.value }))} />
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Save Customer
          </button>
        </form>
      )}

      {tab === "customers" && (
        <div className="space-y-3">
          {customers.map((c) => (
            <article key={c.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <h3 className="font-semibold text-white">{c.name}</h3>
              <p className="text-sm text-slate-400">{c.email} · {c.phone}</p>
              <p className="text-xs text-slate-500">Species: {c.species} · Builds: {builds.filter((b) => b.customerId === c.id).length}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {builds.map((b) => (
            <article key={b.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{b.buildName}</p>
                  <p className="text-xs text-slate-400">{b.customerName || "No customer"} · {b.orderStatus}</p>
                </div>
                <button type="button" onClick={() => setSheetBuild(b)} className="text-xs text-cyan-300">
                  Attach Build Sheet
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {ORDER_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      advanceBuildStatus(b.id, st);
                      if (st === "Complete") {
                        const deduct = window.confirm("Mark complete and deduct inventory components?");
                        if (deduct) deductInventoryForBuild(b);
                      }
                    }}
                    className={`rounded px-2 py-0.5 text-[10px] ${b.orderStatus === st ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "quotes" && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <h3 className="font-semibold text-white">Quote Builder</h3>
          <select className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={quoteForm.customerId} onChange={(e) => setQuoteForm((p) => ({ ...p, customerId: e.target.value }))}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="mt-3 space-y-1 text-sm text-slate-300">
            {lineItems.map((i) => (
              <div key={i.label} className="flex justify-between">
                <span>{i.label}</span>
                <span>${i.cost}</span>
              </div>
            ))}
          </div>
          <label className="mt-2 block text-xs text-slate-400">
            Labor ($)
            <input type="number" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={quoteForm.labor} onChange={(e) => setQuoteForm((p) => ({ ...p, labor: e.target.value }))} />
          </label>
          <label className="mt-2 block text-xs text-slate-400">
            Markup (%)
            <input type="number" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={quoteForm.markup} onChange={(e) => setQuoteForm((p) => ({ ...p, markup: e.target.value }))} />
          </label>
          <p className="mt-3 text-lg font-bold text-cyan-300">Total: ${total.toFixed(2)}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => addQuote({ ...quoteForm, lineItems, total })} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">
              Save Quote
            </button>
            <button type="button" onClick={exportQuotePdf} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950">
              Export PDF
            </button>
          </div>
        </div>
      )}

      {sheetBuild && <BuildSheetModal build={sheetBuild} onClose={() => setSheetBuild(null)} />}
    </section>
  );
}
