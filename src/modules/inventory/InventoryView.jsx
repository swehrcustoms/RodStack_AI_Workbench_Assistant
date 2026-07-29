import { useRodStackData } from "../../context/RodStackDataContext.jsx";

const CATEGORIES = ["blanks", "guide sets", "individual guides", "thread spools", "grips", "reel seats", "winding checks", "epoxy/finish products", "miscellaneous hardware"];

export default function InventoryView() {
  const { data, addInventorySku, updateInventorySku, lowStockCount } = useRodStackData();
  const skus = data.inventorySkus || [];

  const exportCsv = () => {
    const header = "id,category,name,supplier,supplierUrl,unitCost,qty,lowThreshold\n";
    const rows = skus.map((s) => [s.id, s.category, s.name, s.supplier, s.supplierUrl, s.unitCost, s.qty, s.lowThreshold].join(","));
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rodstack-inventory.csv";
    a.click();
  };

  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split("\n").slice(1).filter(Boolean);
      lines.forEach((line) => {
        const [id, category, name, supplier, supplierUrl, unitCost, qty, lowThreshold] = line.split(",");
        addInventorySku({ id: id || undefined, category, name, supplier, supplierUrl, unitCost: Number(unitCost), qty: Number(qty), lowThreshold: Number(lowThreshold) });
      });
    };
    reader.readAsText(file);
  };

  if (!skus.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-600 p-10 text-center text-slate-400">
        <p className="text-white">No inventory SKUs</p>
        <p className="mt-2 text-sm">Import a CSV or add your first blank, guide set, or thread spool SKU.</p>
        <button
          type="button"
          onClick={() =>
            addInventorySku({
              category: "blanks",
              name: "New SKU",
              supplier: "",
              supplierUrl: "",
              unitCost: 0,
              qty: 0,
              lowThreshold: 2,
            })
          }
          className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          + Add SKU
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {lowStockCount > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {lowStockCount} SKU(s) at or below low-stock threshold
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addInventorySku({ category: "blanks", name: "New SKU", supplier: "", supplierUrl: "", unitCost: 0, qty: 0, lowThreshold: 2 })} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950">
          + Add SKU
        </button>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
          Export CSV
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
          Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={importCsv} />
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Name</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Low</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((s) => (
              <tr key={s.id} className={`border-t border-slate-800 ${(s.qty ?? 0) <= (s.lowThreshold ?? 0) ? "bg-amber-500/5" : ""}`}>
                <td className="p-2 font-mono text-slate-500">{s.id}</td>
                <td className="p-2">
                  <select className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5" value={s.category} onChange={(e) => updateInventorySku(s.id, { category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input className="w-full min-w-[120px] rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-white" value={s.name} onChange={(e) => updateInventorySku(s.id, { name: e.target.value })} />
                </td>
                <td className="p-2">
                  <input className="w-24 rounded border border-slate-700 bg-slate-950 px-1 py-0.5" value={s.supplier} onChange={(e) => updateInventorySku(s.id, { supplier: e.target.value })} />
                </td>
                <td className="p-2">
                  <input type="number" className="w-16 rounded border border-slate-700 bg-slate-950 px-1 py-0.5" value={s.unitCost} onChange={(e) => updateInventorySku(s.id, { unitCost: Number(e.target.value) })} />
                </td>
                <td className="p-2">
                  <input type="number" className="w-14 rounded border border-slate-700 bg-slate-950 px-1 py-0.5" value={s.qty} onChange={(e) => updateInventorySku(s.id, { qty: Number(e.target.value) })} />
                </td>
                <td className="p-2">
                  <input type="number" className="w-14 rounded border border-slate-700 bg-slate-950 px-1 py-0.5" value={s.lowThreshold} onChange={(e) => updateInventorySku(s.id, { lowThreshold: Number(e.target.value) })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
