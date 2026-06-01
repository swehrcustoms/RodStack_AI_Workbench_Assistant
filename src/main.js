import React, { useMemo, useState, useEffect } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import {
  Search,
  FlaskConical,
  Wrench,
  Gauge,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Fish,
  Globe,
} from "https://esm.sh/lucide-react@0.469.0";

const STORAGE_KEY = "rodstack.v1.state";

const speciesList = ["Panfish", "Walleye", "Bass", "Northern", "Musky"];
const techniqueSeed = [
  "LiveScope Vertical Jigging",
  "Deep Football Dragging",
  "Big Rubber Musky",
  "Walleye Hair Jig",
  "Musky Big Rubber",
  "Panfish Ice Noodle",
];

const defaultBlueprint = {
  sku: "TRN-73M-CRK-001",
  version: "Deep Water Football Jig Master (v1.2)",
  species: "Bass",
  technique: "Deep Football Dragging",
  foundation: {
    brand_model: "Thorne Precision MX73 Graphite",
    length: "7'3\"",
    action: "Fast",
    power: "Medium",
    lure_window: "3/8 - 3/4",
    line_window: "10 - 17",
    spine_axis: 182,
    tip_size: 5.5,
    raw_blank_weight: 1.88,
    total_completed_weight: 3.62,
  },
  fulcrum: {
    grip_style: "Split-Grip",
    grip_material: "Super Grade Cork",
    rear_grip_length: 10.5,
    foregrip_length: 2.25,
    reel_seat_model: "Fuji ACSM 16",
    hood_config: "Up-Locking",
    arbor_material: "Carbon Mesh Arbor",
  },
  apex: {
    guide_count: 10,
    frame_material: "Titanium",
    ring_material: "SiC",
    stripper_distance_to_reel: 20,
    spacing_array: [4, 4.5, 5.25, 6, 6.6, 7.2, 8, 8.8, 9.5, 10.2],
  },
  qc: {
    static_flex_curve_validation: true,
    temperature: 69,
    relative_humidity: 43,
  },
};

const shortcutCards = [
  { label: "Walleye Hair Jig", species: "Walleye", technique: "Walleye Hair Jig" },
  { label: "Musky Big Rubber", species: "Musky", technique: "Musky Big Rubber" },
  { label: "Panfish Ice Noodle", species: "Panfish", technique: "Panfish Ice Noodle" },
];

const manufacturerMocks = [
  "https://www.edgerods.com/models/precision-73",
  "https://www.thornebros.com/custom-blank-guide",
  "https://www.elliottrods.com/midwest-vertical",
];

function parseNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cardClass(color = "cyan") {
  const palette = {
    cyan: "border-workshop-cyan/25",
    cobalt: "border-workshop-cobalt/25",
    purple: "border-workshop-purple/25",
    emerald: "border-workshop-emerald/25",
  };
  return `rounded-2xl border bg-workshop-slate/85 p-5 shadow-glow ${palette[color]}`;
}

function SectionTitle({ icon: Icon, title, subtitle, accent }) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-workshop-muted">{subtitle}</p>
        <h3 className="mt-1 text-lg font-semibold text-workshop-text">{title}</h3>
      </div>
      <div className={`rounded-xl p-2 ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? "border-workshop-cyan bg-workshop-cyan/15 text-workshop-cyan"
          : "border-white/10 bg-white/5 text-workshop-muted hover:border-workshop-cobalt/50 hover:text-workshop-text"
      }`}
    >
      {children}
    </button>
  );
}

