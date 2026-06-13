import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@lib/logger";
import { enforceRateLimit } from "@lib/server/rate-limit";
import { readEnv } from "@lib/server/env";
import { boundedArray, boundedString } from "@lib/server/api-validation";

export const prerender = false;

const log = createLogger("/api/ai/explain");

const badRequest = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  const limited = await enforceRateLimit(request, "ai-explain", {
    perMinute: 10,
    perHour: 50,
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
  // must be length-bounded or a scripted client can inflate per-request cost.
  const questionText = boundedString(body.questionText, 600);
  const userAnswer = boundedString(body.userAnswer, 10);
  const correctAnswer = boundedString(body.correctAnswer, 10);
  const existingExplanation = boundedString(body.existingExplanation, 2000);
  const rawOptions = boundedArray<Record<string, unknown>>(body.options, 6);
  if (
    !questionText ||
    !userAnswer ||
    !correctAnswer ||
    !existingExplanation ||
    !rawOptions
  ) {
    log.warn("Request failed validation");
    return badRequest("Missing or oversized request fields.");
  }

  const options: { key: string; text: string; isCorrect: boolean }[] = [];
  for (const o of rawOptions) {
    const key = boundedString(o?.key, 10);
    const text = boundedString(o?.text, 400);
    if (!key || !text) {
      log.warn("Option failed validation");
      return badRequest("Missing or oversized request fields.");
    }
    options.push({ key, text, isCorrect: o.isCorrect === true });
  }

  const optionsText = options
    .map((o) => `${o.key}. ${o.text}${o.isCorrect ? " (correct)" : ""}`)
    .join("\n");

  const prompt = `You are a friendly driving instructor helping an English-speaking expat understand a question from the Jalisco, Mexico driver's license exam.

Question: ${questionText}

Options:
${optionsText}

The student chose: ${userAnswer}
The correct answer is: ${correctAnswer}

Existing explanation: ${existingExplanation}

Explain conversationally why the student's answer is wrong and why the correct answer is right. Include a memorable tip or mnemonic to help them remember. Keep it friendly and encouraging — they're learning. Respond in 3-4 sentences, under 100 words. No bullet points or headers.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    log.info("Explanation generated", {
      questionId: body.userAnswer,
      tokensUsed: message.usage?.output_tokens,
    });

    return new Response(JSON.stringify({ explanation: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("Claude API call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response(
      JSON.stringify({ error: "AI explanation temporarily unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
