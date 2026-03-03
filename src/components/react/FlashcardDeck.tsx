import { useState, useEffect, useCallback } from "react";
import type { Question, DisplayMode, SRCard, SRRating } from "@lib/types";
import { loadQuestions } from "@lib/question-bank";
import { createCard, reviewCard, isDue, sortByPriority } from "@lib/spaced-repetition";
import { getAllSRCards, saveSRCard } from "@lib/progress-store";
import { usePronounce } from "@lib/use-pronounce";
import SpeakerButton from "./SpeakerButton";
import BilingualToggle from "./BilingualToggle";

type DeckState = "loading" | "studying" | "session-complete" | "all-done";

export default function FlashcardDeck() {
  const { speak, isSpeaking, isSupported } = usePronounce();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [deckState, setDeckState] = useState<DeckState>("loading");
  const [dueCards, setDueCards] = useState<SRCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("english");
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    gotIt: 0,
    notSure: 0,
    missed: 0,
  });

  const loadDeck = useCallback(async () => {
    const allQuestions = await loadQuestions();
    setQuestions(allQuestions);

    const storedCards = getAllSRCards();

    // Create cards for any questions not yet in SR system
    const allCards = allQuestions.map((q) => {
      return storedCards[q.id] || createCard(q.id);
    });

    // Get due cards sorted by priority
    const due = sortByPriority(allCards.filter(isDue));

    setDueCards(due);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionStats({ reviewed: 0, gotIt: 0, notSure: 0, missed: 0 });

    if (due.length === 0) {
      setDeckState("all-done");
    } else {
      setDeckState("studying");
    }
  }, []);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const currentCard = dueCards[currentCardIndex];
  const currentQuestion = currentCard
    ? questions.find((q) => q.id === currentCard.id)
    : null;

  const handleRate = (rating: SRRating) => {
    if (!currentCard) return;

    const updated = reviewCard(currentCard, rating);
    saveSRCard(updated);

    setSessionStats((prev) => ({
      reviewed: prev.reviewed + 1,
      gotIt: prev.gotIt + (rating === "got-it" ? 1 : 0),
      notSure: prev.notSure + (rating === "not-sure" ? 1 : 0),
      missed: prev.missed + (rating === "missed-it" ? 1 : 0),
    }));

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setDeckState("session-complete");
    }
  };

  if (deckState === "loading") {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Loading flashcards...</div>
      </div>
    );
  }

  if (deckState === "all-done") {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-navy mb-4">All caught up</h2>
        <p className="text-text-secondary mb-6">
          No cards are due for review right now. Come back later as cards become due based on your spaced repetition schedule.
        </p>
        <button onClick={loadDeck} className="btn-secondary">
          Check Again
        </button>
      </div>
    );
  }

  if (deckState === "session-complete") {
    const { reviewed, gotIt, notSure, missed } = sessionStats;
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-navy mb-4">Session complete</h2>
        <p className="text-text-secondary mb-6">{reviewed} cards reviewed</p>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
          <div className="p-3 bg-success-bg rounded-lg">
            <div className="text-2xl font-bold text-success">{gotIt}</div>
            <div className="text-xs text-text-muted">Got it</div>
          </div>
          <div className="p-3 bg-warning-bg rounded-lg">
            <div className="text-2xl font-bold text-warning">{notSure}</div>
            <div className="text-xs text-text-muted">Not sure</div>
          </div>
          <div className="p-3 bg-error-bg rounded-lg">
            <div className="text-2xl font-bold text-error">{missed}</div>
            <div className="text-xs text-text-muted">Missed</div>
          </div>
        </div>

        <button onClick={loadDeck} className="btn-primary">
          Study More
        </button>
      </div>
    );
  }

  // Studying state
  if (!currentQuestion) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Card not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Session progress */}
      <div className="flex items-center justify-between mb-4 text-sm text-text-muted">
        <span>
          Card {currentCardIndex + 1} of {dueCards.length} due
        </span>
        <BilingualToggle mode={displayMode} onChange={setDisplayMode} />
      </div>

      {/* Flashcard */}
      <div
        className="card cursor-pointer select-none min-h-[300px] flex flex-col justify-center hover:shadow-md hover:border-navy-light/30 transition-all duration-200"
        onClick={() => !isFlipped && setIsFlipped(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!isFlipped) setIsFlipped(true);
          }
        }}
        aria-label={isFlipped ? "Answer revealed" : "Tap to reveal answer"}
      >
        {!isFlipped ? (
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-4">
              Question
            </div>
            {currentQuestion.has_image && currentQuestion.image_ref && (
              <div className="flex justify-center mb-4">
                <img
                  src={`/${currentQuestion.image_ref}`}
                  alt="Road sign"
                  className="w-32 h-32 sm:w-40 sm:h-40"
                  loading="lazy"
                />
              </div>
            )}
            <p className="bilingual-spanish text-lg leading-relaxed mb-3 inline-flex items-start gap-2 justify-center text-center">
              <span>{currentQuestion.question_original}</span>
              <SpeakerButton text={currentQuestion.question_original} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="md" />
            </p>
            {displayMode !== "spanish" && (
              <p className={displayMode === "official" ? "bilingual-official" : "bilingual-english text-base"}>
                {displayMode === "official"
                  ? currentQuestion.question_official_en
                  : currentQuestion.question_translated}
              </p>
            )}

            <div className="mt-6 space-y-2">
              {currentQuestion.options.map((opt) => (
                <div key={opt.key} className="text-left p-3 rounded-lg border border-border">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-bold text-navy mr-2">{opt.key}.</span>
                    <span className="bilingual-spanish text-sm">
                      {opt.text_original}
                    </span>
                    <SpeakerButton text={opt.text_original} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="sm" />
                  </span>
                  {displayMode !== "spanish" && (
                    <p className={`mt-1 ml-6 text-sm ${displayMode === "official" ? "bilingual-official" : "bilingual-english"}`}>
                      {displayMode === "official"
                        ? opt.text_official_en
                        : opt.text_translated}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-text-muted">Tap to reveal answer</p>
          </div>
        ) : (
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-4 text-center">
              Answer
            </div>
            {currentQuestion.has_image && currentQuestion.image_ref && (
              <div className="flex justify-center mb-4">
                <img
                  src={`/${currentQuestion.image_ref}`}
                  alt="Road sign"
                  className="w-32 h-32 sm:w-40 sm:h-40"
                  loading="lazy"
                />
              </div>
            )}

            {/* Highlight correct answer */}
            <div className="space-y-2 mb-6">
              {currentQuestion.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`text-left p-3 rounded-lg border-2 ${
                    opt.is_correct
                      ? "border-success bg-success-bg"
                      : "border-border"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="font-bold text-navy mr-2">{opt.key}.</span>
                    <span className="bilingual-spanish text-sm">
                      {opt.text_original}
                    </span>
                    <SpeakerButton text={opt.text_original} speak={speak} isSpeaking={isSpeaking} isSupported={isSupported} size="sm" />
                  </span>
                  {displayMode !== "spanish" && (
                    <p className={`mt-1 ml-6 text-sm ${displayMode === "official" ? "bilingual-official" : "bilingual-english"}`}>
                      {displayMode === "official"
                        ? opt.text_official_en
                        : opt.text_translated}
                    </p>
                  )}
                  {opt.is_correct && (
                    <span className="ml-2 text-success font-semibold text-sm">
                      &#10003; Correct
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="p-4 bg-surface rounded-lg border border-border mb-6">
              <p className="text-sm text-text-secondary leading-relaxed">
                {currentQuestion.explanation_en}
              </p>
            </div>

            {/* Rating buttons */}
            <div className="text-center">
              <p className="text-sm text-text-muted mb-3">How well did you know this?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleRate("missed-it")}
                  className="btn bg-error-bg text-error border border-error/20 hover:bg-error hover:text-white"
                >
                  Missed it
                </button>
                <button
                  onClick={() => handleRate("not-sure")}
                  className="btn bg-warning-bg text-warning border border-warning/20 hover:bg-warning hover:text-white"
                >
                  Not sure
                </button>
                <button
                  onClick={() => handleRate("got-it")}
                  className="btn bg-success-bg text-success border border-success/20 hover:bg-success hover:text-white"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session stats */}
      {sessionStats.reviewed > 0 && (
        <div className="mt-4 flex justify-center gap-6 text-sm text-text-muted">
          <span className="text-success">{sessionStats.gotIt} got it</span>
          <span className="text-warning">{sessionStats.notSure} not sure</span>
          <span className="text-error">{sessionStats.missed} missed</span>
        </div>
      )}
    </div>
  );
}
