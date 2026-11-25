import { ArrowUpRight, Trash2 } from "lucide-react";
import {
  AirQualityReading,
  CATEGORY_NAMES,
  formatPm25Tenths,
  HISTORY_LIMIT,
} from "../lib/aqiEngine";
import { getCategoryStyle } from "../lib/riskTheme";

interface HistoryViewProps {
  history: AirQualityReading[];
  onLoadReading: (reading: AirQualityReading) => void;
  onClearHistory: () => void;
  onGoToCalculator: () => void;
}

export function HistoryView({
  history,
  onLoadReading,
  onClearHistory,
  onGoToCalculator,
}: HistoryViewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Air Quality Readings</h2>
          <p className="mt-1 text-xs text-slate-500">
            Oldest first · 24-hour averages in µg/m³ · Session capacity: {HISTORY_LIMIT} entries
            ({history.length}/{HISTORY_LIMIT} used)
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear Session History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm font-medium text-slate-700">
            No readings saved in this session yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Calculate an area&apos;s air quality and click &ldquo;Save Reading to Session History&rdquo; to track trends.
          </p>
          <button
            type="button"
            onClick={onGoToCalculator}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            Go to Calculator
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">#</th>
                <th className="py-2.5 pr-4">Area or City</th>
                <th className="py-2.5 pr-4 text-right">PM2.5 (µg/m³)</th>
                <th className="py-2.5 pr-4 text-right">PM10 (µg/m³)</th>
                <th className="py-2.5 pr-4 text-right">Overall AQI</th>
                <th className="py-2.5 pr-4">Category</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item, idx) => {
                const style = getCategoryStyle(item.categoryIndex);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{item.areaName}</td>
                    <td className="py-3 pr-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatPm25Tenths(item.fineParticleTenths)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-slate-700 tabular-nums">
                      {item.inhalableParticles}
                    </td>
                    <td className={`py-3 pr-4 text-right font-mono font-bold tabular-nums ${style.text}`}>
                      {item.overallAqi}
                    </td>
                    <td className={`py-3 pr-4 text-xs font-semibold ${style.text}`}>
                      {CATEGORY_NAMES[item.categoryIndex]}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onLoadReading(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
                      >
                        Inspect
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
