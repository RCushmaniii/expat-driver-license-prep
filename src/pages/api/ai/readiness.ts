import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

export const prerender = false;

interface ReadinessRequest {
  readinessScore: number;
  confidenceLevel: string;
  categoryBreakdown: { category: string; accuracy: number; questionsSeen: number }[];
  examCount: number;
  passRate: number;
  weakestCategory: string | null;
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "AI features are not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ReadinessRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { readinessScore, confidenceLevel, categoryBreakdown, examCount, passRate, weakestCategory } = body;

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

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    return new Response(
      JSON.stringify({ analysis: text }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI readiness error:", err);
    return new Response(
      JSON.stringify({ error: "AI analysis temporarily unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
