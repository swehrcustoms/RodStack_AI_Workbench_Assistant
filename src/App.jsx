import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Wrench,
  LayoutDashboard,
  Rocket,
  Fish,
  PlusCircle,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Ruler,
  Scale,
  FlaskConical,
  Gauge,
  Link as LinkIcon,
  Home,
  ClipboardList,
} from "lucide-react";
import MarketingLanding from "./MarketingLanding.jsx";
import RodStackFormsSuite from "./forms/RodStackFormsSuite.jsx";
import SignupForm from "./forms/SignupForm.jsx";
import { seededBlueprint } from "./data/seededBlueprint.js";

const STORAGE_KEY = "rodstack.app.v2";

const speciesOptions = ["Walleye", "Panfish", "Muskellunge", "Bass", "Northern Pike"];
const platformOptions = ["Spinning", "Casting", "Ice"];
const searchTags = [
  "LiveScope Jigging",
  "Big Rubber",
  "Panfish Ice Noodle",
  "Deep Football Dragging",
  "Hair Jig Walleye",
];

const shortcutCards = [
  { label: "Walleye Hair Jig", species: "Walleye", technique: "Hair Jig Walleye" },
  { label: "Musky Big Rubber", species: "Muskellunge", technique: "Big Rubber" },
  { label: "Panfish Ice Noodle", species: "Panfish", technique: "Panfish Ice Noodle" },
];

