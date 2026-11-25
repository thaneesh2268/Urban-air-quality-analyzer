import { useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { runSelfTests } from "../lib/aqiEngine";

export function SelfTestView() {
  const summary = useMemo(() => runSelfTests(), []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            EPA Engine Verification Suite
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Executes every assertion from the C11 <code className="font-mono">run_self_tests()</code>{" "}
            suite: EPA breakpoint truncation, linear interpolation, invalid input rejection,
            extrapolation, max pollutant selection, and 10-entry FIFO history lookup.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold ${
            summary.failures === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {summary.failures === 0 ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="font-mono tabular-nums">
            {summary.checks} checks · {summary.failures} failures
          </span>
        </div>
      </div>

      <div className="mt-5 max-h-[540px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-200 font-semibold text-slate-500">
              <th className="py-2 pr-4">Test Group</th>
              <th className="py-2 pr-4">Case</th>
              <th className="py-2 pr-4">Result</th>
              <th className="py-2">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.results.map((r, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70">
                <td className="py-2 pr-4 text-slate-500">{r.group}</td>
                <td className="py-2 pr-4 font-mono text-slate-900">{r.label}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`font-semibold ${
                      r.passed ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {r.passed ? "PASS" : "FAIL"}
                  </span>
                </td>
                <td className="py-2 font-mono text-slate-600 tabular-nums">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
