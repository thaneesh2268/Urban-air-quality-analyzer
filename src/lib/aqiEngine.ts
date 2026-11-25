export const MAX_CONCENTRATION = 10000;
export const HISTORY_LIMIT = 10;
export const AREA_NAME_CAPACITY = 128;
export const INPUT_CAPACITY = 256;
export const BREAKPOINT_COUNT = 6;
export const FINE_PARTICLE_SCALE = 10;
export const INHALABLE_PARTICLE_SCALE = 1;

export interface AqiBreakpoint {
  concentrationLow: number;
  concentrationHigh: number;
  indexLow: number;
  indexHigh: number;
}

export interface AirQualityReading {
  id: string;
  areaName: string;
  fineParticleTenths: number; // PM2.5: 355 represents 35.5 ug/m3
  inhalableParticles: number; // PM10: whole ug/m3
  fineParticleAqi: number;
  inhalableParticleAqi: number;
  overallAqi: number;
  categoryIndex: number;
  timestamp: string;
}

export interface AnalyzedReport {
  reading: AirQualityReading;
  pm25Formatted: string;
  categoryName: string;
  activityGuidance: string;
  sensitiveGroupsNote: string | null;
  dominantPollutant: string;
  dominantShort: "PM2.5" | "PM10" | "PM2.5 and PM10";
  usesExtrapolation: boolean;
  filledSegments: number;
  aboveDisplayScale: boolean;
  fineBand: AqiBreakpoint;
  inhalableBand: AqiBreakpoint;
}

/* Scaled integers preserve decimal truncation without floating-point error. */
export const FINE_PARTICLE_BREAKPOINTS: readonly AqiBreakpoint[] = [
  { concentrationLow: 0, concentrationHigh: 90, indexLow: 0, indexHigh: 50 },
  { concentrationLow: 91, concentrationHigh: 354, indexLow: 51, indexHigh: 100 },
  { concentrationLow: 355, concentrationHigh: 554, indexLow: 101, indexHigh: 150 },
  { concentrationLow: 555, concentrationHigh: 1254, indexLow: 151, indexHigh: 200 },
  { concentrationLow: 1255, concentrationHigh: 2254, indexLow: 201, indexHigh: 300 },
  { concentrationLow: 2255, concentrationHigh: 3254, indexLow: 301, indexHigh: 500 },
];

export const INHALABLE_PARTICLE_BREAKPOINTS: readonly AqiBreakpoint[] = [
  { concentrationLow: 0, concentrationHigh: 54, indexLow: 0, indexHigh: 50 },
  { concentrationLow: 55, concentrationHigh: 154, indexLow: 51, indexHigh: 100 },
  { concentrationLow: 155, concentrationHigh: 254, indexLow: 101, indexHigh: 150 },
  { concentrationLow: 255, concentrationHigh: 354, indexLow: 151, indexHigh: 200 },
  { concentrationLow: 355, concentrationHigh: 424, indexLow: 201, indexHigh: 300 },
  { concentrationLow: 425, concentrationHigh: 604, indexLow: 301, indexHigh: 500 },
];

export const CATEGORY_NAMES: readonly string[] = [
  "Good",
  "Moderate",
  "Unhealthy for Sensitive Groups",
  "Unhealthy",
  "Very Unhealthy",
  "Hazardous",
];

export const CATEGORY_RANGES: readonly string[] = [
  "0 – 50",
  "51 – 100",
  "101 – 150",
  "151 – 200",
  "201 – 300",
  "301+",
];

export const ACTIVITY_GUIDANCE: readonly string[] = [
  "Outdoor activities are generally suitable.",
  "Unusually sensitive people should consider reducing prolonged or heavy outdoor exertion.",
  "Sensitive groups should reduce prolonged or heavy outdoor exertion.",
  "Everyone should reduce prolonged or heavy outdoor exertion. Sensitive groups should avoid prolonged or heavy outdoor exertion.",
  "Everyone should avoid prolonged or heavy outdoor exertion. Sensitive groups should avoid outdoor physical activity.",
  "Everyone should avoid outdoor physical activity and seek cleaner indoor air. Follow local public-health guidance.",
];

export const SENSITIVE_GROUPS_NOTE =
  "Sensitive groups include children, older adults, and people with heart or lung disease.";

