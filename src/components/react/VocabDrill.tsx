import { useState, useEffect, useCallback } from "react";
import type { VocabTerm } from "@lib/types";
import { saveVocabProgress } from "@lib/progress-store";
import { usePronounce } from "@lib/use-pronounce";
import SpeakerButton from "./SpeakerButton";

type DrillMode = "es-to-en" | "en-to-es" | "multiple-choice";
type DrillState = "loading" | "ready" | "drilling" | "revealed" | "session-complete";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabDrill() {
  const { speak, isSpeaking, isSupported } = usePronounce();
  const [vocab, setVocab] = useState<VocabTerm[]>([]);
  const [drillMode, setDrillMode] = useState<DrillMode>("es-to-en");
  const [state, setState] = useState<DrillState>("loading");
  const [drillTerms, setDrillTerms] = useState<VocabTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    fetch("/data/jalisco/vocabulary.json")
      .then((r) => r.json())
      .then((data: VocabTerm[]) => {
        setVocab(data);
        setState("ready");
      })
      .catch(() => setState("loading"));
  }, []);

  const startDrill = useCallback(
    (mode?: DrillMode) => {
      const m = mode || drillMode;
      setDrillMode(m);
      const shuffled = shuffle(vocab);
      setDrillTerms(shuffled);
      setCurrentIndex(0);
      setSelectedOption(null);
      setSessionStats({ correct: 0, incorrect: 0 });
      setState("drilling");
      generateMCOptions(shuffled, 0, m);
    },
    [vocab, drillMode]
  );

  const generateMCOptions = (terms: VocabTerm[], idx: number, mode: DrillMode) => {
    if (mode !== "multiple-choice" || terms.length === 0) return;
    const current = terms[idx];
    const correctAnswer = current.term_en;
    const others = terms
      .filter((t) => t.term_es !== current.term_es)
      .map((t) => t.term_en);
    const wrongOptions = shuffle(others).slice(0, 3);
    setMcOptions(shuffle([correctAnswer, ...wrongOptions]));
  };

  const currentTerm = drillTerms[currentIndex];

  const revealAnswer = () => {
    setState("revealed");
  };

  const markAnswer = (correct: boolean) => {
    if (currentTerm) {
      saveVocabProgress(currentTerm.term_es, correct);
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
    }

    if (currentIndex < drillTerms.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setState("drilling");
      generateMCOptions(drillTerms, nextIdx, drillMode);
    } else {
      setState("session-complete");
    }
  };

  const handleMCSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const isCorrect = option === currentTerm?.term_en;
    if (currentTerm) {
      saveVocabProgress(currentTerm.term_es, isCorrect);
      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      }));
    }
  };

  const nextAfterMC = () => {
    if (currentIndex < drillTerms.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      generateMCOptions(drillTerms, nextIdx, drillMode);
    } else {
      setState("session-complete");
    }
  };

  if (state === "loading" || vocab.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Loading vocabulary...</div>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="card text-center py-10">
        <h2 className="text-2xl font-bold text-navy mb-2">Vocabulary Drill</h2>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          {vocab.length} key Spanish driving terms from the question bank.
          Choose a drill mode to get started.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          <button
            onClick={() => startDrill("es-to-en")}
            className="p-5 rounded-xl border-2 border-border bg-surface-white text-center hover:border-navy hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="text-lg font-bold text-navy group-hover:text-navy-light mb-1">ES → EN</div>
            <div className="text-xs text-text-muted">See Spanish, recall English</div>
          </button>
          <button
            onClick={() => startDrill("en-to-es")}
            className="p-5 rounded-xl border-2 border-border bg-surface-white text-center hover:border-navy hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="text-lg font-bold text-navy group-hover:text-navy-light mb-1">EN → ES</div>
            <div className="text-xs text-text-muted">See English, recall Spanish</div>
          </button>
          <button
            onClick={() => startDrill("multiple-choice")}
            className="p-5 rounded-xl border-2 border-border bg-surface-white text-center hover:border-navy hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="text-lg font-bold text-navy group-hover:text-navy-light mb-1">Quiz</div>
            <div className="text-xs text-text-muted">Multiple choice</div>
          </button>
        </div>

        <p className="text-xs text-text-muted">
          Terms are sourced from the 103 official exam questions
        </p>
      </div>
    );
  }

  if (state === "session-complete") {
    const { correct, incorrect } = sessionStats;
    const total = correct + incorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-navy mb-4">Session complete</h2>
        <p className="text-text-secondary mb-6">
          {correct}/{total} correct ({pct}%)
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
          <div className="p-3 bg-success-bg rounded-lg">
            <div className="text-2xl font-bold text-success">{correct}</div>
            <div className="text-xs text-text-muted">Correct</div>
          </div>
          <div className="p-3 bg-error-bg rounded-lg">
            <div className="text-2xl font-bold text-error">{incorrect}</div>
            <div className="text-xs text-text-muted">Incorrect</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => startDrill()} className="btn-primary">
            Drill Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentTerm) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">No terms loaded.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <span className="text-sm text-text-muted">
          Term {currentIndex + 1} of {drillTerms.length}
        </span>
        <div className="inline-flex rounded-lg border border-border bg-surface-white p-1">
          {(
            [
              { value: "es-to-en" as DrillMode, label: "ES → EN" },
              { value: "en-to-es" as DrillMode, label: "EN → ES" },
              { value: "multiple-choice" as DrillMode, label: "Quiz" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => startDrill(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                drillMode === opt.value
                  ? "bg-navy text-white"
                  : "text-text-secondary hover:text-navy"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multiple choice mode */}
      {drillMode === "multiple-choice" ? (
        <div className="card min-h-[300px] flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              What does this mean in English?
            </div>
            <p className="text-2xl font-bold text-spanish inline-flex items-center gap-2 justify-center">
              {currentTerm.term_es}
              <SpeakerButton text={currentTerm.term_es} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="md" />
            </p>
            <p className="text-sm text-text-muted mt-1">{currentTerm.context}</p>
          </div>

          <div className="space-y-3">
            {mcOptions.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentTerm.term_en;
              let classes = "border-border hover:border-navy-light hover:shadow-sm hover:-translate-y-px cursor-pointer";

              if (selectedOption) {
                if (isCorrect) {
                  classes = "border-success bg-success-bg cursor-default";
                } else if (isSelected && !isCorrect) {
                  classes = "border-error bg-error-bg cursor-default";
                } else {
                  classes = "border-border cursor-default opacity-60";
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleMCSelect(option)}
                  disabled={!!selectedOption}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors touch-target ${classes}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <div className="mt-6 text-center">
              <button onClick={nextAfterMC} className="btn-primary">
                {currentIndex < drillTerms.length - 1 ? "Next Term" : "See Results"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Flashcard mode (ES→EN or EN→ES) */
        <div
          className="card min-h-[300px] flex flex-col justify-center cursor-pointer select-none hover:shadow-md hover:border-navy-light/30 transition-all duration-200"
          onClick={() => state === "drilling" && revealAnswer()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && state === "drilling") {
              e.preventDefault();
              revealAnswer();
            }
          }}
        >
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              {drillMode === "es-to-en" ? "Spanish" : "English"}
            </div>
            <p className="text-2xl font-bold text-navy mb-2 inline-flex items-center gap-2 justify-center">
              {drillMode === "es-to-en" ? currentTerm.term_es : currentTerm.term_en}
              {drillMode === "es-to-en" && (
                <SpeakerButton text={currentTerm.term_es} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="md" />
              )}
            </p>
            <p className="text-sm text-text-muted">{currentTerm.context}</p>

            {state === "revealed" ? (
              <>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                    {drillMode === "es-to-en" ? "English" : "Spanish"}
                  </div>
                  <p className="text-2xl font-bold text-navy-light inline-flex items-center gap-2 justify-center">
                    {drillMode === "es-to-en" ? currentTerm.term_en : currentTerm.term_es}
                    {drillMode === "en-to-es" && (
                      <SpeakerButton text={currentTerm.term_es} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="md" />
                    )}
                  </p>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); markAnswer(false); }}
                    className="btn bg-error-bg text-error border border-error/20 hover:bg-error hover:text-white"
                  >
                    Didn't know
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); markAnswer(true); }}
                    className="btn bg-success-bg text-success border border-success/20 hover:bg-success hover:text-white"
                  >
                    Knew it
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-8 text-sm text-text-muted">Tap to reveal</p>
            )}
          </div>
        </div>
      )}

      {/* Session stats */}
      {(sessionStats.correct > 0 || sessionStats.incorrect > 0) && (
        <div className="mt-4 flex justify-center gap-6 text-sm text-text-muted">
          <span className="text-success">{sessionStats.correct} correct</span>
          <span className="text-error">{sessionStats.incorrect} incorrect</span>
        </div>
      )}
    </div>
  );
}
