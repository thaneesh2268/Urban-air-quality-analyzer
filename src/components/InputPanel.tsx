import { BookmarkPlus, RotateCcw } from "lucide-react";
import {
  ACTIVITY_TYPES,
  ActivityTypeId,
  HEALTH_PROFILES,
  HealthProfileId,
  HISTORY_LIMIT,
  MAX_CONCENTRATION,
  SAMPLE_PRESETS,
  SamplePreset,
} from "../lib/aqiEngine";

interface InputPanelProps {
  areaName: string;
  onAreaNameChange: (val: string) => void;
  areaError: string | null;
  pm25Text: string;
  onPm25TextChange: (val: string) => void;
  pm25Error: string | null;
  pm10Text: string;
  onPm10TextChange: (val: string) => void;
  pm10Error: string | null;
  healthProfile: HealthProfileId;
  onHealthProfileChange: (val: HealthProfileId) => void;
  activityType: ActivityTypeId;
  onActivityTypeChange: (val: ActivityTypeId) => void;
  onApplyPreset: (preset: SamplePreset) => void;
  onSaveReading: () => void;
  onReset: () => void;
  canSave: boolean;
  historyCount: number;
  justSavedMessage: string | null;
}

export function InputPanel({
  areaName,
  onAreaNameChange,
  areaError,
  pm25Text,
  onPm25TextChange,
  pm25Error,
  pm10Text,
  onPm10TextChange,
  pm10Error,
  healthProfile,
  onHealthProfileChange,
  activityType,
  onActivityTypeChange,
  onApplyPreset,
  onSaveReading,
  onReset,
  canSave,
  historyCount,
  justSavedMessage,
}: InputPanelProps) {
  const pm25SliderValue = Math.min(
    350,
    Math.max(0, Number.isFinite(parseFloat(pm25Text)) ? parseFloat(pm25Text) : 0)
  );
  const pm10SliderValue = Math.min(
    604,
    Math.max(0, Number.isFinite(parseFloat(pm10Text)) ? Math.floor(parseFloat(pm10Text)) : 0)
  );

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Reading &amp; Context Inputs</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            24-hour averages · Range 0 to {MAX_CONCENTRATION.toLocaleString()} µg/m³
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Quick Sample Presets */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-700">Sample Presets</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected =
              areaName === preset.areaName &&
              pm25Text === preset.pm25 &&
              pm10Text === preset.pm10;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className={`rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 text-blue-950"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70"
                }`}
              >
                <div className="truncate text-xs font-semibold">{preset.label}</div>
                <div className="truncate font-mono text-[11px] text-slate-500 tabular-nums">
                  {preset.summary}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Area / City Input */}
      <div className="mt-5 space-y-1.5">
        <label htmlFor="area-name-input" className="block text-xs font-semibold text-slate-700">
          Area or City Name
        </label>
        <input
          id="area-name-input"
          type="text"
          value={areaName}
          onChange={(e) => onAreaNameChange(e.target.value)}
          placeholder="e.g., Central District"
          maxLength={127}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:ring-2 ${
            areaError
              ? "border-red-400 bg-red-50/40 focus:ring-red-200"
              : "border-slate-200 bg-white focus:border-blue-600 focus:ring-blue-100"
          }`}
        />
        {areaError ? (
          <p className="text-xs text-red-700">{areaError}</p>
        ) : (
          <p className="text-[11px] text-slate-500">
            Case-insensitive matching tracks AQI changes per area.
          </p>
        )}
      </div>

      {/* PM2.5 Slider + Exact Decimal Input */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pm25-input" className="text-xs font-semibold text-slate-700">
            PM2.5 Concentration (µg/m³)
          </label>
          <span className="font-mono text-[11px] text-slate-500">Truncated to 0.1</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            aria-label="PM2.5 slider"
            min={0}
            max={350}
            step={0.1}
            value={pm25SliderValue}
            onChange={(e) => onPm25TextChange(e.target.value)}
            className="aqi-slider flex-1"
          />
          <input
            id="pm25-input"
            type="text"
            inputMode="decimal"
            value={pm25Text}
            onChange={(e) => onPm25TextChange(e.target.value)}
            placeholder="35.5"
            className={`w-24 rounded-lg border px-2.5 py-1.5 text-right font-mono text-sm tabular-nums outline-none transition-colors focus:ring-2 ${
              pm25Error
                ? "border-red-400 bg-red-50/40 text-red-900 focus:ring-red-200"
                : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-blue-100"
            }`}
          />
        </div>
        {pm25Error && <p className="text-xs text-red-700">{pm25Error}</p>}
      </div>

      {/* PM10 Slider + Exact Decimal/Whole Input */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pm10-input" className="text-xs font-semibold text-slate-700">
            PM10 Concentration (µg/m³)
          </label>
          <span className="font-mono text-[11px] text-slate-500">Truncated to whole</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            aria-label="PM10 slider"
            min={0}
            max={604}
            step={1}
            value={pm10SliderValue}
            onChange={(e) => onPm10TextChange(e.target.value)}
            className="aqi-slider flex-1"
          />
          <input
            id="pm10-input"
            type="text"
            inputMode="decimal"
            value={pm10Text}
            onChange={(e) => onPm10TextChange(e.target.value)}
            placeholder="80"
            className={`w-24 rounded-lg border px-2.5 py-1.5 text-right font-mono text-sm tabular-nums outline-none transition-colors focus:ring-2 ${
              pm10Error
                ? "border-red-400 bg-red-50/40 text-red-900 focus:ring-red-200"
                : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-blue-100"
            }`}
          />
        </div>
        {pm10Error && <p className="text-xs text-red-700">{pm10Error}</p>}
      </div>

      {/* User Health Profile & Activity Type */}
      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5">
        <div className="space-y-1.5">
          <label htmlFor="health-profile-select" className="block text-xs font-semibold text-slate-700">
            User Health Profile
          </label>
          <select
            id="health-profile-select"
            value={healthProfile}
            onChange={(e) => onHealthProfileChange(e.target.value as HealthProfileId)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {Object.values(HEALTH_PROFILES).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.details}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="activity-type-select" className="block text-xs font-semibold text-slate-700">
            Planned Activity Type
          </label>
          <select
            id="activity-type-select"
            value={activityType}
            onChange={(e) => onActivityTypeChange(e.target.value as ActivityTypeId)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {Object.values(ACTIVITY_TYPES).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save to Session History CTA */}
      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={onSaveReading}
          disabled={!canSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
        >
          <BookmarkPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          Save Reading to Session History ({historyCount}/{HISTORY_LIMIT})
        </button>
        {justSavedMessage && (
          <p className="text-center text-xs font-medium text-emerald-700">{justSavedMessage}</p>
        )}
      </div>
    </aside>
  );
}
