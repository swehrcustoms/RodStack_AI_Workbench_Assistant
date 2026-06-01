import { useState } from "react";

export default function BenchModeView({ build, onUpdateGuide, onExit }) {
  const guides = (build?.guideTrain?.spacingArray || []).map((spacingFromTip) => ({ spacingFromTip }));
  const [lastIdx, setLastIdx] = useState(null);
  const [quickVal, setQuickVal] = useState("");

  const prev = lastIdx != null ? Number(guides[lastIdx]?.spacingFromTip ?? 0) : null;
  const delta = prev != null && quickVal !== "" ? Number(quickVal) - prev : null;

  const logQuick = () => {
    const nextIdx = lastIdx == null ? 0 : Math.min(lastIdx + 1, guides.length - 1);
    onUpdateGuide(nextIdx, { spacingFromTip: Number(quickVal) });
    setLastIdx(nextIdx);
    setQuickVal("");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117] text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
        <p className="text-lg font-semibold text-cyan-300">Bench Mode</p>
        <button type="button" onClick={onExit} className="min-h-[48px] rounded-xl bg-slate-700 px-6 text-base font-semibold">
          Exit Bench Mode
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">{build?.buildName || build?.name || "Active build"}</h2>
          <p className="text-slate-400 text-base">Guide spacing — large entry</p>
        </section>

        <div className="space-y-3">
          {guides.map((g, idx) => (
            <label key={idx} className="block">
              <span className="text-base text-slate-400">Guide {idx + 1} — from tip (in)</span>
              <input
                type="number"
                inputMode="decimal"
                className="mt-2 w-full min-h-[56px] rounded-xl border-2 border-cyan-500/40 bg-slate-950 px-4 text-2xl font-mono"
                value={g.spacingFromTip ?? ""}
                onChange={(e) => onUpdateGuide(idx, { spacingFromTip: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>

        <section className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-4">
          <p className="text-lg font-medium text-cyan-300">Quick Log</p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Measurement"
            className="mt-3 w-full min-h-[56px] rounded-xl border border-slate-600 bg-slate-950 px-4 text-2xl"
            value={quickVal}
            onChange={(e) => setQuickVal(e.target.value)}
          />
          {delta != null && (
            <p className="mt-3 text-2xl text-emerald-400">Δ from previous: {delta > 0 ? "+" : ""}{delta.toFixed(3)}"</p>
          )}
          <button type="button" onClick={logQuick} className="mt-4 min-h-[48px] w-full rounded-xl bg-cyan-500 text-lg font-bold text-slate-950">
            Log & next guide
          </button>
        </section>
      </main>
    </div>
  );
}
