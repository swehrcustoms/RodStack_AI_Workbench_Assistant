import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";

const ROD_TYPES = ["ice", "freshwater", "inshore", "fly"];

function rodTypeOf(build) {
  const t = (build.rodType || build.blankArchitecture?.rodType || "freshwater").toLowerCase();
  return ROD_TYPES.includes(t) ? t : "freshwater";
}

function marginPct(cost, sell) {
  if (!sell) return 0;
  return Math.round(((sell - cost) / sell) * 100);
}

export default function ProfitDashboard() {
  const { data } = useRodStackData();
  const builds = data.builds || [];

  const metrics = useMemo(() => {
    const byType = Object.fromEntries(ROD_TYPES.map((t) => [t, { costs: [], sells: [], durations: [] }]));
    const monthly = {};
    const now = new Date();

    builds.forEach((b) => {
      const type = rodTypeOf(b);
      const cost = Number(b.costEstimate?.totalCost ?? b.costSnapshot?.materials ?? b.materialCost ?? 0);
      const sell = Number(b.costEstimate?.sellPrice ?? b.costSnapshot?.sell ?? b.quoteTotal ?? 0);
      if (cost) byType[type].costs.push(cost);
      if (sell) byType[type].sells.push(sell);

      const ts = Object.values(b.stageTimestamps || {}).filter(Boolean).sort();
      if (ts.length >= 2) {
        const start = new Date(ts[0]).getTime();
        const end = new Date(ts[ts.length - 1]).getTime();
        if (end > start) byType[type].durations.push((end - start) / 3600000);
      }

      const monthKey = (b.completedAt || b.updatedAt || b.createdAt || "").slice(0, 7);
      if (monthKey) {
        monthly[monthKey] = monthly[monthKey] || { revenue: 0, cost: 0 };
        monthly[monthKey].revenue += sell;
        monthly[monthKey].cost += cost;
      }
    });

    const avg = (arr) => (arr.length ? arr.reduce((a, x) => a + x, 0) / arr.length : 0);

    const typeCards = ROD_TYPES.map((t) => ({
      type: t,
      avgCost: avg(byType[t].costs),
      avgSell: avg(byType[t].sells),
      margin: marginPct(avg(byType[t].costs), avg(byType[t].sells)),
      avgBuildHr: avg(byType[t].durations),
    }));

    const profitable = builds
      .map((b) => ({
        name: b.buildName || b.name,
        margin: marginPct(Number(b.costEstimate?.totalCost ?? b.costSnapshot?.materials ?? 0), Number(b.costEstimate?.sellPrice ?? b.costSnapshot?.sell ?? 0)),
        sell: Number(b.costEstimate?.sellPrice ?? b.costSnapshot?.sell ?? 0),
      }))
      .filter((x) => x.sell > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 3);

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ month: key, revenue: monthly[key]?.revenue || 0, cost: monthly[key]?.cost || 0 });
    }

    const thisMonth = months[months.length - 1]?.month;
    const monthRev = monthly[thisMonth]?.revenue || 0;
    const monthCost = monthly[thisMonth]?.cost || 0;

    return { typeCards, profitable, months, monthRev, monthCost };
  }, [builds]);

  if (!builds.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-600 p-10 text-center text-slate-400">
        <p className="text-white">No build data for analytics</p>
        <p className="mt-2 text-sm">Save builds with cost estimates and CRM stage timestamps to populate this dashboard.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-500">Revenue (this month)</p>
          <p className="text-2xl font-semibold text-cyan-300">${metrics.monthRev.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-500">Cost (this month)</p>
          <p className="text-2xl font-semibold text-slate-200">${metrics.monthCost.toFixed(0)}</p>
        </div>
      </div>

      <div className="h-64 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
        <p className="mb-2 text-xs uppercase text-slate-500">Revenue vs cost (12 mo)</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={metrics.months}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
            <Bar dataKey="revenue" fill="#22d3ee" name="Revenue" />
            <Bar dataKey="cost" fill="#64748b" name="Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {metrics.typeCards.map((c) => (
          <div key={c.type} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm">
            <p className="capitalize text-cyan-300">{c.type}</p>
            <p className="mt-2 text-slate-400">Avg material: ${c.avgCost.toFixed(0)}</p>
            <p className="text-slate-400">Avg sell: ${c.avgSell.toFixed(0)}</p>
            <p className="text-slate-400">Gross margin: {c.margin}%</p>
            <p className="text-slate-500">Avg build: {c.avgBuildHr.toFixed(1)} hr</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
        <p className="text-xs uppercase text-slate-500">Top 3 builds by margin</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {metrics.profitable.map((p) => (
            <li key={p.name}>{p.name} — {p.margin}% margin</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
