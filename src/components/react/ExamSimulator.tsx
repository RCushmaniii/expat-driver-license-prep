import { useState, useEffect, useCallback } from "react";
import type { Question, QuestionResult, DisplayMode, ExamAttempt } from "@lib/types";
import { loadQuestions, generateExam } from "@lib/question-bank";
import { saveExamAttempt } from "@lib/progress-store";
import BilingualToggle from "./BilingualToggle";
import QuestionCard from "./QuestionCard";
import StickyProgress from "./StickyProgress";
import ScoreDisplay from "./ScoreDisplay";

type ExamState = "ready" | "in-progress" | "review" | "complete";

interface Props {
  questionsPerExam: number;
  passingScore: number;
  timeLimitMinutes: number;
  region: string;
}

export default function ExamSimulator({
  questionsPerExam,
  passingScore,
  timeLimitMinutes,
  region,
}: Props) {
  const [state, setState] = useState<ExamState>("ready");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("english");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  useEffect(() => {
    loadQuestions()
      .then((q) => {
        setAllQuestions(q);
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to load questions. Please refresh the page.");
        setLoading(false);
      });
  }, []);

  const startExam = useCallback(() => {
    const exam = generateExam(allQuestions, questionsPerExam);
    setExamQuestions(exam);
    setCurrentIndex(0);
    setAnswers({});
    setShowAnswer(false);
    setResults([]);
    setReviewIndex(null);
    setState("in-progress");
  }, [allQuestions, questionsPerExam]);

  const selectAnswer = (key: string) => {
    if (showAnswer) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    const questionResults: QuestionResult[] = examQuestions.map((q, i) => {
      const selected = answers[i] || "";
      const correct = q.options.find((o) => o.is_correct)?.key || "";
      return {
        questionId: q.id,
        selectedKey: selected,
        correctKey: correct,
        isCorrect: selected === correct,
      };
    });

    setResults(questionResults);

    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    const attempt: ExamAttempt = {
      id: `exam-${Date.now()}`,
      date: new Date().toISOString(),
      region,
      totalQuestions: questionsPerExam,
      correctCount,
      passed: correctCount >= passingScore,
      questionResults,
    };
    saveExamAttempt(attempt);

    setState("complete");
  };

  const handleReviewQuestion = (index: number) => {
    setReviewIndex(index);
    setCurrentIndex(index);
    setShowAnswer(true);
    setState("review");
  };

  const backToResults = () => {
    setReviewIndex(null);
    setState("complete");
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-error">{error}</div>
      </div>
    );
  }

  // Ready state
  if (state === "ready") {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-navy mb-4">Practice Exam</h2>
        <p className="text-text-secondary mb-2">
          {questionsPerExam} questions randomly selected from {allQuestions.length} in the question bank
        </p>
        <p className="text-text-secondary mb-2">
          Pass: {passingScore}/{questionsPerExam} correct ({Math.round((passingScore / questionsPerExam) * 100)}%)
        </p>
        <p className="text-text-secondary mb-6">
          Time limit: {timeLimitMinutes} minutes (not enforced in practice mode)
        </p>

        <div className="mb-6">
          <label className="text-sm text-text-muted mb-2 block">Display language</label>
          <BilingualToggle mode={displayMode} onChange={setDisplayMode} />
        </div>

        <button onClick={startExam} className="btn-primary text-lg px-10">
          Start Exam
        </button>
      </div>
    );
  }

  // Review a specific missed question
  if (state === "review" && reviewIndex !== null) {
    const q = examQuestions[reviewIndex];
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={backToResults}
            className="btn-ghost text-sm"
          >
            &larr; Back to results
          </button>
        </div>
        <div className="mb-4 flex justify-end">
          <BilingualToggle mode={displayMode} onChange={setDisplayMode} />
        </div>
        <QuestionCard
          question={q}
          displayMode={displayMode}
          selectedKey={answers[reviewIndex] || null}
          showAnswer={true}
          onSelect={() => {}}
          questionNumber={reviewIndex + 1}
          totalQuestions={questionsPerExam}
        />
      </div>
    );
  }

  // In-progress state
  if (state === "in-progress") {
    const correctSoFar = Object.entries(answers).filter(([i]) => {
      const idx = parseInt(i);
      const q = examQuestions[idx];
      return q && answers[idx] === q.options.find((o) => o.is_correct)?.key;
    }).length;

    return (
      <div>
        <StickyProgress
          current={Object.keys(answers).length}
          total={questionsPerExam}
          correctCount={correctSoFar}
          passingScore={passingScore}
        />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-4 flex justify-end">
            <BilingualToggle mode={displayMode} onChange={setDisplayMode} />
          </div>

          <QuestionCard
            question={examQuestions[currentIndex]}
            displayMode={displayMode}
            selectedKey={answers[currentIndex] || null}
            showAnswer={showAnswer}
            onSelect={selectAnswer}
            questionNumber={currentIndex + 1}
            totalQuestions={questionsPerExam}
          />

          {showAnswer && (
            <div className="mt-6 text-center">
              <button onClick={nextQuestion} className="btn-primary">
                {currentIndex < examQuestions.length - 1
                  ? "Next Question"
                  : "See Results"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Complete state
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4 flex justify-end">
        <BilingualToggle mode={displayMode} onChange={setDisplayMode} />
      </div>
      <ScoreDisplay
        results={results}
        questions={examQuestions}
        passingScore={passingScore}
        totalQuestions={questionsPerExam}
        displayMode={displayMode}
        onRestart={startExam}
        onReviewQuestion={handleReviewQuestion}
      />
    </div>
  );
}