export const SCOPE_DISCLOSURE =
  "Scope: particle pollution only; other pollutants may raise city AQI.";

export const EXTRAPOLATION_DISCLOSURE =
  "A concentration exceeds its AQI-500 reference. The estimate extends the final breakpoint band's slope.";

export function trimSurroundingWhitespace(text: string): string {
  return text.trim();
}

export function validateAreaName(text: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = trimSurroundingWhitespace(text);
  // Check control characters matching read_console_line
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code === 127) {
      return {
        ok: false,
        error: "Input contains a control character. Please enter ordinary text.",
      };
    }
  }
  const byteLength = new TextEncoder().encode(trimmed).length;
  if (byteLength >= AREA_NAME_CAPACITY) {
    return {
      ok: false,
      error: `Input is too long. Enter at most ${AREA_NAME_CAPACITY - 1} bytes of text.`,
    };
  }
  return { ok: true, value: trimmed };
}

/*
 * Exact port of parse_concentration(const char *text, long scale, long *result)
 * Accepts an ordinary non-negative decimal, with an optional leading '+'.
 * Rejects extra text, exponents, negative values and out-of-range input.
 * Extra fractional digits are discarded, not rounded:
 *   PM2.5: "35.49" -> 354 tenths; PM10: "54.99" -> 54.
 */
export function parseConcentration(
  text: string,
  scale: number
): { ok: true; value: number } | { ok: false; error: string } {
  const invalidMsg = `Invalid concentration. Enter a decimal from 0 to ${MAX_CONCENTRATION}, for example 35.5. Use a decimal point and omit unit text.`;

  if (
    (scale !== FINE_PARTICLE_SCALE && scale !== INHALABLE_PARTICLE_SCALE) ||
    text.length >= INPUT_CAPACITY
  ) {
    return { ok: false, error: invalidMsg };
  }

  let index = 0;
  const isSpace = (ch: string) => ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\v" || ch === "\f";
  const isDigit = (ch: string) => ch >= "0" && ch <= "9";

  while (index < text.length && isSpace(text[index])) {
    index++;
  }
  if (index < text.length && text[index] === "+") {
    index++;
  }

  let wholePart = 0;
  let firstDecimal = 0;
  let foundDigit = false;

  while (index < text.length && isDigit(text[index])) {
    const digit = text.charCodeAt(index) - 48;
    if (
      wholePart > Math.floor(MAX_CONCENTRATION / 10) ||
      (wholePart === Math.floor(MAX_CONCENTRATION / 10) && digit > MAX_CONCENTRATION % 10)
    ) {
      return { ok: false, error: invalidMsg };
    }
    wholePart = wholePart * 10 + digit;
    foundDigit = true;
    index++;
  }

  if (index < text.length && text[index] === ".") {
    index++;
    if (index < text.length && isDigit(text[index])) {
      firstDecimal = text.charCodeAt(index) - 48;
    }
    while (index < text.length && isDigit(text[index])) {
      foundDigit = true;
      if (wholePart === MAX_CONCENTRATION && text[index] !== "0") {
        return { ok: false, error: invalidMsg };
      }
      index++;
    }
  }

  while (index < text.length && isSpace(text[index])) {
    index++;
  }

  if (!foundDigit || index !== text.length) {
    return { ok: false, error: invalidMsg };
  }

  const result = wholePart * scale + (scale === FINE_PARTICLE_SCALE ? firstDecimal : 0);
  return { ok: true, value: result };
}

export function findBreakpointBand(
  concentration: number,
  breakpoints: readonly AqiBreakpoint[]
): AqiBreakpoint {
  let bandIndex = 0;
  while (
    bandIndex + 1 < BREAKPOINT_COUNT &&
    concentration > breakpoints[bandIndex].concentrationHigh
  ) {
    bandIndex++;
  }
  return breakpoints[bandIndex];
}

export function calculatePollutantAqi(
  concentration: number,
  breakpoints: readonly AqiBreakpoint[]
): number {
  const band = findBreakpointBand(concentration, breakpoints);
  const concentrationSpan = band.concentrationHigh - band.concentrationLow;
  const indexSpan = band.indexHigh - band.indexLow;
  const numerator = (concentration - band.concentrationLow) * indexSpan;

  /*
   * Linear interpolation, rounded to the nearest integer (half up).
   * The final band's slope continues above AQI 500; the result is not capped.
   */
  return (
    band.indexLow +
    Math.floor((numerator + Math.floor(concentrationSpan / 2)) / concentrationSpan)
  );
}

