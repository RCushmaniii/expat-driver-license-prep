import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@lib/logger";
import { enforceRateLimit } from "@lib/server/rate-limit";
import { readEnv } from "@lib/server/env";
import {
  boundedArray,
  boundedNumber,
  boundedString,
} from "@lib/server/api-validation";

export const prerender = false;

const log = createLogger("/api/ai/readiness");

const badRequest = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  const limited = await enforceRateLimit(request, "ai-readiness", {
    perMinute: 5,
    perHour: 30,
  });
  if (limited) return limited;

  const apiKey = readEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    log.error("ANTHROPIC_API_KEY is not set");
    return new Response(
      JSON.stringify({ error: "AI features are not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    log.warn("Invalid request body");
    return badRequest("Invalid request body.");
  }

  // Every field below is interpolated into a paid Claude prompt — all of them
  // must be type- and length-bounded to prevent cost amplification.
  const readinessScore = boundedNumber(body.readinessScore, 0, 100);
  const confidenceLevel = boundedString(body.confidenceLevel, 50);
  const examCount = boundedNumber(body.examCount, 0, 100000);
  const passRate = boundedNumber(body.passRate, 0, 100);
  const weakestCategory =
    body.weakestCategory == null
      ? null
      : boundedString(body.weakestCategory, 100);
  const rawBreakdown = boundedArray<Record<string, unknown>>(
    body.categoryBreakdown,
    20,
  );
  if (
    readinessScore === null ||
    !confidenceLevel ||
    examCount === null ||
    passRate === null ||
    (body.weakestCategory != null && !weakestCategory) ||
    !rawBreakdown
  ) {
    log.warn("Request failed validation");
    return badRequest("Missing or oversized request fields.");
  }

  const categoryBreakdown: {
    category: string;
    accuracy: number;
    questionsSeen: number;
  }[] = [];
  for (const c of rawBreakdown) {
    const category = boundedString(c?.category, 100);
    const accuracy = boundedNumber(c?.accuracy, 0, 100);
    const questionsSeen = boundedNumber(c?.questionsSeen, 0, 100000);
    if (!category || accuracy === null || questionsSeen === null) {
      log.warn("Category breakdown entry failed validation");
      return badRequest("Missing or oversized request fields.");
    }
    categoryBreakdown.push({ category, accuracy, questionsSeen });
  }

  const prompt = `You are a friendly study coach for an English-speaking expat preparing for the Jalisco, Mexico driver's license written exam. Based on the student's progress data, provide a brief personalized assessment.

Student data:
- Overall readiness score: ${readinessScore}%
- Confidence level: ${confidenceLevel}
- Practice exams taken: ${examCount}
- Pass rate: ${passRate}%
- Weakest category: ${weakestCategory || "none identified yet"}
- Category breakdown: ${categoryBreakdown.map((c) => `${c.category}: ${c.accuracy}% accuracy (${c.questionsSeen} questions seen)`).join("; ")}

Respond with exactly 2-3 sentences assessing their readiness, then one specific actionable recommendation. Keep it encouraging but honest. Do not use bullet points or headers — just natural sentences. Keep the total response under 100 words.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    log.info("Readiness analysis generated", {
      readinessScore,
      confidenceLevel,
      examCount,
      tokensUsed: message.usage?.output_tokens,
    });

    return new Response(JSON.stringify({ analysis: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("Claude API call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response(
      JSON.stringify({ error: "AI analysis temporarily unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
