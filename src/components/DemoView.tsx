import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { AirQualityReading, buildThreeDayDemo } from "../lib/aqiEngine";
import { getCategoryStyle } from "../lib/riskTheme";

interface DemoViewProps {
  onLoadDemoDay: (reading: AirQualityReading) => void;
}

export function DemoView({ onLoadDemoDay }: DemoViewProps) {
  const demoDays = useMemo(() => buildThreeDayDemo(), []);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Fictional Three-Day Demonstration
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Replicates the built-in C demonstration across three consecutive 24-hour averages for{" "}
          <span className="font-medium text-slate-900">Demo Central District</span>. These
          examples maintain an independent history, separate from your personal session readings.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {demoDays.map(({ day, report, comparisonMessage }) => {
            const { reading, pm25Formatted, categoryName, activityGuidance, dominantPollutant } =
              report;
            const style = getCategoryStyle(reading.categoryIndex);

            return (
              <div
                key={day}
                className={`flex flex-col justify-between rounded-xl border ${style.border} ${style.bgSoft} p-5`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">Sample Day {day}</span>
                    <span className="font-mono tabular-nums">{reading.areaName}</span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <span className={`font-mono text-4xl font-bold tabular-nums ${style.text}`}>
                      {reading.overallAqi}
                    </span>
                    <span className={`text-sm font-semibold ${style.text}`}>{categoryName}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-900/10 pt-4 text-xs">
                    <div>
                      <span className="text-slate-500">PM2.5</span>
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {pm25Formatted} µg/m³ (AQI {reading.fineParticleAqi})
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">PM10</span>
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {reading.inhalableParticles} µg/m³ (AQI {reading.inhalableParticleAqi})
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-700">
                    <span className="font-semibold">Driver:</span> {dominantPollutant}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">{activityGuidance}</p>
                  <p className="mt-2 text-xs font-medium text-slate-600">{comparisonMessage}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onLoadDemoDay(reading)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  Open in Calculator &amp; Ask AI
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
