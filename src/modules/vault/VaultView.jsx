import { useState } from "react";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import { ORDER_STATUSES } from "../../data/buildRecord.js";
import BuildSheetModal from "../buildsheet/BuildSheetModal.jsx";

export default function VaultView({ onOpenBench, onEditBuild }) {
  const { data, cloneBuild, advanceBuildStatus } = useRodStackData();
  const [sheetBuild, setSheetBuild] = useState(null);
  const builds = data.builds || [];

  if (!builds.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/50 p-12 text-center">
        <p className="text-lg font-medium text-white">Build Vault is empty</p>
        <p className="mt-2 text-sm text-slate-400">Save a blueprint from Production Bench or clone an existing spec to start your job queue.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Build Vault</h2>
          <p className="text-sm text-slate-400">{builds.length} saved build records</p>
        </div>
      </div>
      <div className="grid gap-3">
        {builds.map((b) => (
          <article key={b.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-cyan-300">{b.sku}</p>
                <h3 className="text-lg font-semibold text-white">{b.buildName || b.name}</h3>
                <p className="text-sm text-slate-400">{b.technique} · {b.orderStatus}</p>
                {b.clonedFrom && <p className="mt-1 text-xs text-slate-500">Cloned from: {b.clonedFrom.name}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onEditBuild?.(b)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200">
                  Edit
                </button>
                <button type="button" onClick={() => setSheetBuild(b)} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300">
                  Build Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const buildName = window.prompt("Name for cloned build:", `${b.buildName || b.name} (Clone)`);
                    if (buildName == null) return;
                    const clone = cloneBuild(b.id, { buildName });
                    onEditBuild?.(clone);
                  }}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200"
                >
                  Clone Build
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORDER_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => advanceBuildStatus(b.id, st)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] ${b.orderStatus === st ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500"}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {sheetBuild && <BuildSheetModal build={sheetBuild} onClose={() => setSheetBuild(null)} />}
    </section>
  );
}
