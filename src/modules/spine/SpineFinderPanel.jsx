import { useMemo, useState } from "react";
import { computeSpineRecommendation } from "../../data/buildRecord.js";

export default function SpineFinderPanel({ build, onSave }) {
  const [step, setStep] = useState(1);
  const [intervalIn, setIntervalIn] = useState(6);
  const [sections, setSections] = useState(build?.spineProfile?.sections || []);

  const { dominantDegrees, recommendation } = useMemo(() => computeSpineRecommendation(sections), [sections]);

  const blankLengthIn = 87;
  const markCount = Math.max(1, Math.floor(blankLengthIn / Math.max(Number(intervalIn) || 6, 1)) + 1);

  if (!build) {
    return (
      <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-sm text-slate-400">
        Open a build to use the Spine Finder.
      </article>
    );
  }

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { mark: prev.length * intervalIn, inchesFromButt: prev.length * intervalIn, degrees: 0, deflection: "" },
    ]);
  };

  const reset = () => {
    setSections([]);
    setStep(1);
  };

  const save = () => {
    onSave({
      spineProfile: {
        sections,
        dominantDegrees,
        recommendation,
        completed: sections.length > 0,
        intervalIn,
      },
      blankArchitecture: { ...(build.blankArchitecture || {}), spineAxis: dominantDegrees },
    });
  };

  return (
    <article className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Spine Finder / Flex Profile</p>
      <h3 className="text-lg font-semibold text-white">Guided Spine Detection</h3>

      <div className="mt-4 flex gap-2 text-xs">
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className={`rounded-full px-2 py-0.5 ${step === s ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
            Step {s}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-400">Mark the blank every {intervalIn} inches from butt to tip ({markCount} marks).</p>
          <label className="text-xs text-slate-500">
            Interval (in)
            <input type="number" className="mt-1 w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm" value={intervalIn} onChange={(e) => setIntervalIn(Number(e.target.value))} />
          </label>
          <button type="button" onClick={() => { addSection(); setStep(2); }} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Start marking sections
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-400">Enter deflection and spine orientation per section.</p>
          {sections.map((sec, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3 sm:grid-cols-3">
              <span className="text-xs text-slate-500">@ {sec.inchesFromButt}" from butt</span>
              <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm" placeholder="Deflection (in)" value={sec.deflection} onChange={(e) => setSections((arr) => arr.map((x, i) => (i === idx ? { ...x, deflection: e.target.value } : x)))} />
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="360" value={sec.degrees} onChange={(e) => setSections((arr) => arr.map((x, i) => (i === idx ? { ...x, degrees: Number(e.target.value) } : x)))} className="flex-1 accent-cyan-400" />
                <span className="w-10 text-xs text-cyan-300">{sec.degrees}°</span>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSection} className="text-xs text-cyan-300">
            + Add section
          </button>
          <button type="button" onClick={() => setStep(3)} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Review log
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 text-left">Section</th>
                <th className="text-left">Deflection</th>
                <th className="text-left">Degrees</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-2">{s.inchesFromButt}"</td>
                  <td>{s.deflection || "—"}</td>
                  <td className="text-cyan-300">{s.degrees}°</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => setStep(4)} className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            View recommendation
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-300">Dominant spine: {dominantDegrees}°</p>
          <p className="mt-2 text-sm text-slate-200">{recommendation}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
              Save to build record
            </button>
            <button type="button" onClick={reset} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
              Reset Spine Log
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
