import { FormEvent, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import {
  ACTIVITY_TYPES,
  ActivityTypeId,
  AnalyzedReport,
  getContextualAdvisory,
  HEALTH_PROFILES,
  HealthProfileId,
} from "../lib/aqiEngine";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextTag?: string;
}

interface AiAdvisorPanelProps {
  report: AnalyzedReport;
  comparisonMessage: string;
  healthProfileId: HealthProfileId;
  activityTypeId: ActivityTypeId;
}

const SUGGESTED_QUESTIONS = [
  "Is it safe to commute by bike right now?",
  "What mask type and fit do I need outdoors?",
  "How should I ventilate or filter my home today?",
  "What symptoms should I watch for given my profile?",
];

export function AiAdvisorPanel({
  report,
  comparisonMessage,
  healthProfileId,
  activityTypeId,
}: AiAdvisorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = HEALTH_PROFILES[healthProfileId];
  const activity = ACTIVITY_TYPES[activityTypeId];
  const advisory = getContextualAdvisory(report, healthProfileId, activityTypeId);

  async function askQuestion(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      contextTag: `${report.reading.areaName || "Area"} · AQI ${report.reading.overallAqi} (${report.categoryName})`,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          reading: {
            areaName: report.reading.areaName || "Unspecified Area",
            pm25Formatted: report.pm25Formatted,
            pm10: report.reading.inhalableParticles,
            pm25Aqi: report.reading.fineParticleAqi,
            pm10Aqi: report.reading.inhalableParticleAqi,
            overallAqi: report.reading.overallAqi,
            categoryName: report.categoryName,
            categoryIndex: report.reading.categoryIndex,
            dominantPollutant: report.dominantPollutant,
            activityGuidance: report.activityGuidance,
            usesExtrapolation: report.usesExtrapolation,
            comparisonMessage,
          },
          context: {
            healthProfileLabel: profile.label,
            healthProfileDetails: profile.details,
            activityTypeLabel: activity.label,
            maskRecommendation: `${advisory.maskTitle}: ${advisory.maskGuidance}`,
            outdoorRecommendation: `${advisory.outdoorTitle}: ${advisory.outdoorGuidance}`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to reach the Air Quality Assistant.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to receive guidance. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void askQuestion(question);
  }

  return (
    <section
      id="ask-assistant"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Ask Air Quality Assistant
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tailored guidance grounded in {report.reading.areaName || "current reading"} (AQI{" "}
            <span className="font-mono tabular-nums">{report.reading.overallAqi}</span> ·{" "}
            {report.categoryName}) · {profile.label} · {activity.label}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear Chat
          </button>
        )}
      </div>

      {/* Suggested Contextual Questions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => void askQuestion(q)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      {messages.length > 0 && (
        <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "border-blue-200 bg-blue-50/50 text-slate-900"
                  : "border-slate-200 bg-slate-50/70 text-slate-800"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
                <span>{msg.role === "user" ? "You" : "Air Quality Assistant"}</span>
                {msg.contextTag && (
                  <span className="font-mono tabular-nums">{msg.contextTag}</span>
                )}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          Analyzing your reading and personal context...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          {error}
        </div>
      )}

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="advisor-question-input" className="sr-only">
          Ask a follow-up question about your air quality reading
        </label>
        <input
          id="advisor-question-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about commuting, outdoor exercise, mask fit, or sensitive symptoms..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Ask
        </button>
      </form>
    </section>
  );
}
