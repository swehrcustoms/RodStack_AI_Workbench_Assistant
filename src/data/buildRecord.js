import { seededBlueprint } from "./seededBlueprint.js";

export const ORDER_STATUSES = [
  "Ordered",
  "Blank Sourced",
  "In Progress",
  "Wrapping",
  "Curing",
  "Final Inspection",
  "Complete",
  "Delivered",
];

export const PHOTO_STAGES = [
  "Blank (pre-build)",
  "Handle Assembly",
  "Thread Wrap In Progress",
  "Thread Wrap Complete",
  "First Epoxy Coat",
  "Final Finish",
  "Completed Rod",
  "Other",
];

export const EPOXY_PRODUCTS = [
  { id: "flexcoat", name: "Flexcoat", potLifeMin: 120, recoatMin: 240, baseCureHr: 8 },
  { id: "prokote", name: "ProKote", potLifeMin: 90, recoatMin: 180, baseCureHr: 6 },
  { id: "u40", name: "U-40 Permagloss", potLifeMin: 150, recoatMin: 300, baseCureHr: 10 },
  { id: "threadmaster", name: "Threadmaster", potLifeMin: 100, recoatMin: 200, baseCureHr: 7 },
];

export function uid(prefix = "B") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function extendBuildRecord(bp) {
  const base = bp || {};
  return {
    ...base,
    id: base.id || base.sku || uid("BUILD"),
    buildName: base.buildName || base.name || "Untitled Build",
    customerId: base.customerId || null,
    customerName: base.customerName || "",
    builderName: base.builderName || "",
    orderNotes: base.orderNotes || "",
    orderStatus: base.orderStatus || "Ordered",
    stageTimestamps: base.stageTimestamps || { Ordered: new Date().toISOString() },
    threadColors: base.threadColors || { primary: "", trim: "", inlay: "" },
    finish: base.finish || { type: "Epoxy", coatCount: 2 },
    spineProfile: base.spineProfile || {
      sections: [],
      dominantDegrees: base.blankArchitecture?.spineAxis ?? 0,
      recommendation: "",
      completed: false,
    },
    cureLog: base.cureLog || {
      productId: "flexcoat",
      temperature: base.qualityControl?.ambientTemperature ?? 70,
      humidity: base.qualityControl?.relativeHumidity ?? 45,
      coats: [],
    },
    photos: base.photos || [],
    clonedFrom: base.clonedFrom || null,
    costSnapshot: base.costSnapshot || { materials: 0, labor: 0, sell: 0, markup: 0 },
    quoteIds: base.quoteIds || [],
    componentSkus: base.componentSkus || [],
    createdAt: base.createdAt || new Date().toISOString(),
    updatedAt: base.updatedAt || new Date().toISOString(),
  };
}

export function createBuildFromBlueprint(bp, overrides = {}) {
  return extendBuildRecord({ ...seededBlueprint, ...bp, ...overrides, id: uid("BUILD") });
}

export function cloneBuildRecord(source, { buildName, customerId, customerName } = {}) {
  const clone = extendBuildRecord({
    ...JSON.parse(JSON.stringify(source)),
    id: uid("BUILD"),
    sku: `${source.sku}-CLN-${Date.now().toString().slice(-4)}`,
    buildName: buildName || `${source.buildName || source.name} (Clone)`,
    name: buildName || `${source.name} (Clone)`,
    customerId: customerId || null,
    customerName: customerName || "",
    orderStatus: "Ordered",
    stageTimestamps: { Ordered: new Date().toISOString() },
    clonedFrom: { id: source.id, name: source.buildName || source.name, sku: source.sku },
    photos: [],
    cureLog: { ...source.cureLog, coats: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return clone;
}

export function advanceOrderStatus(build, nextStatus) {
  const timestamps = { ...build.stageTimestamps, [nextStatus]: new Date().toISOString() };
  return { ...build, orderStatus: nextStatus, stageTimestamps: timestamps, updatedAt: new Date().toISOString() };
}

export function computeSpineRecommendation(sections) {
  if (!sections?.length) return { dominantDegrees: 0, recommendation: "Mark the blank and log deflection at each section to generate guide orientation guidance." };
  const avg = Math.round(sections.reduce((s, x) => s + (Number(x.degrees) || 0), 0) / sections.length);
  const rec =
    avg <= 45 || avg >= 315
      ? "Place guides on the spine at 0° for single-foot guides; rotate 180° for heavy double-foot guides."
      : `Dominant spine near ${avg}°. Align stripper and running guides to spine axis; rotate 180° for double-foot stripper if fighting torque.`;
  return { dominantDegrees: avg, recommendation: rec };
}

export function adjustCureHours(baseHr, tempF, humidity) {
  let factor = 1;
  if (tempF > 75) factor -= (tempF - 75) * 0.02;
  if (tempF < 65) factor += (65 - tempF) * 0.025;
  if (humidity > 55) factor += (humidity - 55) * 0.015;
  return Math.max(2, Number((baseHr * factor).toFixed(1)));
}