export function classifyAirQuality(airQualityIndex: number): number {
  if (airQualityIndex <= 50) return 0;
  if (airQualityIndex <= 100) return 1;
  if (airQualityIndex <= 150) return 2;
  if (airQualityIndex <= 200) return 3;
  if (airQualityIndex <= 300) return 4;
  return 5;
}

export function formatPm25Tenths(tenths: number): string {
  const whole = Math.floor(tenths / 10);
  const frac = tenths % 10;
  return `${whole}.${frac}`;
}

export function analyzeReadingValues(
  areaName: string,
  fineParticleTenths: number,
  inhalableParticles: number,
  id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  timestamp = new Date().toISOString()
): AnalyzedReport {
  const fineParticleAqi = calculatePollutantAqi(
    fineParticleTenths,
    FINE_PARTICLE_BREAKPOINTS
  );
  const inhalableParticleAqi = calculatePollutantAqi(
    inhalableParticles,
    INHALABLE_PARTICLE_BREAKPOINTS
  );
  const overallAqi =
    fineParticleAqi > inhalableParticleAqi ? fineParticleAqi : inhalableParticleAqi;
  const categoryIndex = classifyAirQuality(overallAqi);

  const reading: AirQualityReading = {
    id,
    areaName,
    fineParticleTenths,
    inhalableParticles,
    fineParticleAqi,
    inhalableParticleAqi,
    overallAqi,
    categoryIndex,
    timestamp,
  };

  let dominantPollutant: string;
  let dominantShort: "PM2.5" | "PM10" | "PM2.5 and PM10";
  if (fineParticleAqi === inhalableParticleAqi) {
    dominantPollutant = "PM2.5 and PM10 (equal AQI values)";
    dominantShort = "PM2.5 and PM10";
  } else if (fineParticleAqi > inhalableParticleAqi) {
    dominantPollutant = "Fine Particulate Matter (PM2.5)";
    dominantShort = "PM2.5";
  } else {
    dominantPollutant = "Inhalable Particulate Matter (PM10)";
    dominantShort = "PM10";
  }

  const usesExtrapolation =
    fineParticleTenths > FINE_PARTICLE_BREAKPOINTS[BREAKPOINT_COUNT - 1].concentrationHigh ||
    inhalableParticles > INHALABLE_PARTICLE_BREAKPOINTS[BREAKPOINT_COUNT - 1].concentrationHigh;

  const filledSegments =
    overallAqi >= 500 ? 20 : Math.floor((overallAqi * 20 + 250) / 500);

  return {
    reading,
    pm25Formatted: formatPm25Tenths(fineParticleTenths),
    categoryName: CATEGORY_NAMES[categoryIndex],
    activityGuidance: ACTIVITY_GUIDANCE[categoryIndex],
    sensitiveGroupsNote: categoryIndex >= 2 ? SENSITIVE_GROUPS_NOTE : null,
    dominantPollutant,
    dominantShort,
    usesExtrapolation,
    filledSegments,
    aboveDisplayScale: overallAqi > 500,
    fineBand: findBreakpointBand(fineParticleTenths, FINE_PARTICLE_BREAKPOINTS),
    inhalableBand: findBreakpointBand(inhalableParticles, INHALABLE_PARTICLE_BREAKPOINTS),
  };
}

export function areaNamesMatch(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

export function findPreviousReading(
  history: readonly AirQualityReading[],
  areaName: string
): AirQualityReading | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (areaNamesMatch(history[i].areaName, areaName)) {
      return history[i];
    }
  }
  return null;
}

