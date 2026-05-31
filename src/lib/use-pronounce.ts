import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Pronunciation hook backed by Azure Neural TTS (via the /api/tts/synthesize
 * proxy), with an automatic fallback to the browser's SpeechSynthesis when the
 * proxy is unavailable (e.g. `astro dev` with no serverless runtime, offline,
 * or an Azure outage).
 *
 * Same public shape as before — `{ speak, isSpeaking, isSupported }` — so no
 * caller needs to change. Defaults to Mexican Spanish (es-MX-DaliaNeural).
 */

// Module-wide cache of synthesized audio so repeated taps don't re-hit Azure.
const audioCache = new Map<string, string>(); // `${lang}|${text}` -> blob URL

function browserFallback(
  text: string,
  lang: "es" | "en",
  onStart: () => void,
  onEnd: () => void,
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd();
    return false;
  }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === "en" ? "en-US" : "es-MX";
  utt.rate = 0.85;
  const voices = speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === utt.lang) ??
    voices.find((v) => v.lang.startsWith(utt.lang.slice(0, 2))) ??
    null;
  if (preferred) utt.voice = preferred;
  utt.onstart = onStart;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  speechSynthesis.speak(utt);
  return true;
}

export function usePronounce() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stays false during SSR + first client render (avoids hydration mismatch),
  // then flips true after mount. TTS is available whenever we have a browser:
  // Azure works server-side and SpeechSynthesis is the local fallback.
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => setIsSupported(true), []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis)
      speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    async (text: string, lang: "es" | "en" = "es") => {
      if (typeof window === "undefined" || !text.trim()) return;
      stop();
      setIsSpeaking(true);

      const onStart = () => setIsSpeaking(true);
      const onEnd = () => setIsSpeaking(false);
      const key = `${lang}|${text}`;

      try {
        let url = audioCache.get(key);
        if (!url) {
          const res = await fetch("/api/tts/synthesize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang }),
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          if (!blob.size) throw new Error("empty audio");
          url = URL.createObjectURL(blob);
          audioCache.set(key, url);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = onEnd;
        audio.onerror = () => browserFallback(text, lang, onStart, onEnd);
        await audio.play();
      } catch {
        // Proxy unreachable or Azure failed — fall back to the browser voice.
        browserFallback(text, lang, onStart, onEnd);
      }
    },
    [stop],
  );

  return { speak, isSpeaking, isSupported };
}
