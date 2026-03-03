import { useState, useEffect, useRef, useCallback } from "react";

export function usePronounce() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setIsSupported(true);

    const pickVoice = () => {
      const voices = speechSynthesis.getVoices();
      // Prefer es-MX, fall back to any es-* voice
      voiceRef.current =
        voices.find((v) => v.lang === "es-MX") ??
        voices.find((v) => v.lang.startsWith("es")) ??
        null;
    };

    pickVoice();
    // Chrome loads voices asynchronously
    speechSynthesis.addEventListener("voiceschanged", pickVoice);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any in-progress speech to prevent queue buildup
    speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-MX";
    utt.rate = 0.85;
    if (voiceRef.current) utt.voice = voiceRef.current;

    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utt;
    speechSynthesis.speak(utt);
  }, []);

  return { speak, isSpeaking, isSupported };
}