export function getAreaComparison(
  history: readonly AirQualityReading[],
  current: AirQualityReading
): {
  previous: AirQualityReading | null;
  delta: number | null;
  message: string;
} {
  const previous = findPreviousReading(history, current.areaName);
  if (!previous) {
    return {
      previous: null,
      delta: null,
      message: "Comparison: no previous reading for this area in recent history.",
    };
  }
  const change = current.overallAqi - previous.overallAqi;
  if (change === 0) {
    return {
      previous,
      delta: 0,
      message: "Comparison: Air Quality Index unchanged from this area's last entry.",
    };
  }
  const absChange = change < 0 ? -change : change;
  const direction = change < 0 ? "lower" : "higher";
  return {
    previous,
    delta: change,
    message: `Comparison: Air Quality Index is ${absChange} points ${direction} than this area's last entry.`,
  };
}

export function saveReadingToHistory(
  history: readonly AirQualityReading[],
  reading: AirQualityReading
): AirQualityReading[] {
  const next = [...history];
  if (next.length >= HISTORY_LIMIT) {
    next.shift();
  }
  next.push(reading);
  return next;
}

/* ============================================================================
 * 3-DAY SAMPLE DEMONSTRATION (exact values from run_sample_demonstration)
 * ============================================================================ */

export interface DemoDayReport {
  day: number;
  report: AnalyzedReport;
  comparisonMessage: string;
  delta: number | null;
}

export function buildThreeDayDemo(): DemoDayReport[] {
  const rawSamples = [
    { areaName: "Demo Central District", fineParticleTenths: 800, inhalableParticles: 180 },
    { areaName: "Demo Central District", fineParticleTenths: 250, inhalableParticles: 85 },
    { areaName: "Demo Central District", fineParticleTenths: 60, inhalableParticles: 30 },
  ];

  const priorReadings: AirQualityReading[] = [];
  const results: DemoDayReport[] = [];

  rawSamples.forEach((sample, idx) => {
    const report = analyzeReadingValues(
      sample.areaName,
      sample.fineParticleTenths,
      sample.inhalableParticles,
      `demo-day-${idx + 1}`,
      `Sample Day ${idx + 1}`
    );
    const comp = getAreaComparison(priorReadings, report.reading);
    results.push({
      day: idx + 1,
      report,
      comparisonMessage: comp.message,
      delta: comp.delta,
    });
    priorReadings.push(report.reading);
  });

  return results;
}

/* ============================================================================
 * SAMPLE PRESETS FOR ONE-CLICK JUDGE TESTING
 * ============================================================================ */

export interface SamplePreset {
  id: string;
  label: string;
  areaName: string;
  pm25: string;
  pm10: string;
  healthProfile: HealthProfileId;
  activityType: ActivityTypeId;
  summary: string;
}

export type HealthProfileId = "general" | "sensitive" | "respiratory" | "outdoor_worker";
export type ActivityTypeId = "indoor_rest" | "commute_walk" | "outdoor_exercise" | "heavy_exertion";

export const HEALTH_PROFILES: Record<
  HealthProfileId,
  { id: HealthProfileId; label: string; details: string; isSensitive: boolean }
> = {
  general: {
    id: "general",
    label: "General Adult",
    details: "No pre-existing cardiopulmonary conditions",
    isSensitive: false,
  },
  sensitive: {
    id: "sensitive",
    label: "Sensitive Group",
    details: "Children, older adults, or heart/lung conditions",
    isSensitive: true,
  },
  respiratory: {
    id: "respiratory",
    label: "Asthma / Respiratory",
    details: "Heightened airway sensitivity to fine particulates",
    isSensitive: true,
  },
  outdoor_worker: {
    id: "outdoor_worker",
    label: "Outdoor Worker",
    details: "Extended multi-hour ambient exposure during shifts",
    isSensitive: true,
  },
};

export const ACTIVITY_TYPES: Record<
  ActivityTypeId,
  { id: ActivityTypeId; label: string; exertionLevel: "low" | "moderate" | "high" }
> = {
  indoor_rest: {
    id: "indoor_rest",
    label: "Indoors / Minimal Exposure",
    exertionLevel: "low",
  },
  commute_walk: {
    id: "commute_walk",
    label: "Commuting / Light Walk",
    exertionLevel: "moderate",
  },
  outdoor_exercise: {
    id: "outdoor_exercise",
    label: "Outdoor Exercise / Jogging",
    exertionLevel: "high",
  },
  heavy_exertion: {
    id: "heavy_exertion",
    label: "Prolonged Heavy Exertion",
    exertionLevel: "high",
  },
};

