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
  const [expandedSign, setExpandedSign] = useState<string | null>(null);
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
          getQuestionForSign={getQuestionForSign}
          expandedSign={expandedSign}
          setExpandedSign={setExpandedSign}
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
  getQuestionForSign: (sign: SignMetadata) => Question | undefined;
  expandedSign: string | null;
  setExpandedSign: (id: string | null) => void;
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
  getQuestionForSign,
  expandedSign,
  setExpandedSign,
  speak,
  isSpeaking,
  isSupported,
  filterExam,
  setFilterExam,
  examCount,
  totalCount,
}: GalleryProps) {
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
                  question={getQuestionForSign(sign)}
                  isExpanded={expandedSign === sign.id}
                  onToggle={() =>
                    setExpandedSign(expandedSign === sign.id ? null : sign.id)
                  }
                  speak={speak}
                  isSpeaking={isSpeaking}
                  isSupported={isSupported}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Sign Card ─── */

interface SignCardProps {
  sign: SignMetadata;
  question: Question | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

function SignCard({
  sign,
  question,
  isExpanded,
  onToggle,
  speak,
  isSpeaking,
  isSupported,
}: SignCardProps) {
  return (
    <div className="card p-3 flex flex-col items-center text-center">
      <button
        onClick={onToggle}
        className="w-full flex flex-col items-center cursor-pointer group"
        aria-expanded={isExpanded}
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
        <div className="flex items-center gap-1 justify-center flex-wrap">
          <span className="text-sm font-medium text-navy">{sign.nameEn}</span>
        </div>
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
        <svg
          className={`w-4 h-4 text-text-muted mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border w-full text-left text-xs">
          <p className="text-text-secondary mb-2">{sign.description}</p>
          {question && (
            <>
              <p className="text-text-secondary mb-1">
                <span className="font-medium text-navy">Explanation:</span>{" "}
                {question.explanation_en}
              </p>
              {question.vocabulary.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-navy">Key vocabulary:</span>
                  <ul className="mt-1 space-y-0.5">
                    {question.vocabulary.map((v) => (
                      <li key={v.es} className="flex items-center gap-1">
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
            </>
          )}
        </div>
      )}
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
