import { AnalyzedReport, SCOPE_DISCLOSURE } from "../lib/aqiEngine";
import { getCategoryStyle } from "../lib/riskTheme";
import { classifyAirQuality } from "../lib/aqiEngine";

interface PollutantBreakdownProps {
  report: AnalyzedReport;
}

export function PollutantBreakdown({ report }: PollutantBreakdownProps) {
  const {
    reading,
    pm25Formatted,
    fineBand,
    inhalableBand,
    dominantShort,
  } = report;

  const pm25Cat = classifyAirQuality(reading.fineParticleAqi);
  const pm10Cat = classifyAirQuality(reading.inhalableParticleAqi);
  const pm25Style = getCategoryStyle(pm25Cat);
  const pm10Style = getCategoryStyle(pm10Cat);

  const maxSubAqi = Math.max(reading.fineParticleAqi, reading.inhalableParticleAqi, 1);
  const pm25Share = Math.min(100, Math.round((reading.fineParticleAqi / maxSubAqi) * 100));
  const pm10Share = Math.min(100, Math.round((reading.inhalableParticleAqi / maxSubAqi) * 100));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Pollutant Impact Breakdown</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Values below use EPA truncation: one decimal for PM2.5, whole µg/m³ for PM10.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Dominant: <strong className="text-slate-800">{dominantShort}</strong>
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* PM2.5 Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Fine Particulate Matter</p>
              <h3 className="text-sm font-semibold text-slate-900">PM2.5 (&le; 2.5 µm)</h3>
            </div>
            <span className={`font-mono text-xs font-semibold ${pm25Style.text}`}>
              {dominantShort === "PM2.5" || dominantShort === "PM2.5 and PM10"
                ? "Primary driver"
                : "Secondary"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {pm25Formatted}
              </span>
              <span className="ml-1.5 font-mono text-xs text-slate-500">µg/m³</span>
            </div>
            <div className="text-right">
              <span className={`font-mono text-2xl font-bold tabular-nums ${pm25Style.text}`}>
                {reading.fineParticleAqi}
              </span>
              <span className="ml-1 text-xs text-slate-500">AQI</span>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-150 ${pm25Style.barFill}`}
              style={{ width: `${pm25Share}%` }}
            />
          </div>

          <p className="mt-3 font-mono text-[11px] text-slate-500 tabular-nums">
            Band: {(fineBand.concentrationLow / 10).toFixed(1)}–{(fineBand.concentrationHigh / 10).toFixed(1)} µg/m³
            {" → "}AQI {fineBand.indexLow}–{fineBand.indexHigh}
          </p>
        </div>

        {/* PM10 Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Inhalable Particulate Matter</p>
              <h3 className="text-sm font-semibold text-slate-900">PM10 (&le; 10 µm)</h3>
            </div>
            <span className={`font-mono text-xs font-semibold ${pm10Style.text}`}>
              {dominantShort === "PM10" || dominantShort === "PM2.5 and PM10"
                ? "Primary driver"
                : "Secondary"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {reading.inhalableParticles}
              </span>
              <span className="ml-1.5 font-mono text-xs text-slate-500">µg/m³</span>
            </div>
            <div className="text-right">
              <span className={`font-mono text-2xl font-bold tabular-nums ${pm10Style.text}`}>
                {reading.inhalableParticleAqi}
              </span>
              <span className="ml-1 text-xs text-slate-500">AQI</span>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-150 ${pm10Style.barFill}`}
              style={{ width: `${pm10Share}%` }}
            />
          </div>

          <p className="mt-3 font-mono text-[11px] text-slate-500 tabular-nums">
            Band: {inhalableBand.concentrationLow}–{inhalableBand.concentrationHigh} µg/m³
            {" → "}AQI {inhalableBand.indexLow}–{inhalableBand.indexHigh}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{SCOPE_DISCLOSURE}</p>
    </section>
  );
}
