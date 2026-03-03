interface Props {
  text: string;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
  size?: "sm" | "md";
}

export default function SpeakerButton({
  text,
  speak,
  isSpeaking,
  isSupported,
  size = "sm",
}: Props) {
  if (!isSupported) return null;

  const px = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={`inline-flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0 ${
        isSpeaking ? "animate-pulse text-navy" : ""
      }`}
      aria-label={`Pronounce "${text}" in Spanish`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={px}
      >
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
        <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
      </svg>
    </button>
  );
}