function App() {
  const [route, setRoute] = useState("landing");
  const [searchQuery, setSearchQuery] = useState("");
  const [extractionUrl, setExtractionUrl] = useState(manufacturerMocks[0]);
  const [extracting, setExtracting] = useState(false);

  const [wizard, setWizard] = useState({
    step: 1,
    targets: [],
    platform: "Spinning Platform Layouts",
    account: { workshopName: "", email: "", password: "" },
  });

  const [blueprint, setBlueprint] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultBlueprint;
    } catch {
      return defaultBlueprint;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
  }, [blueprint]);

  const filteredTechniques = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return techniqueSeed;
    return techniqueSeed.filter((item) => item.toLowerCase().includes(q));
  }, [searchQuery]);

  const netComponentWeight = useMemo(() => {
    const total = parseNumber(blueprint.foundation.total_completed_weight);
    const blank = parseNumber(blueprint.foundation.raw_blank_weight);
    return Math.max(total - blank, 0).toFixed(2);
  }, [blueprint.foundation.total_completed_weight, blueprint.foundation.raw_blank_weight]);

  const spacingRows = useMemo(() => {
    return blueprint.apex.spacing_array.map((distance, index) => {
      const previous = index === 0 ? 0 : blueprint.apex.spacing_array[index - 1];
      return {
        guide: index + 1,
        distance,
        delta: (parseNumber(distance) - parseNumber(previous)).toFixed(2),
      };
    });
  }, [blueprint.apex.spacing_array]);

  function updateBlueprint(path, value) {
    const keys = path.split(".");
    setBlueprint((prev) => {
      const clone = structuredClone(prev);
      let cursor = clone;
      for (let i = 0; i < keys.length - 1; i += 1) cursor = cursor[keys[i]];
      cursor[keys[keys.length - 1]] = value;
      if (path.startsWith("apex.spacing_array")) {
        clone.apex.guide_count = clone.apex.spacing_array.length;
      }
      return clone;
    });
  }

  function seedFromShortcut(card) {
    setSearchQuery(card.technique);
    setBlueprint((prev) => ({
      ...prev,
      species: card.species,
      technique: card.technique,
    }));
    setRoute("bench");
  }

  function runExtraction() {
    setExtracting(true);
    window.setTimeout(() => {
      setBlueprint({
        sku: "MWV-68ML-SPN-002",
        version: "Midwest Vertical Precision (v2.0)",
        species: "Walleye",
        technique: "LiveScope Vertical Jigging",
        foundation: {
          brand_model: "Edge Delta Vertical 68ML",
          length: "6'8\"",
          action: "X-Fast",
          power: "Medium-Light",
          lure_window: "1/8 - 3/8",
          line_window: "6 - 10",
          spine_axis: 177,
          tip_size: 4.5,
          raw_blank_weight: 1.42,
          total_completed_weight: 2.75,
        },
        fulcrum: {
          grip_style: "Tennessee",
          grip_material: "Carbon Sleeve",
          rear_grip_length: 9.25,
          foregrip_length: 0,
          reel_seat_model: "Hidden Tennessee Wrap",
          hood_config: "Down-Locking",
          arbor_material: "Graphite Mesh",
        },
        apex: {
          guide_count: 9,
          frame_material: "Stainless",
          ring_material: "Alconite",
          stripper_distance_to_reel: 18.5,
          spacing_array: [3.75, 4.2, 4.9, 5.5, 6.1, 6.8, 7.6, 8.4, 9.1],
        },
        qc: {
          static_flex_curve_validation: true,
          temperature: 68,
          relative_humidity: 41,
        },
      });
      setRoute("bench");
      setExtracting(false);
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-workshop-deep to-workshop-slate px-4 pb-10 text-workshop-text sm:px-8">
      <header className="mx-auto mb-8 mt-4 flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-workshop-slate/70 p-4 shadow-glow">
        <div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-white">RODSTACK</h1>
          <p className="text-xs text-workshop-muted">Engineering Workshop Utility Software</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <NavButton active={route === "landing"} onClick={() => setRoute("landing")}>
            Lineup Explorer
          </NavButton>
          <NavButton active={route === "wizard"} onClick={() => setRoute("wizard")}>
            Blank Directory
          </NavButton>
          <NavButton active={route === "bench"} onClick={() => setRoute("bench")}>
            Launch Live Bench
          </NavButton>
          <NavButton active={route === "scraper"} onClick={() => setRoute("scraper")}>
            AI Scraper Portal
          </NavButton>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl">
        {route === "landing" && (
          <section className="space-y-6">
            <div className={cardClass("cobalt")}>
              <p className="text-sm uppercase tracking-[0.2em] text-workshop-muted">Hero Unit</p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                Engineer the Perfect Build. Repeat the Performance.
              </h2>
              <p className="mt-3 max-w-3xl text-sm text-workshop-muted">
                An AI-driven technical specification workspace built for custom rod smiths. Extract web data,
                calculate guide spacing trains, and log exact physics benchmarks for repeatable premium production
                runs.
              </p>
            </div>

            <div className={cardClass("cyan")}>
              <SectionTitle
                icon={Search}
                title="Global Search Engine"
                subtitle="No Authentication Required"
                accent="bg-workshop-cyan/15 text-workshop-cyan"
              />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 text-workshop-muted" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by species or technique (e.g., Walleye, Musky Big Rubber)..."
                  className="w-full rounded-xl border border-white/10 bg-workshop-deep px-10 py-3 text-sm text-white outline-none ring-workshop-cyan/50 transition focus:ring-2"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {speciesList.map((species) => (
                  <button
                    key={species}
                    onClick={() => setSearchQuery(species)}
                    className="rounded-lg border border-workshop-purple/30 bg-workshop-purple/10 px-3 py-1 text-xs text-workshop-purple hover:bg-workshop-purple/20"
                  >
                    {species}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTechniques.length ? (
                  filteredTechniques.map((item) => (
                    <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-workshop-muted">No matching techniques found.</p>
                )}
              </div>
            </div>

            <div className={cardClass("purple")}>
              <SectionTitle
                icon={Fish}
                title="Technique Shortcut Grid"
                subtitle="One-Click Workspace Seed"
                accent="bg-workshop-purple/15 text-workshop-purple"
              />
              <div className="grid gap-3 md:grid-cols-3">
                {shortcutCards.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => seedFromShortcut(card)}
                    className="rounded-xl border border-workshop-purple/30 bg-workshop-deep p-4 text-left hover:bg-workshop-purple/10"
                  >
                    <p className="text-sm font-semibold">{card.label}</p>
                    <p className="mt-1 text-xs text-workshop-muted">{card.species}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {route === "wizard" && (
          <section className={cardClass("cobalt")}>
            <SectionTitle
              icon={Sparkles}
              title="Interactive Onboarding Wizard"
              subtitle={`Step ${wizard.step} of 3`}
              accent="bg-workshop-cobalt/15 text-workshop-cobalt"
            />

            {wizard.step === 1 && (
              <div>
                <p className="mb-4 text-sm text-workshop-muted">Select target species applications for your shop.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {["Walleye", "Panfish", "Muskellunge", "Bass", "Northern Pike"].map((target) => {
                    const active = wizard.targets.includes(target);
                    return (
                      <button
                        key={target}
                        onClick={() =>
                          setWizard((prev) => ({
                            ...prev,
                            targets: active ? prev.targets.filter((t) => t !== target) : [...prev.targets, target],
                          }))
                        }
                        className={`rounded-xl border p-4 text-left ${
                          active
                            ? "border-workshop-cyan bg-workshop-cyan/10"
                            : "border-white/10 bg-workshop-deep hover:border-workshop-cyan/40"
                        }`}
                      >
                        <p className="font-medium">{target}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {wizard.step === 2 && (
              <div>
                <p className="mb-4 text-sm text-workshop-muted">Set your default production archetype.</p>
                <select
                  value={wizard.platform}
                  onChange={(e) => setWizard((prev) => ({ ...prev, platform: e.target.value }))}
                  className="w-full max-w-xl rounded-xl border border-white/10 bg-workshop-deep px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-workshop-cobalt/60"
                >
                  <option>Spinning Platform Layouts</option>
                  <option>Casting Platform Layouts</option>
                  <option>Solid Glass Ice Builds</option>
                </select>
              </div>
            )}

            {wizard.step === 3 && (
              <div className="max-w-2xl rounded-2xl border border-workshop-emerald/30 bg-workshop-deep p-5">
                <p className="mb-4 text-sm text-workshop-muted">Generate your workshop account credentials.</p>
                <div className="grid gap-3">
                  {[
                    ["workshopName", "Workshop Name", "Northline Rod Lab"],
                    ["email", "Email", "owner@northlinebuilds.com"],
                    ["password", "Secure Password", "••••••••••••"],
                  ].map(([key, label, placeholder]) => (
                    <label key={key} className="text-sm">
                      <span className="mb-1 block text-workshop-muted">{label}</span>
                      <input
                        type={key === "password" ? "password" : "text"}
                        value={wizard.account[key]}
                        placeholder={placeholder}
                        onChange={(e) =>
                          setWizard((prev) => ({ ...prev, account: { ...prev.account, [key]: e.target.value } }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-workshop-slate px-3 py-2 text-white outline-none focus:ring-2 focus:ring-workshop-emerald/50"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setWizard((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }))}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-workshop-muted hover:text-white"
              >
                Previous
              </button>
              <button
                onClick={() => setWizard((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }))}
                className="rounded-lg bg-workshop-cobalt px-4 py-2 text-sm font-medium text-white hover:bg-workshop-cobalt/90"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {route === "bench" && (
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <article className={cardClass("cobalt")}>
                <SectionTitle
                  icon={FlaskConical}
                  title="Blank Architecture Card"
                  subtitle={`SKU ${blueprint.sku} | ${blueprint.version}`}
                  accent="bg-workshop-cobalt/15 text-workshop-cobalt"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["brand_model", "Brand / Model"],
                    ["length", "Length (ft/in)"],
                    ["action", "Action"],
                    ["power", "Power"],
                    ["lure_window", "Lure Window (oz)"],
                    ["line_window", "Line Window (lb)"],
                    ["spine_axis", "Spine Axis (deg)"],
                    ["tip_size", "Tip Size (tube factor)"],
                    ["raw_blank_weight", "Raw Blank Weight (oz)"],
                    ["total_completed_weight", "Total Completed Rod Weight (oz)"],
                  ].map(([key, label]) => (
                    <label key={key} className="text-xs text-workshop-muted">
                      {label}
                      <input
                        value={blueprint.foundation[key]}
                        onChange={(e) =>
                          updateBlueprint(
                            `foundation.${key}`,
                            ["spine_axis", "tip_size", "raw_blank_weight", "total_completed_weight"].includes(key)
                              ? parseNumber(e.target.value)
                              : e.target.value
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-workshop-deep px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-workshop-cobalt/50"
                      />
                    </label>
                  ))}
                </div>
              </article>

              <article className={cardClass("purple")}>
                <SectionTitle
                  icon={Wrench}
                  title="Handle Ergonomics Card"
                  subtitle="Fulcrum Assembly"
                  accent="bg-workshop-purple/15 text-workshop-purple"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["grip_style", "Grip Style"],
                    ["grip_material", "Grip Material"],
                    ["rear_grip_length", "Rear Grip Length (in)"],
                    ["foregrip_length", "Foregrip Length (in)"],
                    ["reel_seat_model", "Reel Seat Model"],
                    ["hood_config", "Hood Config"],
                    ["arbor_material", "Arbor Material"],
                  ].map(([key, label]) => (
                    <label key={key} className="text-xs text-workshop-muted">
                      {label}
                      <input
                        value={blueprint.fulcrum[key]}
                        onChange={(e) =>
                          updateBlueprint(
                            `fulcrum.${key}`,
                            ["rear_grip_length", "foregrip_length"].includes(key) ? parseNumber(e.target.value) : e.target.value
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-workshop-deep px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-workshop-purple/50"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-workshop-purple/30 bg-workshop-deep p-3 text-sm">
                  <p className="text-workshop-muted">Live Balance Readout</p>
                  <p className="mt-1 font-semibold text-workshop-purple">
                    {(parseNumber(blueprint.fulcrum.rear_grip_length) - parseNumber(blueprint.fulcrum.foregrip_length) * 0.4).toFixed(2)} in
                    rearward leverage factor
                  </p>
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              <article className={cardClass("cyan")}>
                <SectionTitle
                  icon={Gauge}
                  title="Dynamic Guide Spacing Matrix"
                  subtitle="Apex Guide Train"
                  accent="bg-workshop-cyan/15 text-workshop-cyan"
                />
                <div className="mb-3 grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-workshop-muted">
                  <span>Guide #</span>
                  <span>Distance from tip</span>
                  <span>Interval Delta</span>
                </div>
                <div className="space-y-2">
                  {spacingRows.map((row, index) => (
                    <div key={row.guide} className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border border-white/10 bg-workshop-deep px-2 py-2 text-sm">{row.guide}</div>
                      <input
                        value={row.distance}
                        onChange={(e) => {
                          const next = [...blueprint.apex.spacing_array];
                          next[index] = parseNumber(e.target.value);
                          updateBlueprint("apex.spacing_array", next);
                        }}
                        className="rounded-md border border-white/10 bg-workshop-deep px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-workshop-cyan/50"
                      />
                      <div className="rounded-md border border-white/10 bg-workshop-deep px-2 py-2 text-sm">{row.delta}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => updateBlueprint("apex.spacing_array", [...blueprint.apex.spacing_array, 10])}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-workshop-cyan/40 bg-workshop-cyan/10 px-3 py-2 text-sm text-workshop-cyan hover:bg-workshop-cyan/20"
                >
                  <PlusCircle size={16} />
                  Add Guide Row
                </button>
              </article>

              <article className={cardClass("emerald")}>
                <SectionTitle
                  icon={CheckCircle2}
                  title="Bench QC & Mass Analytics"
                  subtitle="Performance Validation"
                  accent="bg-workshop-emerald/15 text-workshop-emerald"
                />
                <p className="text-xs text-workshop-muted">Net Component Weight Formula</p>
                <p className="mt-1 text-lg font-semibold text-workshop-cyan">
                  Net Component Weight = Total Completed Rod Weight - Raw Blank Weight
                </p>
                <p className="mt-2 rounded-lg bg-workshop-deep px-3 py-2 text-xl font-bold text-workshop-emerald">
                  {netComponentWeight} oz
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-white/10 bg-workshop-deep p-3 text-sm">
                    <span>Static Flex Curve Validation</span>
                    <button
                      onClick={() =>
                        updateBlueprint("qc.static_flex_curve_validation", !blueprint.qc.static_flex_curve_validation)
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        blueprint.qc.static_flex_curve_validation
                          ? "bg-workshop-emerald/20 text-workshop-emerald"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {blueprint.qc.static_flex_curve_validation ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {blueprint.qc.static_flex_curve_validation ? "Pass" : "Fail"}
                    </button>
                  </label>

                  <label className="text-xs text-workshop-muted">
                    Ambient Temperature (F)
                    <input
                      value={blueprint.qc.temperature}
                      onChange={(e) => updateBlueprint("qc.temperature", parseNumber(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-workshop-deep px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-workshop-emerald/50"
                    />
                  </label>
                  <label className="text-xs text-workshop-muted">
                    Relative Humidity (%)
                    <input
                      value={blueprint.qc.relative_humidity}
                      onChange={(e) => updateBlueprint("qc.relative_humidity", parseNumber(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-workshop-deep px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-workshop-emerald/50"
                    />
                  </label>
                </div>
              </article>
            </aside>
          </section>
        )}

        {route === "scraper" && (
          <section className={cardClass("purple")}>
            <SectionTitle
              icon={Globe}
              title="AI Web Scraper & Extraction Portal"
              subtitle="Paste and Parse Manufacturer Profiles"
              accent="bg-workshop-purple/15 text-workshop-purple"
            />
            <p className="text-sm text-workshop-muted">
              Paste a URL from premium manufacturers and simulate AI extraction into a structured Trinity-engine blueprint.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={extractionUrl}
                onChange={(e) => setExtractionUrl(e.target.value)}
                placeholder="https://manufacturer.com/rod-spec"
                className="flex-1 rounded-xl border border-white/10 bg-workshop-deep px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-workshop-purple/50"
              />
              <button
                onClick={runExtraction}
                disabled={extracting}
                className="rounded-xl bg-workshop-purple px-5 py-3 text-sm font-medium text-white hover:bg-workshop-purple/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {extracting ? "Simulating Extraction..." : "Simulate AI Extraction"}
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-workshop-deep p-4 text-sm">
              <p className="mb-2 text-workshop-muted">Mock Sources</p>
              <ul className="space-y-1 text-white/90">
                {manufacturerMocks.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
              <pre className="mt-4 overflow-auto rounded-lg border border-workshop-purple/20 bg-workshop-slate p-3 text-xs text-workshop-muted">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
