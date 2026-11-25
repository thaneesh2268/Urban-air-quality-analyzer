import { useMemo, useState } from "react";
import { AdvisoryCards } from "./components/AdvisoryCards";
import { AiAdvisorPanel } from "./components/AiAdvisorPanel";
import { AqiGauge } from "./components/AqiGauge";
import { DemoView } from "./components/DemoView";
import { HistoryView } from "./components/HistoryView";
import { InputPanel } from "./components/InputPanel";
import { PollutantBreakdown } from "./components/PollutantBreakdown";
import { SelfTestView } from "./components/SelfTestView";
import {
  ActivityTypeId,
  AirQualityReading,
  analyzeReadingValues,
  FINE_PARTICLE_SCALE,
  formatPm25Tenths,
  getAreaComparison,
  HealthProfileId,
  INHALABLE_PARTICLE_SCALE,
  parseConcentration,
  SamplePreset,
  saveReadingToHistory,
  validateAreaName,
} from "./lib/aqiEngine";

type ActiveTab = "calculator" | "history" | "demo" | "tests";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");

  const [areaName, setAreaName] = useState("Central District");
  const [pm25Text, setPm25Text] = useState("35.5");
  const [pm10Text, setPm10Text] = useState("80");
  const [healthProfile, setHealthProfile] = useState<HealthProfileId>("general");
  const [activityType, setActivityType] = useState<ActivityTypeId>("commute_walk");

  const [history, setHistory] = useState<AirQualityReading[]>([]);
  const [justSavedMessage, setJustSavedMessage] = useState<string | null>(null);

  const areaValidation = useMemo(() => validateAreaName(areaName), [areaName]);
  const pm25Validation = useMemo(
    () => parseConcentration(pm25Text, FINE_PARTICLE_SCALE),
    [pm25Text]
  );
  const pm10Validation = useMemo(
    () => parseConcentration(pm10Text, INHALABLE_PARTICLE_SCALE),
    [pm10Text]
  );

  // Maintain last valid reading so visualizations never flash broken state while typing
  const [lastValidValues, setLastValidValues] = useState({
    areaName: "Central District",
    fineTenths: 355,
    inhalable: 80,
  });

  const currentValidArea = areaValidation.ok ? areaValidation.value : lastValidValues.areaName;
  const currentValidPm25 = pm25Validation.ok ? pm25Validation.value : lastValidValues.fineTenths;
  const currentValidPm10 = pm10Validation.ok ? pm10Validation.value : lastValidValues.inhalable;

  const isAllValid = areaValidation.ok && pm25Validation.ok && pm10Validation.ok;

  const activeReport = useMemo(() => {
    const cleanArea = currentValidArea || "Unspecified Area";
    return analyzeReadingValues(cleanArea, currentValidPm25, currentValidPm10);
  }, [currentValidArea, currentValidPm25, currentValidPm10]);

  const areaComparison = useMemo(
    () => getAreaComparison(history, activeReport.reading),
    [history, activeReport.reading]
  );

  function handleApplyPreset(preset: SamplePreset) {
    setAreaName(preset.areaName);
    setPm25Text(preset.pm25);
    setPm10Text(preset.pm10);
    setHealthProfile(preset.healthProfile);
    setActivityType(preset.activityType);
    setJustSavedMessage(null);
    const p25 = parseConcentration(preset.pm25, FINE_PARTICLE_SCALE);
    const p10 = parseConcentration(preset.pm10, INHALABLE_PARTICLE_SCALE);
    if (p25.ok && p10.ok) {
      setLastValidValues({
        areaName: preset.areaName,
        fineTenths: p25.value,
        inhalable: p10.value,
      });
    }
  }

  function handleSaveReading() {
    if (!isAllValid || !areaValidation.value) {
      return;
    }
    const freshReport = analyzeReadingValues(
      areaValidation.value,
      pm25Validation.ok ? pm25Validation.value : 0,
      pm10Validation.ok ? pm10Validation.value : 0
    );
    setLastValidValues({
      areaName: areaValidation.value,
      fineTenths: freshReport.reading.fineParticleTenths,
      inhalable: freshReport.reading.inhalableParticles,
    });
    setHistory((prev) => saveReadingToHistory(prev, freshReport.reading));
    setJustSavedMessage("The completed reading has been saved in this session's history.");
    window.setTimeout(() => setJustSavedMessage(null), 3500);
  }

  function handleReset() {
    setAreaName("Central District");
    setPm25Text("35.5");
    setPm10Text("80");
    setHealthProfile("general");
    setActivityType("commute_walk");
    setJustSavedMessage(null);
    setLastValidValues({
      areaName: "Central District",
      fineTenths: 355,
      inhalable: 80,
    });
  }

  function handleLoadReading(reading: AirQualityReading) {
    setAreaName(reading.areaName);
    setPm25Text(formatPm25Tenths(reading.fineParticleTenths));
    setPm10Text(String(reading.inhalableParticles));
    setLastValidValues({
      areaName: reading.areaName,
      fineTenths: reading.fineParticleTenths,
      inhalable: reading.inhalableParticles,
    });
    setActiveTab("calculator");
  }

  function jumpToAssistant() {
    setActiveTab("calculator");
    window.setTimeout(() => {
      document.getElementById("ask-assistant")?.scrollIntoView({ behavior: "smooth" });
      document.getElementById("advisor-question-input")?.focus();
    }, 60);
  }

  const canSave = isAllValid && Boolean(areaValidation.ok && areaValidation.value.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 3-Zone Top Navigation Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className="text-left text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer sm:text-lg"
          >
            Urban Air Quality Assistant
          </button>

          {/* Zone 2: Clean single-line navigation links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === "calculator"
                  ? "text-slate-900 underline decoration-blue-700 decoration-2 underline-offset-8"
                  : "hover:text-slate-900"
              }`}
            >
              Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "text-slate-900 underline decoration-blue-700 decoration-2 underline-offset-8"
                  : "hover:text-slate-900"
              }`}
            >
              Recent Readings ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === "demo"
                  ? "text-slate-900 underline decoration-blue-700 decoration-2 underline-offset-8"
                  : "hover:text-slate-900"
              }`}
            >
              3-Day Demo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tests")}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === "tests"
                  ? "text-slate-900 underline decoration-blue-700 decoration-2 underline-offset-8"
                  : "hover:text-slate-900"
              }`}
            >
              Self-Tests
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={jumpToAssistant}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ask Assistant
            </button>
          </div>
        </div>

        {/* Mobile Secondary Tab Bar */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
          {(
            [
              { id: "calculator", label: "Calculator" },
              { id: "history", label: `History (${history.length})` },
              { id: "demo", label: "3-Day Demo" },
              { id: "tests", label: "Self-Tests" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {/* Clean Editorial Intro Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
              Particle Pollution &amp; Health Advisory Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              US EPA 24-hour PM2.5 and PM10 index analysis · Exact integer-scaled truncation ·
              Contextual respiratory guidance
            </p>
          </div>
        </div>

        {activeTab === "calculator" && (
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            {/* Left Control Column */}
            <div className="lg:col-span-4">
              <InputPanel
                areaName={areaName}
                onAreaNameChange={(val) => {
                  setAreaName(val);
                  const res = validateAreaName(val);
                  if (res.ok && res.value) {
                    setLastValidValues((prev) => ({ ...prev, areaName: res.value }));
                  }
                }}
                areaError={!areaValidation.ok ? areaValidation.error : null}
                pm25Text={pm25Text}
                onPm25TextChange={(val) => {
                  setPm25Text(val);
                  const res = parseConcentration(val, FINE_PARTICLE_SCALE);
                  if (res.ok) {
                    setLastValidValues((prev) => ({ ...prev, fineTenths: res.value }));
                  }
                }}
                pm25Error={!pm25Validation.ok ? pm25Validation.error : null}
                pm10Text={pm10Text}
                onPm10TextChange={(val) => {
                  setPm10Text(val);
                  const res = parseConcentration(val, INHALABLE_PARTICLE_SCALE);
                  if (res.ok) {
                    setLastValidValues((prev) => ({ ...prev, inhalable: res.value }));
                  }
                }}
                pm10Error={!pm10Validation.ok ? pm10Validation.error : null}
                healthProfile={healthProfile}
                onHealthProfileChange={setHealthProfile}
                activityType={activityType}
                onActivityTypeChange={setActivityType}
                onApplyPreset={handleApplyPreset}
                onSaveReading={handleSaveReading}
                onReset={handleReset}
                canSave={canSave}
                historyCount={history.length}
                justSavedMessage={justSavedMessage}
              />
            </div>

            {/* Right Visual & Advisory Workspace */}
            <div className="space-y-6 lg:col-span-8">
              <AqiGauge
                report={activeReport}
                comparisonMessage={areaComparison.message}
                delta={areaComparison.delta}
              />

              <PollutantBreakdown report={activeReport} />

              <AdvisoryCards
                report={activeReport}
                healthProfileId={healthProfile}
                activityTypeId={activityType}
              />

              <AiAdvisorPanel
                report={activeReport}
                comparisonMessage={areaComparison.message}
                healthProfileId={healthProfile}
                activityTypeId={activityType}
              />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <HistoryView
            history={history}
            onLoadReading={handleLoadReading}
            onClearHistory={() => setHistory([])}
            onGoToCalculator={() => setActiveTab("calculator")}
          />
        )}

        {activeTab === "demo" && <DemoView onLoadDemoDay={handleLoadReading} />}

        {activeTab === "tests" && <SelfTestView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>Urban Air Quality Assistant · US EPA Particle Pollution Rules (PM2.5 &amp; PM10)</span>
          <span>Manual 24-hour concentration inputs · Session-only history</span>
        </div>
      </footer>
    </div>
  );
}
