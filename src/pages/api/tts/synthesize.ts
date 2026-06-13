import type { APIRoute } from "astro";
import { createLogger } from "@lib/logger";
import { enforceRateLimit } from "@lib/server/rate-limit";
import { readEnv } from "@lib/server/env";

export const prerender = false;

const log = createLogger("/api/tts/synthesize");

/**
 * Azure Neural Text-to-Speech proxy.
 *
 * The browser never sees the Azure subscription key — it POSTs text here and
 * this server-side route proxies to Azure Cognitive Services, returning MP3.
 * Mirrors the CushLabs reference implementation (ny-eng / docs AZURE-TTS.md),
 * adapted to this repo's Astro API-route pattern.
 *
 * Env: AZURE_TTS_KEY (required), AZURE_TTS_REGION (defaults to "eastus").
 */

// Origins allowed to call this endpoint cross-origin. Same-origin calls (the app
// hitting its own /api) work regardless — this only gates other sites.
const allowedOrigins = [
  "https://getexpatdrive.com",
  "https://www.getexpatdrive.com",
  "http://localhost:4321",
  "http://localhost:4322",
  "http://localhost:3000",
];

// Default voice per language. ES = Mexican Spanish (CushLabs standard) — never es-ES.
const DEFAULT_VOICES: Record<string, string> = {
  en: "en-US-AvaNeural",
  es: "es-MX-DaliaNeural",
};

// Whitelist to prevent abuse; unknown voice silently falls back to the default.
const ALLOWED_VOICES = new Set([
  "en-US-AndrewNeural",
  "en-US-AvaNeural",
  "en-US-BrianNeural",
  "en-US-EmmaNeural",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "es-MX-JorgeNeural",
  "es-MX-DaliaNeural",
]);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function corsHeaders(origin: string): Record<string, string> {
  const corsOrigin = allowedOrigins.includes(origin) ? origin : "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (corsOrigin) headers["Access-Control-Allow-Origin"] = corsOrigin;
  return headers;
}

export const OPTIONS: APIRoute = ({ request }) =>
  new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin") || ""),
  });

export const POST: APIRoute = async ({ request }) => {
  // Generous limits — the speaker button fires per vocabulary word during
  // normal study — but bounded so a script can't loop the Azure spend.
  const limited = await enforceRateLimit(request, "tts", {
    perMinute: 30,
    perHour: 300,
  });
  if (limited) return limited;

  const origin = request.headers.get("origin") || "";
  const baseHeaders = corsHeaders(origin);
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });

  const apiKey = readEnv("AZURE_TTS_KEY");
  const region = readEnv("AZURE_TTS_REGION") || "eastus";
  if (!apiKey) {
    log.error("AZURE_TTS_KEY is not configured");
    return json({ error: "TTS service not configured" }, 500);
  }

  let body: {
    text?: unknown;
    voice?: unknown;
    lang?: unknown;
    phoneme?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const { text, voice, lang, phoneme } = body;
  if (!text || typeof text !== "string") {
    return json({ error: "Missing or invalid 'text' field" }, 400);
  }
  if (text.length > 500) {
    return json({ error: "Text exceeds 500 character limit" }, 400);
  }

  const cleanText = text
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
  if (!cleanText)
    return json({ error: "Text is empty after sanitization" }, 400);

  const language = lang === "en" ? "en" : "es";
  const selectedVoice =
    typeof voice === "string" && ALLOWED_VOICES.has(voice)
      ? voice
      : DEFAULT_VOICES[language];
  const voiceLang = selectedVoice.split("-").slice(0, 2).join("-"); // e.g. "es-MX"

  const escapedText = escapeXml(cleanText);
  const ipaRegex = /^[ -~À-ɏɐ-ʯ̀-ͯ‐-⁞.ˈˌːˑ]+$/;
  const textContent =
    typeof phoneme === "string" &&
    phoneme.length <= 100 &&
    ipaRegex.test(phoneme)
      ? `<phoneme alphabet="ipa" ph="${escapeXml(phoneme)}">${escapedText}</phoneme>`
      : escapedText;

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voiceLang}">
  <voice name="${selectedVoice}">
    <prosody rate="0.9">${textContent}</prosody>
  </voice>
</speak>`;

  try {
    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const azure = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "CushLabsTTS/1.0",
      },
      body: ssml,
    });

    if (!azure.ok) {
      const detail = await azure.text();
      log.error("Azure TTS error", {
        status: azure.status,
        detail: detail.slice(0, 300),
      });
      return json({ error: "TTS synthesis failed" }, 502);
    }

    const audio = await azure.arrayBuffer();
    log.info("TTS synthesized", {
      voice: selectedVoice,
      chars: cleanText.length,
    });
    return new Response(audio, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Length": String(audio.byteLength),
      },
    });
  } catch (err) {
    log.error("TTS request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "Internal TTS error" }, 500);
  }
};
