import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

export const prerender = false;

interface ExplainRequest {
  questionText: string;
  options: { key: string; text: string; isCorrect: boolean }[];
  userAnswer: string;
  correctAnswer: string;
  existingExplanation: string;
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "AI features are not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ExplainRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { questionText, options, userAnswer, correctAnswer, existingExplanation } = body;

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

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    return new Response(
      JSON.stringify({ explanation: text }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI explain error:", err);
    return new Response(
      JSON.stringify({ error: "AI explanation temporarily unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