export const SAMPLE_PRESETS: readonly SamplePreset[] = [
  {
    id: "clean-morning",
    label: "Clean Morning",
    areaName: "Riverside Park",
    pm25: "6.0",
    pm10: "30",
    healthProfile: "general",
    activityType: "outdoor_exercise",
    summary: "Good (AQI 33)",
  },
  {
    id: "urban-moderate",
    label: "Urban Commute",
    areaName: "Central District",
    pm25: "25.0",
    pm10: "85",
    healthProfile: "sensitive",
    activityType: "commute_walk",
    summary: "Moderate (AQI 81)",
  },
  {
    id: "sensitive-alert",
    label: "Sensitive Alert",
    areaName: "Midtown Corridor",
    pm25: "42.5",
    pm10: "135",
    healthProfile: "respiratory",
    activityType: "outdoor_exercise",
    summary: "USG (AQI 118)",
  },
  {
    id: "unhealthy-smog",
    label: "High PM2.5 Smog",
    areaName: "Demo Central District",
    pm25: "80.0",
    pm10: "180",
    healthProfile: "general",
    activityType: "heavy_exertion",
    summary: "Unhealthy (AQI 168)",
  },
  {
    id: "dust-storm",
    label: "PM10 Dust Surge",
    areaName: "Industrial West",
    pm25: "32.0",
    pm10: "380",
    healthProfile: "outdoor_worker",
    activityType: "heavy_exertion",
    summary: "Very Unhealthy (AQI 237, PM10)",
  },
  {
    id: "hazardous-smoke",
    label: "Wildfire Smoke",
    areaName: "Harbor Basin",
    pm25: "275.4",
    pm10: "460",
    healthProfile: "sensitive",
    activityType: "commute_walk",
    summary: "Hazardous (AQI 400)",
  },
];

/* ============================================================================
 * CONTEXTUAL HEALTH, MASK & ACTIVITY DECISION ENGINE
 * Built directly atop C category_index (0..5) and sensitive-group branches.
 * ============================================================================ */

export interface ContextualAdvisory {
  maskTitle: string;
  maskGuidance: string;
  outdoorTitle: string;
  outdoorGuidance: string;
  indoorTitle: string;
  indoorGuidance: string;
  alertPriority: "low" | "moderate" | "elevated" | "high" | "severe";
}

