import React, { useMemo, useState } from "react";
import {
  Search,
  Shield,
  Hand,
  TrendingUp,
  Fish,
  Calculator,
  Layers,
  CheckCircle2,
  GitBranch,
  Printer,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { buildGuideRows, computeNetComponentWeight, seededBlueprint } from "./data/seededBlueprint";
import RodStackFormsSuite from "./forms/RodStackFormsSuite.jsx";

const midwestTabs = [
  {
    id: "panfish",
    label: "Panfish",
    accent: "cyan",
    headline: "Ultra-light precision for open water and ice",
    bullets: [
      "Solid glass and carbon profiling for noodle-style ice builds",
      "Ultra-light open water tapers with micro-guide reduction trains",
      "Featherweight component mass tracking for sensitive bite transmission",
    ],
  },
  {
    id: "walleye",
    label: "Walleye",
    accent: "blue",
    headline: "Live sonar and vertical jigging calibration",
    bullets: [
      "Extra-fast vertical jigging blank architecture templates",
      "LiveScope pitching tool spacing with stripper offset modeling",
      "Hair jig and blade bait leverage point validation workflows",
    ],
  },
  {
    id: "bass-musky",
    label: "Bass & Muskellunge",
    accent: "purple",
    headline: "Heavy cover leverage and progressive loading",
    bullets: [
      "Structural tracking for heavy cover flipping and punching builds",
      "Progressive-loading extra-heavy configurations for massive rubber",
      "Bucktail and glide bait static bend optimization matrices",
    ],
  },
];

const trinityCards = [
  {
    number: "1",
    title: "Core Blank Foundation",
    icon: Shield,
    accent: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    iconWrap: "bg-cyan-500/15 text-cyan-300",
    copy: "Track the critical architecture before component glue finishes touch the carbon. Log raw weight metrics, precise spine refractivity, and exact tip/butt OD targets.",
  },
  {
    number: "2",
    title: "Ergonomic Fulcrum",
    icon: Hand,
    accent: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    iconWrap: "bg-blue-500/15 text-blue-300",
    copy: "Manage direct acoustic transmission. Record exact split-grip layouts, internal core polyurethane arbor styles, and direct-contact blank-exposed reel seat models.",
  },
  {
    number: "3",
    title: "Guide Train Apex",
    icon: TrendingUp,
    accent: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    iconWrap: "bg-purple-500/15 text-purple-300",
    copy: "Kill line friction completely. Build progressive guide reduction trains, model specific stripper face offsets, and map static loading bend configurations repeatably.",
  },
];

const pricingTiers = [
  {
    name: "Free Bench",
    price: "$0",
    cadence: "Forever",
    accent: "border-slate-600",
    cta: "Start Free",
    featured: false,
    features: [
      "Manual entry for up to 3 master rod models",
      "Basic spacing layout tools",
      "Standard build tracking logs",
    ],
  },
  {
    name: "Production Pro",
    price: "$7.99",
    cadence: "Month",
    accent: "border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.12)]",
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      "Unlimited master blueprints",
      "Version control tracking (v1.1, v1.2)",
      "Full AI web scraper profile ingestion",
      "Climate-controlled cure variables tracking",
    ],
  },
  {
    name: "Commercial Workshop",
    price: "$79",
    cadence: "Year",
    accent: "border-purple-500/40",
    cta: "Contact Sales",
    featured: false,
    features: [
      "Everything in Production Pro",
      "Priority API access for retail inventory sync",
      "Bulk component tracking tools",
      "Master specification catalog export",
    ],
  },
];

const quickFeatures = [
  { icon: Fish, label: "Panfish & Walleye", sub: "Light Jig Specialists", color: "text-cyan-300" },
  { icon: Calculator, label: "Physics Math", sub: "Guide Spacing Trains", color: "text-blue-300" },
  { icon: Layers, label: "Midwest Lineups", sub: "Bass, Pike & Musky", color: "text-purple-300" },
];

