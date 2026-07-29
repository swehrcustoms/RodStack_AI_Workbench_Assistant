import { useEffect, useState } from "react";
import { EPOXY_PRODUCTS, adjustCureHours } from "../../data/buildRecord.js";

export default function CureTrackerPanel({ build, onSave }) {
  const log = build?.cureLog || { productId: "flexcoat", temperature: 70, humidity: 45, coats: [] };
  const [productId, setProductId] = useState(log.productId || "flexcoat");
  const [temperature, setTemperature] = useState(log.temperature ?? 70);
  const [humidity, setHumidity] = useState(log.humidity ?? 45);
  const [coats, setCoats] = useState(log.coats || []);

  const product = EPOXY_PRODUCTS.find((p) => p.id === productId) || EPOXY_PRODUCTS[0];
  const adjustedCureHr = adjustCureHours(product?.baseCureHr || 24, temperature, humidity);
  const recoatMin = Math.round((product?.recoatMin || 60) * (humidity > 55 ? 1.15 : 1));

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  if (!build) {
    return (
      <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-sm text-slate-400">
        Open a build to use the Cure Tracker.
      </article>
    );
  }

  const logCoat = () => {
    const coat = {
      id: `coat-${Date.now()}`,
      appliedAt: new Date().toISOString(),
      temperature,
      humidity,
      recoatOpensAt: new Date(Date.now() + recoatMin * 60000).toISOString(),
      cureCompleteAt: new Date(Date.now() + adjustedCureHr * 3600000).toISOString(),
    };
    const next = [...coats, coat];
    setCoats(next);
    onSave?.({
      cureLog: { productId, temperature, humidity, coats: next },
      qualityControl: {
        ...(build.qualityControl || {}),
        ambientTemperature: temperature,
        relativeHumidity: humidity,
        cureWindowHours: adjustedCureHr,
      },
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      setTimeout(() => {
        new Notification("RodStack Cure Window", {
          body: `Recoat window open for ${build.buildName || build.name || "build"}`,
        });
      }, recoatMin * 60000);
    }
  };

  return (
    <article className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Epoxy / Finish Cure Tracker</p>
      <h3 className="text-lg font-semibold text-white">Multi-Stage Cure Timeline</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-400">
          Product
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {EPOXY_PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Temp (°F)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-400">
          Humidity (%)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Pot life ~{product?.potLifeMin ?? "—"} min · Recoat window ~{recoatMin} min · Adjusted full cure ~
        {adjustedCureHr} hr
      </p>

      <button
        type="button"
        onClick={logCoat}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Log Coat Applied
      </button>

      <div className="mt-4 space-y-2">
        {coats.length === 0 && (
          <p className="text-sm text-slate-500">
            No coats logged — apply finish and log each coat for countdown tracking.
          </p>
        )}
        {coats.map((c, i) => (
          <div key={c.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
            <p className="font-medium text-white">Coat {i + 1}</p>
            <p>Applied: {new Date(c.appliedAt).toLocaleString()}</p>
            <p>Recoat opens: {new Date(c.recoatOpensAt).toLocaleString()}</p>
            <p>Cure complete: {new Date(c.cureCompleteAt).toLocaleString()}</p>
            <p className="text-slate-500">
              {c.temperature}°F · {c.humidity}% RH
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
