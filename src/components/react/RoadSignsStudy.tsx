import { useState, useEffect, useCallback } from "react";
import type { SignMetadata, NomSignCategory, Question } from "@lib/types";
import { loadSignMetadata, filterSignsByCategory, signCategoryInfo, signCategoryOrder } from "@lib/sign-data";
import { loadQuestions } from "@lib/question-bank";
import { usePronounce } from "@lib/use-pronounce";
import SpeakerButton from "./SpeakerButton";

type TabId = "gallery" | "quiz";
type QuizState = "loading" | "ready" | "answering" | "answered" | "session-complete";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RoadSignsStudy() {
  const { speak, isSpeaking, isSupported } = usePronounce();
  const [tab, setTab] = useState<TabId>("gallery");
  const [signs, setSigns] = useState<SignMetadata[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSignId, setLightboxSignId] = useState<string | null>(null);
  const [filterExam, setFilterExam] = useState(false);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>("ready");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    Promise.all([loadSignMetadata(), loadQuestions()])
      .then(([signData, questionData]) => {
        setSigns(signData);
        setQuestions(questionData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const signQuestions = questions.filter((q) => q.has_image && q.image_ref);
  const displaySigns = filterExam ? signs.filter((s) => s.examSign) : signs;

  const getQuestionForSign = (sign: SignMetadata): Question | undefined => {
    if (!sign.questionId) return undefined;
    return questions.find((q) => q.id === sign.questionId);
  };

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(signQuestions);
    setQuizQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedKey(null);
    setSessionStats({ correct: 0, incorrect: 0 });
    setQuizState("answering");
  }, [signQuestions]);

  const handleSelect = (key: string) => {
    if (selectedKey) return;
    setSelectedKey(key);
    const q = quizQuestions[currentIndex];
    const correct = q.options.find((o) => o.is_correct)?.key;
    const isCorrect = key === correct;
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
    setQuizState("answered");
  };

  const nextQuestion = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedKey(null);
      setQuizState("answering");
    } else {
      setQuizState("session-complete");
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Loading road signs...</div>
      </div>
    );
  }

  const examCount = signs.filter((s) => s.examSign).length;

  return (
    <div>
      {/* Tab selector */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="inline-flex rounded-lg border border-border bg-surface-white p-1">
          {(
            [
              { value: "gallery" as TabId, label: "Gallery" },
              { value: "quiz" as TabId, label: "Quiz" },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.value
                  ? "bg-navy text-white"
                  : "text-text-secondary hover:text-navy"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-text-muted">{displaySigns.length} signs</span>
      </div>

      {tab === "gallery" ? (
        <GalleryTab
          signs={displaySigns}
          allSigns={signs}
          getQuestionForSign={getQuestionForSign}
          lightboxSignId={lightboxSignId}
          setLightboxSignId={setLightboxSignId}
          speak={speak}
          isSpeaking={isSpeaking}
          isSupported={isSupported}
          filterExam={filterExam}
          setFilterExam={setFilterExam}
          examCount={examCount}
          totalCount={signs.length}
        />
      ) : (
        <QuizTab
          quizState={quizState}
          quizQuestions={quizQuestions}
          currentIndex={currentIndex}
          selectedKey={selectedKey}
          sessionStats={sessionStats}
          signQuestions={signQuestions}
          startQuiz={startQuiz}
          handleSelect={handleSelect}
          nextQuestion={nextQuestion}
        />
      )}
    </div>
  );
}

/* ─── Gallery Tab ─── */

interface GalleryProps {
  signs: SignMetadata[];
  allSigns: SignMetadata[];
  getQuestionForSign: (sign: SignMetadata) => Question | undefined;
  lightboxSignId: string | null;
  setLightboxSignId: (id: string | null) => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
  filterExam: boolean;
  setFilterExam: (v: boolean) => void;
  examCount: number;
  totalCount: number;
}

function GalleryTab({
  signs,
  allSigns,
  getQuestionForSign,
  lightboxSignId,
  setLightboxSignId,
  speak,
  isSpeaking,
  isSupported,
  filterExam,
  setFilterExam,
  examCount,
  totalCount,
}: GalleryProps) {
  // Build flat list of displayed signs for prev/next navigation
  const flatSigns: SignMetadata[] = [];
  for (const cat of signCategoryOrder) {
    const catSigns = signs.filter((s) => s.nomCategory === cat);
    flatSigns.push(...catSigns);
  }

  const lightboxSign = lightboxSignId
    ? flatSigns.find((s) => s.id === lightboxSignId) ?? null
    : null;

  const lightboxIndex = lightboxSign
    ? flatSigns.findIndex((s) => s.id === lightboxSign.id)
    : -1;

  return (
    <div>
      {/* Filter toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setFilterExam(false)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            !filterExam
              ? "bg-navy text-white border-navy"
              : "text-text-secondary border-border hover:border-navy-light"
          }`}
        >
          All Signs ({totalCount})
        </button>
        <button
          onClick={() => setFilterExam(true)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            filterExam
              ? "bg-navy text-white border-navy"
              : "text-text-secondary border-border hover:border-navy-light"
          }`}
        >
          Exam Signs ({examCount})
        </button>
      </div>

      {/* Color/Shape Guide */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-navy mb-3">Mexican Sign Categories (NOM-034-SCT)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {signCategoryOrder.map((cat) => {
            const info = signCategoryInfo[cat];
            return (
              <div key={cat} className={`rounded-lg p-3 border border-border ${info.bgColor}`}>
                <div className={`font-semibold text-sm ${info.color}`}>{info.name}</div>
                <div className="text-xs text-text-muted mt-0.5">{info.nameEs}</div>
                <div className="text-xs text-text-secondary mt-1">{info.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signs by category */}
      {signCategoryOrder.map((cat) => {
        const catSigns = signs.filter((s) => s.nomCategory === cat);
        if (catSigns.length === 0) return null;
        const info = signCategoryInfo[cat];

        return (
          <div key={cat} className="mb-8">
            <h3 className={`text-base font-semibold mb-3 ${info.color}`}>
              {info.name}
              <span className="text-text-muted font-normal text-sm ml-2">({catSigns.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {catSigns.map((sign) => (
                <SignCard
                  key={sign.id}
                  sign={sign}
                  onClick={() => setLightboxSignId(sign.id)}
                  speak={speak}
                  isSpeaking={isSpeaking}
                  isSupported={isSupported}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Lightbox Modal */}
      {lightboxSign && (
        <LightboxModal
          sign={lightboxSign}
          question={getQuestionForSign(lightboxSign)}
          onClose={() => setLightboxSignId(null)}
          onPrev={lightboxIndex > 0 ? () => setLightboxSignId(flatSigns[lightboxIndex - 1].id) : undefined}
          onNext={lightboxIndex < flatSigns.length - 1 ? () => setLightboxSignId(flatSigns[lightboxIndex + 1].id) : undefined}
          speak={speak}
          isSpeaking={isSpeaking}
          isSupported={isSupported}
          currentIndex={lightboxIndex}
          totalCount={flatSigns.length}
        />
      )}
    </div>
  );
}

/* ─── Sign Card (simplified — no accordion) ─── */

interface SignCardProps {
  sign: SignMetadata;
  onClick: () => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

function SignCard({ sign, onClick, speak, isSpeaking, isSupported }: SignCardProps) {
  return (
    <button
      onClick={onClick}
      className="card p-3 flex flex-col items-center text-center cursor-pointer group hover:shadow-md hover:-translate-y-0.5 transition-all w-full"
    >
      <div className="relative">
        <img
          src={`/${sign.signFile}`}
          alt={sign.nameEn}
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-2 group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {sign.examSign && (
          <span className="absolute -top-1 -right-1 bg-navy text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            EXAM
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-navy">{sign.nameEn}</span>
      <div className="flex items-center gap-1 justify-center">
        <span className="text-xs text-spanish">{sign.nameEs}</span>
        <SpeakerButton
          text={sign.nameEs}
          speak={speak}
          isSpeaking={isSpeaking}
          isSupported={isSupported}
          size="sm"
        />
      </div>
      <span className="text-[10px] text-text-muted mt-0.5">{sign.id}</span>
    </button>
  );
}

/* ─── Lightbox Modal ─── */

interface LightboxProps {
  sign: SignMetadata;
  question: Question | undefined;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
  currentIndex: number;
  totalCount: number;
}

function LightboxModal({
  sign,
  question,
  onClose,
  onPrev,
  onNext,
  speak,
  isSpeaking,
  isSupported,
  currentIndex,
  totalCount,
}: LightboxProps) {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={sign.nameEn}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />

      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-border transition-colors text-text-muted hover:text-navy"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-4 text-xs text-text-muted">
          {currentIndex + 1} / {totalCount}
        </div>

        {/* Sign image */}
        <div className="flex justify-center pt-12 pb-4 px-6">
          <img
            src={`/${sign.signFile}`}
            alt={sign.nameEn}
            className="w-40 h-40 sm:w-52 sm:h-52 object-contain"
          />
        </div>

        {/* Sign info */}
        <div className="px-6 pb-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-navy">{sign.nameEn}</h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-base text-spanish">{sign.nameEs}</span>
              <SpeakerButton
                text={sign.nameEs}
                speak={speak}
                isSpeaking={isSpeaking}
                isSupported={isSupported}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded">{sign.id}</span>
              {sign.examSign && (
                <span className="text-xs font-bold text-white bg-navy px-2 py-0.5 rounded-full">EXAM</span>
              )}
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-4">{sign.description}</p>

          {question && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-navy mb-2">Exam Question</h4>
              <p className="text-sm text-text-secondary mb-2">{question.explanation_en}</p>
              {question.vocabulary.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-navy">Key Vocabulary</span>
                  <ul className="mt-1 space-y-1">
                    {question.vocabulary.map((v) => (
                      <li key={v.es} className="flex items-center gap-1 text-xs">
                        <span className="text-spanish">{v.es}</span>
                        <SpeakerButton
                          text={v.es}
                          speak={speak}
                          isSpeaking={isSpeaking}
                          isSupported={isSupported}
                          size="sm"
                        />
                        <span className="text-text-muted">— {v.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prev/Next arrows */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors text-navy"
            aria-label="Previous sign"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors text-navy"
            aria-label="Next sign"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Quiz Tab ─── */

interface QuizProps {
  quizState: QuizState;
  quizQuestions: Question[];
  currentIndex: number;
  selectedKey: string | null;
  sessionStats: { correct: number; incorrect: number };
  signQuestions: Question[];
  startQuiz: () => void;
  handleSelect: (key: string) => void;
  nextQuestion: () => void;
}

function QuizTab({
  quizState,
  quizQuestions,
  currentIndex,
  selectedKey,
  sessionStats,
  signQuestions,
  startQuiz,
  handleSelect,
  nextQuestion,
}: QuizProps) {
  if (signQuestions.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">No sign questions found.</div>
      </div>
    );
  }

  if (quizState === "ready") {
    return (
      <div className="card text-center py-10">
        <h2 className="text-2xl font-bold text-navy mb-2">Sign Recognition Quiz</h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          Identify {signQuestions.length} Mexican road signs from the official Jalisco exam.
          You'll see a sign and pick what it means from the answer options.
        </p>
        <button onClick={startQuiz} className="btn-primary">
          Start Quiz
        </button>
      </div>
    );
  }

  if (quizState === "session-complete") {
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
        <button onClick={startQuiz} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // answering / answered
  const q = quizQuestions[currentIndex];
  if (!q) return null;

  const correctKey = q.options.find((o) => o.is_correct)?.key;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-text-muted">
          Sign {currentIndex + 1} of {quizQuestions.length}
        </span>
        {(sessionStats.correct > 0 || sessionStats.incorrect > 0) && (
          <div className="flex gap-4 text-sm">
            <span className="text-success">{sessionStats.correct} correct</span>
            <span className="text-error">{sessionStats.incorrect} incorrect</span>
          </div>
        )}
      </div>

      <div className="card">
        {/* Sign image */}
        <div className="flex justify-center mb-6">
          <img
            src={`/${q.image_ref}`}
            alt="What does this sign indicate?"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
          />
        </div>

        <p className="text-center text-sm text-text-secondary mb-4">
          What does this sign indicate?
        </p>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isCorrect = opt.key === correctKey;
            let classes =
              "border-border hover:border-navy-light hover:shadow-sm hover:-translate-y-px cursor-pointer";

            if (selectedKey) {
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
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={!!selectedKey}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all touch-target ${classes}`}
              >
                <span className="font-medium text-navy mr-2">{opt.key}.</span>
                <span>{opt.text_translated}</span>
                <span className="block text-xs text-spanish mt-0.5">{opt.text_original}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation after answer */}
        {quizState === "answered" && (
          <div className="mt-4 p-3 bg-surface rounded-lg border border-border">
            <p className="text-sm text-text-secondary">{q.explanation_en}</p>
          </div>
        )}

        {/* Next button */}
        {quizState === "answered" && (
          <div className="mt-4 text-center">
            <button onClick={nextQuestion} className="btn-primary">
              {currentIndex < quizQuestions.length - 1 ? "Next Sign" : "See Results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
