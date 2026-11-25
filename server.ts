import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

interface AdvisorRequestBody {
  question: string;
  history?: AdvisorMessage[];
  reading: {
    areaName: string;
    pm25Formatted: string;
    pm10: number;
    pm25Aqi: number;
    pm10Aqi: number;
    overallAqi: number;
    categoryName: string;
    categoryIndex: number;
    dominantPollutant: string;
    activityGuidance: string;
    usesExtrapolation: boolean;
    comparisonMessage: string;
  };
  context: {
    healthProfileLabel: string;
    healthProfileDetails: string;
    activityTypeLabel: string;
    maskRecommendation: string;
    outdoorRecommendation: string;
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/advisor", async (req, res) => {
    try {
      const body = req.body as AdvisorRequestBody;
      const question = typeof body?.question === "string" ? body.question.trim() : "";

      if (!question) {
        res.status(400).json({ error: "Please enter a question to ask the assistant." });
        return;
      }
      if (question.length > 1000) {
        res.status(400).json({ error: "Question is too long. Keep questions under 1,000 characters." });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(500).json({
          error:
            "Gemini API key is not configured on the server. Check GEMINI_API_KEY in Settings > Secrets.",
        });
        return;
      }

      const r = body.reading;
      const ctx = body.context;

      const systemInstruction = [
        "You are the Urban Air Quality Assistant AI Contextual Advisor.",
        "Provide concise, practical, evidence-grounded air quality guidance strictly tailored to the user's current EPA particle reading and personal context.",
        "Always honor the exact EPA calculation results provided in the context—never contradict or recalculate different AQI numbers.",
        "Format responses cleanly using short paragraphs or concise bullet points (no more than 180 words unless the user asks for deep detail).",
        "Include specific, actionable guidance on mask selection (e.g., N95/KN95 fit), exertion timing/intensity, indoor air filtration, and when to seek cleaner indoor air.",
        "If the user has a sensitive health profile or the AQI category index is >= 2 (Unhealthy for Sensitive Groups or higher), prioritize protective precautions clearly.",
        "Note that the reading covers 24-hour average particle pollution (PM2.5 and PM10) only, and remind users with acute respiratory or cardiac symptoms to consult a clinician or follow local public-health guidance.",
      ].join(" ");

      const contextSnapshot = [
        `CURRENT READING CONTEXT (EPA Particle Pollution Method):`,
        `- Area / City: ${r.areaName || "Unspecified Area"}`,
        `- 24h PM2.5 (EPA truncated): ${r.pm25Formatted} µg/m³ (Sub-AQI: ${r.pm25Aqi})`,
        `- 24h PM10 (EPA truncated): ${r.pm10} µg/m³ (Sub-AQI: ${r.pm10Aqi})`,
        `- Overall AQI: ${r.overallAqi} (${r.categoryName}, Category Index ${r.categoryIndex}/5)`,
        `- Main Contributing Pollutant: ${r.dominantPollutant}`,
        `- Extrapolated Above AQI 500: ${r.usesExtrapolation ? "Yes (exceeds AQI-500 reference)" : "No"}`,
        `- Area History Comparison: ${r.comparisonMessage}`,
        `- Official EPA Activity Guidance: ${r.activityGuidance}`,
        ``,
        `USER PERSONAL CONTEXT:`,
        `- Health Profile: ${ctx.healthProfileLabel} (${ctx.healthProfileDetails})`,
        `- Planned Activity: ${ctx.activityTypeLabel}`,
        `- Baseline Mask Rule: ${ctx.maskRecommendation}`,
        `- Baseline Outdoor Rule: ${ctx.outdoorRecommendation}`,
      ].join("\n");

      const recentHistory = Array.isArray(body.history)
        ? body.history.slice(-6).map((m) => ({
            role: m.role === "assistant" ? ("model" as const) : ("user" as const),
            parts: [{ text: String(m.content || "").slice(0, 1000) }],
          }))
        : [];

      const contents = [
        ...recentHistory,
        {
          role: "user" as const,
          parts: [
            {
              text: `${contextSnapshot}\n\nUSER QUESTION:\n${question}`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({
          error: "The assistant returned an empty response. Please try again.",
        });
        return;
      }

      res.json({ answer });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate advice from Gemini.";
      console.error("[/api/advisor] error:", err);

      if (message.includes("403") || message.includes("PERMISSION_DENIED") || message.includes("API_KEY_INVALID")) {
        res.status(403).json({
          error:
            "Invalid or unauthorized Gemini API key. Please check the key in Settings > Secrets.",
        });
        return;
      }
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
        res.status(429).json({
          error: "Rate limit reached. Please wait a moment and try your question again.",
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req, res) => {
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build output not found. Run npm run build first.");
      }
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Urban Air Quality Assistant listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