const defaultState = {
  currentView: "marketing",
  searchQuery: "",
  inventory: [seededBlueprint],
  activeBlueprintSku: seededBlueprint.sku,
  onboarding: {
    step: 1,
    selectedSpecies: ["Bass", "Walleye"],
    platformDefault: "Spinning",
    workshopName: "",
    email: "",
    password: "",
  },
  scraper: {
    inputUrl: "https://www.thornebros.com/custom-rods/midwest-vertical",
    isAnalyzing: false,
  },
  formsInitialTab: "signup",
};

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function RodStackApp() {
  const [appState, setAppState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        onboarding: { ...defaultState.onboarding, ...(parsed.onboarding || {}) },
        scraper: { ...defaultState.scraper, ...(parsed.scraper || {}), isAnalyzing: false },
      };
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const activeBlueprint = useMemo(() => {
    return (
      appState.inventory.find((b) => b.sku === appState.activeBlueprintSku) ??
      appState.inventory[0] ??
      seededBlueprint
    );
  }, [appState.inventory, appState.activeBlueprintSku]);

  const updateState = (fn) => setAppState((prev) => fn(prev));

  const setCurrentView = (view) => updateState((prev) => ({ ...prev, currentView: view }));

  const updateActiveBlueprint = (updater) => {
    updateState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) => (item.sku === prev.activeBlueprintSku ? updater(item) : item)),
    }));
  };

  const netComponentWeight = useMemo(() => {
    const total = parseNum(activeBlueprint?.blankArchitecture?.totalCompletedRodWeight);
    const raw = parseNum(activeBlueprint?.blankArchitecture?.rawBlankWeight);
    if (total == null || raw == null) return null;
    return Number((total - raw).toFixed(2));
  }, [activeBlueprint]);

  const filteredSearchTags = useMemo(() => {
    const q = appState.searchQuery.trim().toLowerCase();
    if (!q) return searchTags;
    return searchTags.filter((tag) => tag.toLowerCase().includes(q));
  }, [appState.searchQuery]);

  const guideRows = useMemo(() => {
    const arr = activeBlueprint.guideTrain.spacingArray || [];
    return arr.map((distance, i) => {
      const prevDistance = i === 0 ? null : arr[i - 1];
      const delta = prevDistance == null ? null : Number((distance - prevDistance).toFixed(2));
      return { idx: i, distance, delta };
    });
  }, [activeBlueprint.guideTrain.spacingArray]);

  const intervalAverage = useMemo(() => {
    const deltas = guideRows.map((g) => g.delta).filter((d) => d != null);
    if (!deltas.length) return null;
    return Number((deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(2));
  }, [guideRows]);

  const handleShortcutClick = (shortcut) => {
    updateState((prev) => {
      const nextInventory = prev.inventory.map((item) =>
        item.sku === prev.activeBlueprintSku
          ? {
              ...item,
              species: shortcut.species,
              technique: shortcut.technique,
            }
          : item
      );
      return {
        ...prev,
        inventory: nextInventory,
        searchQuery: shortcut.technique,
        currentView: "bench",
      };
    });
  };

  const toggleSpeciesSelection = (name) => {
    updateState((prev) => {
      const exists = prev.onboarding.selectedSpecies.includes(name);
      const selectedSpecies = exists
        ? prev.onboarding.selectedSpecies.filter((s) => s !== name)
        : [...prev.onboarding.selectedSpecies, name];
      return { ...prev, onboarding: { ...prev.onboarding, selectedSpecies } };
    });
  };

  const addGuideRow = () => {
    updateActiveBlueprint((bp) => {
      const arr = [...bp.guideTrain.spacingArray];
      const last = arr[arr.length - 1] ?? 0;
      arr.push(Number((last + 8).toFixed(2)));
      return { ...bp, guideTrain: { ...bp.guideTrain, spacingArray: arr } };
    });
  };

  const deleteGuideRow = (idx) => {
    updateActiveBlueprint((bp) => {
      if (bp.guideTrain.spacingArray.length <= 1) return bp;
      const arr = bp.guideTrain.spacingArray.filter((_, i) => i !== idx);
      return { ...bp, guideTrain: { ...bp.guideTrain, spacingArray: arr } };
    });
  };

  const runScraperSimulation = () => {
    updateState((prev) => ({ ...prev, scraper: { ...prev.scraper, isAnalyzing: true } }));
    setTimeout(() => {
      const skuId = `SIM-${Math.floor(100 + Math.random() * 900)}-WKS`;
      const parsedModel = {
        sku: skuId,
        name: "AI Parsed Midwest Vertical Specialist",
        technique: "LiveScope Jigging",
        species: "Walleye",
        blankArchitecture: {
          blankMaterial: "Edge Delta Vertical ML",
          length: `6'10"`,
          action: "Fast",
          power: "Medium-Light",
          lineWindow: "6-10 lb",
          lureWindow: "1/8 - 3/8 oz",
          spineAxis: 180,
          tipTube: 4.0,
          buttOD: 0.49,
          rawBlankWeight: 1.4,
          totalCompletedRodWeight: 2.65,
        },
        handleAssembly: {
          gripStyle: "Tennessee",
          rearGripMaterial: "Dense EVA",
          rearGripLength: 9.75,
          foreGripMaterial: "Carbon Sleeve",
          foreGripLength: 0.75,
          reelSeatModel: "Skeleton Insert 16",
          hoodConfig: "Up-Locking",
          arborMaterial: "Graphite Mesh",
          balancePoint: 10.4,
        },
        guideTrain: {
          frameMaterial: "Stainless",
          ringMaterial: "Alconite",
          stripperDistanceToReel: 18.75,
          spacingArray: [0, 3.2, 7.0, 11.2, 16.3, 22.0, 28.5, 36.0, 44.8],
        },
        qualityControl: {
          staticFlexValidation: true,
          ambientTemperature: 68,
          relativeHumidity: 40,
          cureWindowHours: 16,
        },
      };
      updateState((prev) => ({
        ...prev,
        scraper: { ...prev.scraper, isAnalyzing: false },
        inventory: [parsedModel, ...prev.inventory],
        activeBlueprintSku: parsedModel.sku,
        currentView: "bench",
      }));
    }, 1500);
  };

  const NavButton = ({ target, icon: Icon, label }) => {
    const active = appState.currentView === target;
    return (
      <button
        onClick={() => setCurrentView(target)}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
          active
            ? "border-cyan-400 bg-cyan-500/15 text-cyan-300"
            : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white"
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  const LabelInput = ({ label, value, onChange, type = "text", step }) => (
    <label className="text-xs text-slate-400">
      {label}
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-cyan-400/60 transition focus:ring-2"
      />
    </label>
  );

  if (appState.currentView === "marketing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b111e] to-[#0f172a] text-white">
        <MarketingLanding
          onLaunchBench={() => setCurrentView("bench")}
          onNavigate={(view) => setCurrentView(view)}
          onSignIn={() => setCurrentView("onboarding")}
          onOpenForms={(tab) =>
            updateState((prev) => ({
              ...prev,
              currentView: tab === "signup" ? "onboarding" : "forms",
              formsInitialTab: tab || "signup",
            }))
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b111e] to-[#0f172a] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button onClick={() => setCurrentView("marketing")} className="flex items-center gap-3 text-left">
              <img src="/RS Logo.png" alt="RodStack" className="h-9 w-9" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Engineering Workshop Suite</p>
                <h1 className="mt-1 text-xl font-bold tracking-[0.2em]">RODSTACK</h1>
              </div>
            </button>
            <nav className="flex flex-wrap gap-2">
              <NavButton target="marketing" icon={Home} label="Home" />
              <NavButton target="landing" icon={Search} label="Lineup Explorer" />
              <NavButton target="onboarding" icon={Rocket} label="Blank Directory" />
              <NavButton target="bench" icon={LayoutDashboard} label="Production Bench" />
              <NavButton target="scraper" icon={LinkIcon} label="AI Extraction" />
              <NavButton target="forms" icon={ClipboardList} label="Forms Hub" />
            </nav>
          </div>
        </header>

        {appState.currentView === "landing" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Universal Landing</p>
              <h2 className="mt-2 text-3xl font-semibold">Engineer the Perfect Build. Repeat the Performance.</h2>
              <p className="mt-3 max-w-3xl text-sm text-slate-400">
                Technical specification workspace for custom rod builders. Search by Midwest techniques, open seeded
                build profiles, and jump directly into live production tuning.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  value={appState.searchQuery}
                  onChange={(e) => updateState((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  placeholder="Search techniques: LiveScope Jigging, Big Rubber, Panfish Ice Noodle..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 text-sm text-white outline-none ring-cyan-400/60 transition focus:ring-2"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filteredSearchTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => updateState((prev) => ({ ...prev, searchQuery: tag }))}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {shortcutCards.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => handleShortcutClick(shortcut)}
                  className="rounded-2xl border border-blue-500/35 bg-slate-900/80 p-5 text-left transition hover:border-blue-400"
                >
                  <p className="text-sm font-semibold">{shortcut.label}</p>
                  <p className="mt-2 text-xs text-slate-400">Species: {shortcut.species}</p>
                  <p className="text-xs text-cyan-300">Load into active bench blueprint</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {appState.currentView === "onboarding" && (
          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Interactive Wizard · Step {appState.onboarding.step} of 3
            </p>

            {appState.onboarding.step === 1 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Species Optimization Targets</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {speciesOptions.map((species) => {
                    const active = appState.onboarding.selectedSpecies.includes(species);
                    return (
                      <button
                        key={species}
                        onClick={() => toggleSpeciesSelection(species)}
                        className={`rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                            : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{species}</span>
                          <Fish size={16} className={active ? "text-cyan-300" : "text-slate-500"} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {appState.onboarding.step === 2 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Platform Defaults</h3>
                <p className="mt-1 text-sm text-slate-400">Set your default build archetype.</p>
                <select
                  value={appState.onboarding.platformDefault}
                  onChange={(e) =>
                    updateState((prev) => ({
                      ...prev,
                      onboarding: { ...prev.onboarding, platformDefault: e.target.value },
                    }))
                  }
                  className="mt-4 w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none ring-blue-500/60 focus:ring-2"
                >
                  {platformOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {appState.onboarding.step === 3 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/35 bg-[#07090f]">
                <SignupForm
                  initialValues={{
                    name: appState.onboarding.workshopName,
                    email: appState.onboarding.email,
                    company: appState.onboarding.workshopName,
                    plan: "free",
                  }}
                  onSuccess={() => setCurrentView("bench")}
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() =>
                  updateState((prev) => ({
                    ...prev,
                    onboarding: { ...prev.onboarding, step: Math.max(1, prev.onboarding.step - 1) },
                  }))
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  updateState((prev) => ({
                    ...prev,
                    onboarding: { ...prev.onboarding, step: Math.min(3, prev.onboarding.step + 1) },
                  }))
                }
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {appState.currentView === "bench" && (
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <article className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Blank Architecture</p>
                    <h3 className="text-lg font-semibold">{activeBlueprint.sku}</h3>
                  </div>
                  <FlaskConical size={18} className="text-cyan-300" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabelInput
                    label="Technique"
                    value={activeBlueprint.technique}
                    onChange={(e) => updateActiveBlueprint((bp) => ({ ...bp, technique: e.target.value }))}
                  />
                  <LabelInput
                    label="Blank Material"
                    value={activeBlueprint.blankArchitecture.blankMaterial}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, blankMaterial: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Length"
                    value={activeBlueprint.blankArchitecture.length}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, length: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Action"
                    value={activeBlueprint.blankArchitecture.action}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, action: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Power"
                    value={activeBlueprint.blankArchitecture.power}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, power: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Line Window"
                    value={activeBlueprint.blankArchitecture.lineWindow}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, lineWindow: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Lure Window"
                    value={activeBlueprint.blankArchitecture.lureWindow}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, lureWindow: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Butt OD (in)"
                    value={activeBlueprint.blankArchitecture.buttOD}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: { ...bp.blankArchitecture, buttOD: parseNum(e.target.value) ?? 0 },
                      }))
                    }
                    type="number"
                    step="0.001"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Spine Axis ({activeBlueprint.blankArchitecture.spineAxis}deg)</span>
                      <Ruler size={14} className="text-cyan-300" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={activeBlueprint.blankArchitecture.spineAxis}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          blankArchitecture: { ...bp.blankArchitecture, spineAxis: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Tip Tube ({activeBlueprint.blankArchitecture.tipTube})</span>
                      <Gauge size={14} className="text-cyan-300" />
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="7"
                      step="0.1"
                      value={activeBlueprint.blankArchitecture.tipTube}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          blankArchitecture: { ...bp.blankArchitecture, tipTube: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Handle Assembly</p>
                    <h3 className="text-lg font-semibold">Fulcrum Mechanics</h3>
                  </div>
                  <Wrench size={18} className="text-blue-300" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabelInput
                    label="Grip Style"
                    value={activeBlueprint.handleAssembly.gripStyle}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, gripStyle: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Rear Grip Material"
                    value={activeBlueprint.handleAssembly.rearGripMaterial}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, rearGripMaterial: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Foregrip Material"
                    value={activeBlueprint.handleAssembly.foreGripMaterial}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, foreGripMaterial: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Reel Seat Model"
                    value={activeBlueprint.handleAssembly.reelSeatModel}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, reelSeatModel: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Hood Config"
                    value={activeBlueprint.handleAssembly.hoodConfig}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, hoodConfig: e.target.value },
                      }))
                    }
                  />
                  <LabelInput
                    label="Arbor Material"
                    value={activeBlueprint.handleAssembly.arborMaterial}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        handleAssembly: { ...bp.handleAssembly, arborMaterial: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-blue-500/30 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Rear Grip Length ({activeBlueprint.handleAssembly.rearGripLength.toFixed(2)} in)</span>
                      <Scale size={14} className="text-blue-300" />
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="14"
                      step="0.25"
                      value={activeBlueprint.handleAssembly.rearGripLength}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          handleAssembly: { ...bp.handleAssembly, rearGripLength: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-blue-400"
                    />
                  </div>
                  <div className="rounded-xl border border-blue-500/30 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Foregrip Length ({activeBlueprint.handleAssembly.foreGripLength.toFixed(2)} in)</span>
                      <Scale size={14} className="text-blue-300" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.25"
                      value={activeBlueprint.handleAssembly.foreGripLength}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          handleAssembly: { ...bp.handleAssembly, foreGripLength: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-blue-400"
                    />
                  </div>
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              <article className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Spatial Metrics</p>
                    <h3 className="text-lg font-semibold">Guide Spacing Matrix</h3>
                  </div>
                  <Ruler size={18} className="text-purple-300" />
                </div>

                <div className="mb-2 grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                  <span className="col-span-3">Guide</span>
                  <span className="col-span-5">Distance</span>
                  <span className="col-span-3">Delta</span>
                </div>

                <div className="space-y-2">
                  {guideRows.map((row) => (
                    <div key={row.idx} className="grid grid-cols-12 items-center gap-2">
                      <div className="col-span-3 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs">
                        {row.idx === 0 ? "Tip-Top" : `Guide ${row.idx}`}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={row.distance}
                        onChange={(e) => {
                          const nextValue = parseNum(e.target.value) ?? 0;
                          updateActiveBlueprint((bp) => {
                            const arr = [...bp.guideTrain.spacingArray];
                            arr[row.idx] = nextValue;
                            return { ...bp, guideTrain: { ...bp.guideTrain, spacingArray: arr } };
                          });
                        }}
                        className="col-span-5 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm outline-none ring-purple-400/60 focus:ring-2"
                      />
                      <div className="col-span-3 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-purple-200">
                        {row.delta == null ? "—" : `${row.delta.toFixed(2)}"`}
                      </div>
                      <button
                        onClick={() => deleteGuideRow(row.idx)}
                        className="col-span-1 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addGuideRow}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/35 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/20"
                >
                  <PlusCircle size={16} />
                  Add Guide Row
                </button>

                <div className="mt-4 rounded-xl border border-purple-500/30 bg-slate-950 p-3 text-xs text-slate-300">
                  Mean interval delta: <span className="text-purple-200">{intervalAverage == null ? "—" : `${intervalAverage}"`}</span>
                </div>
              </article>

              <article className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">QC & Analytics</p>
                    <h3 className="text-lg font-semibold">Bench Validation</h3>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-300" />
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-3">
                  <p className="text-xs text-slate-400">
                    Net Component Weight = Total Completed Rod Weight - Raw Blank Weight
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">
                    {netComponentWeight == null ? "—" : `${netComponentWeight.toFixed(2)} oz`}
                  </p>
                </div>

                <div className="mt-3 grid gap-3">
                  <LabelInput
                    label="Raw Blank Weight (oz)"
                    value={activeBlueprint.blankArchitecture.rawBlankWeight}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: {
                          ...bp.blankArchitecture,
                          rawBlankWeight: parseNum(e.target.value),
                        },
                      }))
                    }
                    type="number"
                    step="0.01"
                  />
                  <LabelInput
                    label="Total Completed Rod Weight (oz)"
                    value={activeBlueprint.blankArchitecture.totalCompletedRodWeight}
                    onChange={(e) =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        blankArchitecture: {
                          ...bp.blankArchitecture,
                          totalCompletedRodWeight: parseNum(e.target.value),
                        },
                      }))
                    }
                    type="number"
                    step="0.01"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <button
                    onClick={() =>
                      updateActiveBlueprint((bp) => ({
                        ...bp,
                        qualityControl: {
                          ...bp.qualityControl,
                          staticFlexValidation: !bp.qualityControl.staticFlexValidation,
                        },
                      }))
                    }
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      activeBlueprint.qualityControl.staticFlexValidation
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-red-500/20 text-red-200"
                    }`}
                  >
                    {activeBlueprint.qualityControl.staticFlexValidation ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    Static Flex Curve {activeBlueprint.qualityControl.staticFlexValidation ? "PASS" : "FAIL"}
                  </button>
                  <div className="mt-3 grid gap-3">
                    <LabelInput
                      label="Ambient Temperature (F)"
                      value={activeBlueprint.qualityControl.ambientTemperature}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          qualityControl: {
                            ...bp.qualityControl,
                            ambientTemperature: parseNum(e.target.value) ?? 0,
                          },
                        }))
                      }
                      type="number"
                    />
                    <LabelInput
                      label="Relative Humidity (%)"
                      value={activeBlueprint.qualityControl.relativeHumidity}
                      onChange={(e) =>
                        updateActiveBlueprint((bp) => ({
                          ...bp,
                          qualityControl: {
                            ...bp.qualityControl,
                            relativeHumidity: parseNum(e.target.value) ?? 0,
                          },
                        }))
                      }
                      type="number"
                    />
                  </div>
                </div>
              </article>
            </aside>
          </section>
        )}

        {appState.currentView === "scraper" && (
          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">AI Extraction Ingestion</p>
            <h2 className="mt-2 text-xl font-semibold">Analyze Builder URLs Into New Inventory Models</h2>
            <p className="mt-2 text-sm text-slate-400">
              Supported examples: Thorn Brothers, Edge Rods, Elliot Rods. The simulation appends a parsed model to
              local inventory after analysis.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={appState.scraper.inputUrl}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    scraper: { ...prev.scraper, inputUrl: e.target.value },
                  }))
                }
                placeholder="https://www.edgerods.com/model/..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none ring-purple-500/60 focus:ring-2"
              />
              <button
                onClick={runScraperSimulation}
                disabled={appState.scraper.isAnalyzing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {appState.scraper.isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                {appState.scraper.isAnalyzing ? "Analyzing URL..." : "Analyze URL"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Local Inventory</p>
              <div className="space-y-2">
                {appState.inventory.map((item) => (
                  <button
                    key={item.sku}
                    onClick={() =>
                      updateState((prev) => ({
                        ...prev,
                        activeBlueprintSku: item.sku,
                        currentView: "bench",
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left hover:border-cyan-500/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.sku}</p>
                      <p className="text-xs text-slate-400">{item.technique}</p>
                    </div>
                    <span className="text-xs text-cyan-300">Open Bench</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {appState.currentView === "forms" && (
          <section className="overflow-hidden rounded-2xl border border-slate-700">
            <RodStackFormsSuite
              initialTab={appState.formsInitialTab || "signup"}
              onBack={() => setCurrentView("marketing")}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default RodStackApp;