function MarketingLanding({ onLaunchBench, onNavigate, onSignIn, onOpenForms }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("walleye");

  const guideRows = useMemo(
    () => buildGuideRows(seededBlueprint.guideTrain.spacingArray),
    []
  );
  const netWeight = useMemo(() => computeNetComponentWeight(seededBlueprint), []);
  const previewRows = guideRows.slice(0, 5);

  const activeMidwest = midwestTabs.find((tab) => tab.id === activeTab) ?? midwestTabs[1];

  const scrollToPricing = () => {
    document.getElementById("pricing-matrix")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-0">
      {/* ── Sticky marketing nav ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0b111e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
            <img
              src="/RodStack Logo V2.png"
              alt="RodStack"
              className="hidden h-9 w-auto bg-transparent sm:block"
            />
            <img
              src="/RS Logo.png"
              alt="RodStack"
              className="h-8 w-8 bg-transparent sm:hidden"
            />
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: "Lineup Explorer", view: "landing" },
              { label: "Blank Directory", view: "onboarding" },
              { label: "Component Database", view: "bench" },
              { label: "AI Scraping Portal", view: "scraper" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.view)}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="hidden text-sm text-slate-300 transition hover:text-white sm:inline"
            >
              Sign In
            </button>
            <button
              onClick={onLaunchBench}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Launch Live Bench
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/RodStack Logo V1.png"
              alt="RodStack Engineering Ecosystem"
              className="h-16 w-auto bg-transparent sm:h-20"
            />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
            <Sparkles size={14} />
            AI-Driven Craftsmanship
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            ENGINEER THE PERFECT BUILD.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              REPEAT THE PERFORMANCE.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            An AI-driven technical specification workspace built for custom rod smiths. Extract web data,
            calculate guide spacing trains, and log exact physics benchmarks for repeatable premium production runs.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onLaunchBench}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Launch Free Live Bench
              <ArrowRight size={16} />
            </button>
            <button
              onClick={scrollToPricing}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3.5 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
            >
              Explore Premium Tiers
            </button>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 shadow-glow">
              <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
                <Search size={18} className="shrink-0 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Midwest species or technique (e.g., Walleye Vertical Jigging)"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={onLaunchBench}
                className="shrink-0 bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Analyze Spec
              </button>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            {quickFeatures.map(({ icon: Icon, label, sub, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-left"
              >
                <Icon size={18} className={color} />
                <div>
                  <p className="text-xs font-medium text-white">{label}</p>
                  <p className="text-[11px] text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trinity Engine ── */}
      <section className="border-t border-slate-800/60 bg-[#0f172a]/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">The Trinity Engine</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Built for the Workshop Bench</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              RodStack optimizes the physical layout of every custom build across three core database tiers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {trinityCards.map(({ number, title, icon: Icon, accent, iconWrap, copy }) => (
              <article
                key={title}
                className={`rounded-2xl border p-6 transition hover:translate-y-[-2px] ${accent}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-xl p-3 ${iconWrap}`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-xs font-mono text-slate-500">{number}.</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Midwest technique tabs ── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Midwest Feature Matrix</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Technique Optimization Highlights</h2>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {midwestTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8">
            <h3 className="text-xl font-semibold text-white">{activeMidwest.headline}</h3>
            <ul className="mt-6 space-y-4">
              {activeMidwest.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {bullet}
                </li>
              ))}
            </ul>
            <button
              onClick={onLaunchBench}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              Open technique workspace
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Spec preview banner ── */}
      <section className="border-y border-slate-800/60 bg-[#0f172a]/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live Blueprint Preview</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Technical Specification Dashboard</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-300">
                  SKU: {seededBlueprint.sku}
                </span>
                <h3 className="text-lg font-semibold text-white">
                  {seededBlueprint.name}{" "}
                  <span className="text-sm font-normal text-slate-500">{seededBlueprint.version}</span>
                </h3>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                  <GitBranch size={14} />
                  Create Revision Branch
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">
                  <Printer size={14} />
                  Export Shop Sheet
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-5">
              <div className="space-y-0 border-slate-700 lg:col-span-3 lg:border-r">
                <div className="border-b border-slate-700 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-cyan-300" />
                      <h4 className="text-sm font-semibold text-white">Core Blank Architecture</h4>
                    </div>
                    <span className="text-[11px] italic text-slate-500">Validated Pre-assembly</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Brand & Model</p>
                      <p className="mt-1 text-sm font-medium text-cyan-300">{seededBlueprint.blankArchitecture.blankMaterial}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Raw Weight</p>
                      <p className="mt-1 text-sm font-medium text-cyan-300">
                        {seededBlueprint.blankArchitecture.rawBlankWeight} oz
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Dimensions / Action</p>
                      <p className="mt-1 text-sm text-white">
                        {seededBlueprint.blankArchitecture.length} / {seededBlueprint.blankArchitecture.action} /{" "}
                        {seededBlueprint.blankArchitecture.power}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Line / Lure Window</p>
                      <p className="mt-1 text-sm text-white">
                        {seededBlueprint.blankArchitecture.lineWindow} / {seededBlueprint.blankArchitecture.lureWindow}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Technique</p>
                      <p className="mt-1 text-sm text-white">{seededBlueprint.technique}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Tip / Butt OD</p>
                      <p className="mt-1 text-sm text-white">
                        {seededBlueprint.blankArchitecture.tipTube} Tube / {seededBlueprint.blankArchitecture.buttOD}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Hand size={16} className="text-blue-300" />
                    <h4 className="text-sm font-semibold text-white">Handle & Ergonomic Assembly</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Grip Style</p>
                      <p className="mt-1 text-sm text-white">{seededBlueprint.handleAssembly.gripStyle}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Reel Seat</p>
                      <p className="mt-1 text-sm text-white">{seededBlueprint.handleAssembly.reelSeatModel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Rear Grip</p>
                      <p className="mt-1 text-sm text-blue-300">
                        {seededBlueprint.handleAssembly.rearGripMaterial} / {seededBlueprint.handleAssembly.rearGripLength}"
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Foregrip</p>
                      <p className="mt-1 text-sm text-blue-300">
                        {seededBlueprint.handleAssembly.foreGripMaterial} / {seededBlueprint.handleAssembly.foreGripLength}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-0 lg:col-span-2">
                <div className="border-b border-slate-700 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-purple-300" />
                      <h4 className="text-sm font-semibold text-white">Guide Spacing Matrix</h4>
                    </div>
                    <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                      {guideRows.length - 1} Guides + Tip
                    </span>
                  </div>

                  <div className="mb-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                    <span>Guide #</span>
                    <span>Distance</span>
                    <span>Interval</span>
                  </div>
                  <div className="space-y-1.5">
                    {previewRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-3 gap-2 text-xs">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="font-mono text-purple-200">{row.distance.toFixed(2)}"</span>
                        <span className="font-mono text-slate-500">
                          {row.delta == null ? "N/A" : `${row.delta.toFixed(2)}"`}
                        </span>
                      </div>
                    ))}
                    {guideRows.length > 5 && (
                      <p className="pt-1 text-[11px] text-slate-500">
                        … through Guide 8 at {guideRows[8]?.distance.toFixed(2)}"
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Stripper offset: {seededBlueprint.guideTrain.stripperDistanceToReel}" ·{" "}
                    {seededBlueprint.guideTrain.frameMaterial} / {seededBlueprint.guideTrain.ringMaterial}
                  </p>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <h4 className="text-sm font-semibold text-white">Bench QC & Mass Analytics</h4>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <p className="text-[11px] text-slate-400">
                      Net Component Weight = Total Completed Rod Weight − Raw Blank Weight
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-300">
                      +{netWeight?.toFixed(2) ?? "—"} oz Net Components
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Total Final Weight</p>
                      <p className="mt-0.5 font-medium text-white">
                        {seededBlueprint.blankArchitecture.totalCompletedRodWeight} oz
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Leverage Point</p>
                      <p className="mt-0.5 font-medium text-white">
                        {seededBlueprint.qualityControl.leveragePointTarget}" forward of stem
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-[11px] text-emerald-300">
                      Static Flex Curve Validation Cleared (Zero Blank Contact)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onLaunchBench}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Open This Blueprint in Live Bench
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing matrix ── */}
      <section id="pricing-matrix" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Commercial Studio</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Premium Pricing Matrix</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Scale from bench-side manual entry to full commercial workshop inventory synchronization.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <article
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border bg-slate-900/70 p-6 ${tier.accent} ${
                  tier.featured ? "scale-[1.02] md:-mt-2 md:mb-2" : ""
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-sm text-slate-500">/ {tier.cadence}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={tier.featured ? onLaunchBench : scrollToPricing}
                  className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition ${
                    tier.featured
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "border border-slate-600 text-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tier.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signup & support forms ── */}
      <section className="border-t border-slate-800 bg-[#0b111e] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Workshop Access</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Create Your RodStack Account</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Register your shop, submit support tickets, and request features — every submission is logged to your workshop database.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <RodStackFormsSuite embedded initialTab="signup" showHeader={false} />
        </div>
        <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenForms?.("support")}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
          >
            Support Request
          </button>
          <button
            type="button"
            onClick={() => onOpenForms?.("feature")}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/20"
          >
            Feature Request
          </button>
          <button
            type="button"
            onClick={() => onOpenForms?.("email")}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20"
          >
            Welcome Email Tools
          </button>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="border-t border-slate-800 bg-[#0b111e] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <img src="/RodStack Logo V2.png" alt="RodStack" className="mx-auto h-10 w-auto bg-transparent opacity-80" />
          <h2 className="mt-6 text-2xl font-bold text-white">Ready to engineer your next production run?</h2>
          <p className="mt-3 text-sm text-slate-400">
            Join custom rod smiths using RodStack to document, validate, and repeat premium builds with physics-grade precision.
          </p>
          <button
            onClick={onLaunchBench}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Launch Free Live Bench
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-center text-xs text-slate-600">
          © 2026 RodStack Engineering Ecosystem. Built for custom rod smiths. Prototype scaffold — mocked data only.
        </p>
      </section>
    </div>
  );
}

export default MarketingLanding;
