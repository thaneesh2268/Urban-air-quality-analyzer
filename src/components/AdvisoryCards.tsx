import { Activity, Home, Shield, Users } from "lucide-react";
import {
  ACTIVITY_TYPES,
  ActivityTypeId,
  AnalyzedReport,
  getContextualAdvisory,
  HEALTH_PROFILES,
  HealthProfileId,
} from "../lib/aqiEngine";
import { getCategoryStyle } from "../lib/riskTheme";

interface AdvisoryCardsProps {
  report: AnalyzedReport;
  healthProfileId: HealthProfileId;
  activityTypeId: ActivityTypeId;
}

export function AdvisoryCards({
  report,
  healthProfileId,
  activityTypeId,
}: AdvisoryCardsProps) {
  const { activityGuidance, sensitiveGroupsNote, reading } = report;
  const style = getCategoryStyle(reading.categoryIndex);
  const advisory = getContextualAdvisory(report, healthProfileId, activityTypeId);
  const profile = HEALTH_PROFILES[healthProfileId];
  const activity = ACTIVITY_TYPES[activityTypeId];

  return (
    <section className="space-y-4">
      {/* Official EPA Activity Guidance from C engine */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Official EPA Activity Guidance
          </h2>
          <span className="text-xs text-slate-500">
            Profile: {profile.label} · Activity: {activity.label}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-800">{activityGuidance}</p>

        {sensitiveGroupsNote && (
          <div className={`mt-4 flex items-start gap-2.5 rounded-lg border ${style.border} ${style.bgSoft} p-3.5 text-xs leading-relaxed ${style.text}`}>
            <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{sensitiveGroupsNote}</span>
          </div>
        )}
      </div>

      {/* Tailored Actionable Safety Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <Shield className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mask Protection
            </h3>
          </div>
          <p className="mt-2.5 text-sm font-semibold text-slate-900">{advisory.maskTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{advisory.maskGuidance}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <Activity className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Outdoor Exertion
            </h3>
          </div>
          <p className="mt-2.5 text-sm font-semibold text-slate-900">{advisory.outdoorTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {advisory.outdoorGuidance}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <Home className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Indoor Air Plan
            </h3>
          </div>
          <p className="mt-2.5 text-sm font-semibold text-slate-900">{advisory.indoorTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{advisory.indoorGuidance}</p>
        </div>
      </div>
    </section>
  );
}