export function getContextualAdvisory(
  report: AnalyzedReport,
  healthProfileId: HealthProfileId,
  activityTypeId: ActivityTypeId
): ContextualAdvisory {
  const cat = report.reading.categoryIndex;
  const profile = HEALTH_PROFILES[healthProfileId];
  const activity = ACTIVITY_TYPES[activityTypeId];
  const isSensitive = profile.isSensitive;
  const isHighExertion = activity.exertionLevel === "high";

  if (cat === 0) {
    return {
      maskTitle: "No respirator needed",
      maskGuidance:
        "Ambient particle levels are within the Good band (0–50). No mask is required for routine outdoor time.",
      outdoorTitle: "Clear for all activities",
      outdoorGuidance:
        "Ideal conditions for running, cycling, commuting, and extended outdoor exertion.",
      indoorTitle: "Natural ventilation suitable",
      indoorGuidance:
        "Opening windows for fresh air circulation is generally beneficial under Good particle conditions.",
      alertPriority: "low",
    };
  }

  if (cat === 1) {
    return {
      maskTitle: isSensitive ? "Optional KN95 for extended exposure" : "Mask generally unnecessary",
      maskGuidance: isSensitive
        ? "Unusually sensitive individuals or outdoor workers may keep a breathable KN95 handy along high-traffic roads."
        : "No mask is typically needed for healthy adults, though heavy roadside traffic can create local spikes.",
      outdoorTitle: isSensitive && isHighExertion
        ? "Pace prolonged heavy exertion"
        : "Suitable with mild sensitivity watch",
      outdoorGuidance: isSensitive
        ? "Consider moderating the intensity or duration of heavy outdoor exertion and watch for coughing or shortness of breath."
        : "Most people can continue normal outdoor activities safely.",
      indoorTitle: "Standard ventilation",
      indoorGuidance:
        "Maintain standard indoor ventilation; sensitive individuals can run a HEPA purifier during peak traffic hours.",
      alertPriority: "moderate",
    };
  }

  if (cat === 2) {
    // category_index >= 2 triggers sensitive groups warning in C
    return {
      maskTitle: isSensitive || isHighExertion ? "Wear a well-fitting N95 or KN95" : "Consider KN95 for long commutes",
      maskGuidance: isSensitive
        ? "A well-fitted N95/KN95 respirator is recommended for sensitive groups when spending extended time outdoors."
        : "Healthy adults commuting lightly may not need a mask, while prolonged outdoor stays benefit from a KN95.",
      outdoorTitle: isSensitive
        ? "Reduce prolonged or heavy exertion"
        : "Take more breaks outdoors",
      outdoorGuidance: isSensitive
        ? "Children, older adults, and people with heart or lung disease should shorten outdoor time and substitute lower-intensity activities."
        : "Healthy adults can continue moderate outdoor activities, but shorten intense cardio sessions.",
      indoorTitle: "Close roadside windows",
      indoorGuidance:
        "Keep windows closed during peak traffic or haze and run recirculated air conditioning or a HEPA filter if available.",
      alertPriority: "elevated",
    };
  }

  if (cat === 3) {
    return {
      maskTitle: "Wear a fitted N95 or KN95 outdoors",
      maskGuidance:
        "Every outdoor trip should use a well-sealed N95/KN95 respirator (surgical and cloth masks do not filter PM2.5 effectively).",
      outdoorTitle: isSensitive
        ? "Avoid prolonged or heavy outdoor exertion"
        : "Move workouts indoors",
      outdoorGuidance: isSensitive
        ? "Sensitive groups should stay indoors whenever possible and reschedule outdoor exertion."
        : "Everyone should reduce prolonged or heavy outdoor exertion; shift running or training to an indoor space.",
      indoorTitle: "Seal windows & run HEPA filtration",
      indoorGuidance:
        "Keep windows and exterior doors closed. Run air purifiers on medium-high and set HVAC to recirculate.",
      alertPriority: "high",
    };
  }

  if (cat === 4) {
    return {
      maskTitle: "Fitted N95/FFP2 respirator required outdoors",
      maskGuidance:
        "Limit outdoor trips to essential errands only and wear a tightly sealed N95, KN95, or FFP2 respirator.",
      outdoorTitle: isSensitive
        ? "Avoid all outdoor physical activity"
        : "Avoid prolonged or heavy exertion",
      outdoorGuidance:
        "Everyone should cancel outdoor workouts and prolonged exertion. Sensitive groups must remain indoors.",
      indoorTitle: "Create a clean-air indoor room",
      indoorGuidance:
        "Keep all windows sealed, minimize indoor smoke/candle/frying particles, and run HEPA filtration continuously.",
      alertPriority: "severe",
    };
  }

  // cat === 5 (Hazardous)
  return {
    maskTitle: "Tightly sealed N95/P100 essential if stepping outside",
    maskGuidance:
      "Avoid going outdoors. If travel is unavoidable, wear a fit-checked N95 or P100 respirator and minimize exposure minutes.",
    outdoorTitle: "Avoid all outdoor physical activity",
    outdoorGuidance:
      "Everyone should stay indoors and avoid all physical exertion outside. Follow local public-health emergency guidance.",
    indoorTitle: "Seek cleaner indoor air immediately",
    indoorGuidance:
      "Seal gaps around doors/windows, run HEPA air purifiers on high, or relocate to a public clean-air shelter if indoor air degrades.",
    alertPriority: "severe",
  };
}

/* ============================================================================
 * BUILT-IN SELF-TESTS (exact port of run_self_tests() from C source)
 * ============================================================================ */

