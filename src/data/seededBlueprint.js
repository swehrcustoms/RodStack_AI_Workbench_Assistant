export const seededBlueprint = {
  sku: "TRN-73M-CRK-001",
  name: "Deep Water Football Jig Master",
  version: "v1.2",
  technique: "Deep Water Football Jigs",
  species: "Bass",
  blankArchitecture: {
    blankMaterial: "MHX-EPS86M / Edge OEM",
    length: `7'3"`,
    action: "Extra-Fast",
    power: "Medium",
    lineWindow: "8-15 lb",
    lureWindow: "3/16 - 5/8 oz",
    spineAxis: 0,
    tipTube: 4.5,
    buttOD: 0.52,
    rawBlankWeight: 1.84,
    totalCompletedRodWeight: 3.45,
  },
  handleAssembly: {
    gripStyle: "Split-Grip Platform Layout",
    rearGripMaterial: "3A Cork Flare Accent",
    rearGripLength: 10.5,
    foreGripMaterial: "Super Grade Micro Cork Edge",
    foreGripLength: 1.25,
    reelSeatModel: "Fuji ECS-16 Blank-Exposed Casting",
    hoodConfig: "Down-Locking Hidden Thread Spec",
    arborMaterial: "Polyurethane Core Arbors + Premium Epoxy Bed Bond",
    balancePoint: 11.2,
  },
  guideTrain: {
    frameMaterial: "Fuji Titanium",
    ringMaterial: "Torzite Profile",
    stripperDistanceToReel: 19.5,
    spacingArray: [0.0, 3.5, 7.5, 12.0, 17.25, 23.25, 30.0, 38.0, 47.5],
  },
  qualityControl: {
    staticFlexValidation: true,
    ambientTemperature: 69,
    relativeHumidity: 42,
    cureWindowHours: 18,
    leveragePointTarget: 0.75,
  },
};

export function computeNetComponentWeight(blueprint) {
  const total = Number(blueprint?.blankArchitecture?.totalCompletedRodWeight);
  const raw = Number(blueprint?.blankArchitecture?.rawBlankWeight);
  if (!Number.isFinite(total) || !Number.isFinite(raw)) return null;
  return Number((total - raw).toFixed(2));
}

export function buildGuideRows(spacingArray) {
  return (spacingArray || []).map((distance, index) => {
    const previous = index === 0 ? null : spacingArray[index - 1];
    const delta = previous == null ? null : Number((distance - previous).toFixed(2));
    return { index, label: index === 0 ? "Tip-Top" : `Guide ${index}`, distance, delta };
  });
}
