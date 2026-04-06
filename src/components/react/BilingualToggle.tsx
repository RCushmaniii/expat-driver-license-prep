import type { DisplayMode } from "@lib/types";

interface Props {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

const options: { value: DisplayMode; label: string }[] = [
  { value: "spanish", label: "Español" },
  { value: "english", label: "English" },
  { value: "official", label: "Official Test" },
];

export default function BilingualToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-white p-1" role="radiogroup" aria-label="Language display mode">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={mode === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === opt.value
              ? "bg-navy text-white"
              : "text-text-secondary hover:text-navy"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