export interface SelfTestCheckResult {
  group: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SelfTestSummary {
  checks: number;
  failures: number;
  results: SelfTestCheckResult[];
}

export function runSelfTests(): SelfTestSummary {
  const validCases: Array<{
    text: string;
    scale: number;
    expectedConcentration: number;
    expectedAqi: number;
  }> = [
    { text: "0", scale: 10, expectedConcentration: 0, expectedAqi: 0 },
    { text: "9.0", scale: 10, expectedConcentration: 90, expectedAqi: 50 },
    { text: "9.1", scale: 10, expectedConcentration: 91, expectedAqi: 51 },
    { text: "35.4", scale: 10, expectedConcentration: 354, expectedAqi: 100 },
    { text: "35.5", scale: 10, expectedConcentration: 355, expectedAqi: 101 },
    { text: "55.4", scale: 10, expectedConcentration: 554, expectedAqi: 150 },
    { text: "55.5", scale: 10, expectedConcentration: 555, expectedAqi: 151 },
    { text: "125.4", scale: 10, expectedConcentration: 1254, expectedAqi: 200 },
    { text: "125.5", scale: 10, expectedConcentration: 1255, expectedAqi: 201 },
    { text: "225.4", scale: 10, expectedConcentration: 2254, expectedAqi: 300 },
    { text: "225.5", scale: 10, expectedConcentration: 2255, expectedAqi: 301 },
    { text: "325.4", scale: 10, expectedConcentration: 3254, expectedAqi: 500 },
    { text: "9.09999", scale: 10, expectedConcentration: 90, expectedAqi: 50 },
    { text: "35.49999", scale: 10, expectedConcentration: 354, expectedAqi: 100 },
    { text: "500", scale: 10, expectedConcentration: 5000, expectedAqi: 848 },
    { text: "10000", scale: 10, expectedConcentration: 100000, expectedAqi: 19772 },
    { text: " +25.0 ", scale: 10, expectedConcentration: 250, expectedAqi: 81 },
    { text: ".0", scale: 10, expectedConcentration: 0, expectedAqi: 0 },
    { text: "0", scale: 1, expectedConcentration: 0, expectedAqi: 0 },
    { text: "54", scale: 1, expectedConcentration: 54, expectedAqi: 50 },
    { text: "55", scale: 1, expectedConcentration: 55, expectedAqi: 51 },
    { text: "154", scale: 1, expectedConcentration: 154, expectedAqi: 100 },
    { text: "155", scale: 1, expectedConcentration: 155, expectedAqi: 101 },
    { text: "254", scale: 1, expectedConcentration: 254, expectedAqi: 150 },
    { text: "255", scale: 1, expectedConcentration: 255, expectedAqi: 151 },
    { text: "354", scale: 1, expectedConcentration: 354, expectedAqi: 200 },
    { text: "355", scale: 1, expectedConcentration: 355, expectedAqi: 201 },
    { text: "424", scale: 1, expectedConcentration: 424, expectedAqi: 300 },
    { text: "425", scale: 1, expectedConcentration: 425, expectedAqi: 301 },
    { text: "604", scale: 1, expectedConcentration: 604, expectedAqi: 500 },
    { text: "54.999", scale: 1, expectedConcentration: 54, expectedAqi: 50 },
    { text: "700", scale: 1, expectedConcentration: 700, expectedAqi: 607 },
    { text: "10000", scale: 1, expectedConcentration: 10000, expectedAqi: 10946 },
  ];

  const invalidCases = [
    "", " ", "-", "-1", "-0.1", "NaN", "inf", "1e3", "12abc", "35,5",
    ".", "+", "++1", "1.2.3", "1 2", "10001", "10000.00001",
    "999999999999999999999999999999999999",
  ];

  const categoryCases = [
    { aqi: 0, expectedCategory: 0 },
    { aqi: 50, expectedCategory: 0 },
    { aqi: 51, expectedCategory: 1 },
    { aqi: 100, expectedCategory: 1 },
    { aqi: 101, expectedCategory: 2 },
    { aqi: 150, expectedCategory: 2 },
    { aqi: 151, expectedCategory: 3 },
    { aqi: 200, expectedCategory: 3 },
    { aqi: 201, expectedCategory: 4 },
    { aqi: 300, expectedCategory: 4 },
    { aqi: 301, expectedCategory: 5 },
    { aqi: 848, expectedCategory: 5 },
  ];

  const results: SelfTestCheckResult[] = [];
  let checks = 0;
  let failures = 0;

  validCases.forEach((tc) => {
    const bands =
      tc.scale === FINE_PARTICLE_SCALE
        ? FINE_PARTICLE_BREAKPOINTS
        : INHALABLE_PARTICLE_BREAKPOINTS;
    const parsed = parseConcentration(tc.text, tc.scale);
    const aqi = parsed.ok ? calculatePollutantAqi(parsed.value, bands) : -1;
    const passed =
      parsed.ok &&
      parsed.value === tc.expectedConcentration &&
      aqi === tc.expectedAqi;
    checks++;
    if (!passed) failures++;
    results.push({
      group: "Valid Concentration & AQI",
      label: `${tc.scale === 10 ? "PM2.5" : "PM10"} "${tc.text}"`,
      passed,
      detail: passed
        ? `Scaled ${tc.expectedConcentration} -> AQI ${tc.expectedAqi}`
        : `Got ${parsed.ok ? parsed.value : "ERR"} / AQI ${aqi}`,
    });
  });

  invalidCases.forEach((input) => {
    [FINE_PARTICLE_SCALE, INHALABLE_PARTICLE_SCALE].forEach((scale) => {
      const parsed = parseConcentration(input, scale);
      const passed = !parsed.ok;
      checks++;
      if (!passed) failures++;
      results.push({
        group: "Invalid Input Rejection",
        label: `${scale === 10 ? "PM2.5" : "PM10"} "${input}"`,
        passed,
        detail: passed ? "Rejected cleanly" : "Unexpectedly accepted",
      });
    });
  });

  categoryCases.forEach((tc) => {
    const cat = classifyAirQuality(tc.aqi);
    const passed = cat === tc.expectedCategory;
    checks++;
    if (!passed) failures++;
    results.push({
      group: "Category Thresholds",
      label: `AQI ${tc.aqi}`,
      passed,
      detail: `Index ${cat} (${CATEGORY_NAMES[cat]})`,
    });
  });

  // Combined max selection tests
  const c1 = analyzeReadingValues("Test", 250, 70);
  const p1 =
    c1.reading.overallAqi === 81 &&
    c1.reading.inhalableParticleAqi === 58 &&
    c1.reading.categoryIndex === 1;
  checks++;
  if (!p1) failures++;
  results.push({
    group: "Combined Max Selection",
    label: "PM2.5 dominant (25.0 / 70)",
    passed: p1,
    detail: `Overall AQI ${c1.reading.overallAqi}, PM10 AQI ${c1.reading.inhalableParticleAqi}`,
  });

  const c2 = analyzeReadingValues("Test", 0, 70);
  const p2 = c2.reading.overallAqi === 58 && c2.reading.fineParticleAqi === 0;
  checks++;
  if (!p2) failures++;
  results.push({
    group: "Combined Max Selection",
    label: "PM10 dominant (0 / 70)",
    passed: p2,
    detail: `Overall AQI ${c2.reading.overallAqi}, PM2.5 AQI ${c2.reading.fineParticleAqi}`,
  });

  const c3 = analyzeReadingValues("Test", 0, 0);
  const p3 = c3.reading.overallAqi === 0 && c3.reading.categoryIndex === 0;
  checks++;
  if (!p3) failures++;
  results.push({
    group: "Combined Max Selection",
    label: "Equal zero readings (0 / 0)",
    passed: p3,
    detail: `Overall AQI ${c3.reading.overallAqi}, Category ${c3.categoryName}`,
  });

  // History ring buffer & case-insensitive area matching
  let hist: AirQualityReading[] = [];
  for (let entry = 0; entry < HISTORY_LIMIT + 2; entry++) {
    const rep = analyzeReadingValues("Central District", entry * 10, 0);
    hist = saveReadingToHistory(hist, rep.reading);
  }
  const histPassed =
    hist.length === HISTORY_LIMIT &&
    hist[0].fineParticleTenths === 20 &&
    hist[hist.length - 1].fineParticleTenths === (HISTORY_LIMIT + 1) * 10 &&
    findPreviousReading(hist, "CENTRAL DISTRICT") === hist[hist.length - 1] &&
    findPreviousReading(hist, "Another Area") === null;
  checks++;
  if (!histPassed) failures++;
  results.push({
    group: "History Ring Buffer & Matching",
    label: "10-entry FIFO & case-insensitive lookup",
    passed: histPassed,
    detail: `Count ${hist.length}/10, oldest PM2.5 ${hist[0].fineParticleTenths / 10}`,
  });

  return { checks, failures, results };
}
