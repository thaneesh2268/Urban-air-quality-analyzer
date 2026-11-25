import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { AnalyzedReport, CATEGORY_RANGES } from "../lib/aqiEngine";
import { getCategoryStyle } from "../lib/riskTheme";

interface AqiGaugeProps {
  report: AnalyzedReport;
  comparisonMessage: string;
  delta: number | null;
}

function getCategoryIcon(categoryIndex: number) {
  if (categoryIndex === 0) return CheckCircle2;
  if (categoryIndex === 1) return Info;
  if (categoryIndex === 2) return AlertTriangle;
  if (categoryIndex === 3) return ShieldAlert;
  return ShieldCheck;
}

export function AqiGauge({ report, comparisonMessage, delta }: AqiGaugeProps) {
  const { reading, categoryName, dominantPollutant, filledSegments, aboveDisplayScale, usesExtrapolation } =
    report;
  const style = getCategoryStyle(reading.categoryIndex);
  const Icon = getCategoryIcon(reading.categoryIndex);
  const clampedPercent = Math.min(100, Math.max(0, (reading.overallAqi / 500) * 100));

  return (
    <section
      aria-label="Overall Air Quality Index Summary"
      className={`rounded-xl border ${style.border} ${style.bgSoft} p-6 transition-colors duration-150`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>{reading.areaName || "Unspecified Area"}</span>
            <span aria-hidden="true">·</span>
            <span>24-hour average</span>
            <span aria-hidden="true">·</span>
            <span>EPA Particle Method</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className={`font-mono text-5xl font-bold tracking-tight tabular-nums ${style.text}`}
            >
              {reading.overallAqi}
            </span>
            <span className="text-sm font-medium text-slate-600">Overall AQI</span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <div className={`flex items-center gap-2 text-base font-semibold ${style.text}`}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{categoryName}</span>
          </div>
          <p className="text-xs text-slate-600 font-mono tabular-nums">
            Band {reading.categoryIndex + 1} of 6 · Index Range {CATEGORY_RANGES[reading.categoryIndex]}
          </p>
        </div>
      </div>

      {/* Continuous + 20-Segment EPA Scale (0 to 500) */}
      <div className="mt-6 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">AQI Scale Indicator (0 to 500)</span>
          <span className="font-mono tabular-nums">
            {filledSegments}/20 segments{aboveDisplayScale ? " · above display scale" : ""}
          </span>
        </div>

        {/* 20-segment discrete gauge matching C console indicator */}
        <div
          className="grid grid-cols-20 gap-1"
          role="progressbar"
          aria-valuenow={Math.min(reading.overallAqi, 500)}
          aria-valuemin={0}
          aria-valuemax={500}
          aria-label={`AQI ${reading.overallAqi} out of 500`}
        >
          {Array.from({ length: 20 }).map((_, index) => {
            const isFilled = index < filledSegments;
            const segmentBandColor =
              index < 2
                ? "bg-emerald-600"
                : index < 4
                  ? "bg-amber-500"
                  : index < 6
                    ? "bg-orange-600"
                    : index < 8
                      ? "bg-red-600"
                      : index < 12
                        ? "bg-purple-700"
                        : "bg-rose-900";
            return (
              <div
                key={index}
                className={`h-3 rounded-xs transition-colors duration-150 ${
                  isFilled ? segmentBandColor : "bg-slate-200/80"
                }`}
              />
            );
          })}
        </div>

        {/* Pointer rail + threshold ticks */}
        <div className="relative pt-1">
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-30% via-orange-500 via-40% via-red-600 via-60% to-rose-900 opacity-30" />
          <div
            className="absolute top-0 h-3.5 w-1 -translate-x-1/2 rounded-full bg-slate-900 transition-transform duration-150"
            style={{ left: `${clampedPercent}%` }}
          />
          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500 tabular-nums">
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>300</span>
            <span>500+</span>
          </div>
        </div>
      </div>

      {/* Metadata footer strip */}
      <div className="mt-5 grid gap-2 border-t border-slate-900/10 pt-4 text-xs text-slate-700 sm:grid-cols-2">
        <div>
          <span className="text-slate-500">Main contributing pollutant: </span>
          <span className="font-semibold text-slate-900">{dominantPollutant}</span>
        </div>
        <div className="sm:text-right">
          <span
            className={
              delta === null
                ? "text-slate-600"
                : delta > 0
                  ? "font-medium text-red-700"
                  : delta < 0
                    ? "font-medium text-emerald-700"
                    : "font-medium text-slate-700"
            }
          >
            {comparisonMessage}
          </span>
        </div>
      </div>

      {usesExtrapolation && (
        <div className="mt-3 rounded-lg border border-rose-300 bg-white/80 px-3.5 py-2.5 text-xs text-rose-900">
          <span className="font-semibold">Extrapolated estimate: </span>
          A concentration exceeds its AQI-500 reference. The estimate extends the final breakpoint band&apos;s slope.
        </div>
      )}
    </section>
  );
}
