import { useState, useEffect } from "react";
import type { StudyProgress, ExamAttempt, Question } from "@lib/types";
import { getProgress, getStats, clearProgress } from "@lib/progress-store";
import { loadQuestions } from "@lib/question-bank";
import { computeReadiness } from "@lib/readiness";
import type { ReadinessAssessment, ConfidenceLevel } from "@lib/readiness";

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalVocab, setTotalVocab] = useState(0);
  const [readiness, setReadiness] = useState<ReadinessAssessment | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const prog = getProgress();
    setProgress(prog);

    // Load question bank + vocab count for readiness computation
    Promise.all([
      loadQuestions(),
      fetch("/data/jalisco/vocabulary.json")
        .then((r) => r.json())
        .then((data: unknown[]) => data.length)
        .catch(() => 0),
    ]).then(([qs, vocabCount]) => {
      setQuestions(qs);
      setTotalVocab(vocabCount);
      setReadiness(computeReadiness(prog, qs, vocabCount));
    });
  }, []);

  if (!progress) {
    return (
      <div className="card text-center py-12">
        <div className="text-text-muted">Loading progress...</div>
      </div>
    );
  }

  const stats = getStats();
  const hasData =
    stats.totalExams > 0 || stats.cardsStudied > 0 || stats.vocabTermsSeen > 0;

  if (!hasData) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-navy mb-4">No study data yet</h2>
        <p className="text-text-secondary mb-6">
          Start studying to see your progress here. Try a practice exam,
          flashcards, or vocabulary drill.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/countries/mexico/jalisco/exam" className="btn-primary">
            Practice Exam
          </a>
          <a href="/countries/mexico/jalisco/study" className="btn-secondary">
            Flashcards
          </a>
          <a href="/countries/mexico/jalisco/vocabulary" className="btn-secondary">
            Vocabulary
          </a>
        </div>
      </div>
    );
  }

  const handleAiAnalysis = async () => {
    if (!readiness) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readinessScore: readiness.overallScore,
          confidenceLevel: readiness.confidenceLevel,
          categoryBreakdown: readiness.categoryScores.map((c) => ({
            category: c.displayName,
            accuracy: c.accuracy,
            questionsSeen: c.questionsSeen,
          })),
          examCount: stats.totalExams,
          passRate: stats.passRate,
          weakestCategory: readiness.weakestCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAiAnalysis(data.analysis);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleClear = () => {
    clearProgress();
    setProgress(getProgress());
    setReadiness(null);
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Readiness Assessment */}
      {readiness && (
        <ReadinessCard
          assessment={readiness}
          aiAnalysis={aiAnalysis}
          aiLoading={aiLoading}
          aiError={aiError}
          onRequestAi={handleAiAnalysis}
        />
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-navy">{stats.totalExams}</div>
          <div className="text-sm text-text-muted mt-1">Exams taken</div>
        </div>
        <div className="card text-center">
          <div
            className={`text-3xl font-bold ${
              stats.passRate >= 80
                ? "text-success"
                : stats.passRate >= 50
                  ? "text-warning"
                  : "text-error"
            }`}
          >
            {stats.passRate}%
          </div>
          <div className="text-sm text-text-muted mt-1">Pass rate</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-navy">
            {stats.cardsStudied}
          </div>
          <div className="text-sm text-text-muted mt-1">Cards studied</div>
        </div>
        <div className="card text-center">
          <div
            className={`text-3xl font-bold ${
              stats.cardsDue > 0 ? "text-warning" : "text-success"
            }`}
          >
            {stats.cardsDue}
          </div>
          <div className="text-sm text-text-muted mt-1">Cards due</div>
        </div>
      </div>

      {/* Category Mastery */}
      {readiness && readiness.categoryScores.length > 0 && (
        <CategoryMasteryCard scores={readiness.categoryScores} />
      )}

      {/* Exam History */}
      {progress.examHistory.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Exam history</h3>
          <div className="space-y-3">
            {[...progress.examHistory]
              .reverse()
              .slice(0, 10)
              .map((exam) => (
                <ExamHistoryRow key={exam.id} exam={exam} />
              ))}
          </div>
        </div>
      )}

      {/* SR Overview */}
      {stats.cardsStudied > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Spaced repetition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-text-muted mb-1">
                Cards in system
              </div>
              <div className="text-xl font-bold text-navy">
                {stats.cardsStudied}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">
                Due for review
              </div>
              <div
                className={`text-xl font-bold ${
                  stats.cardsDue > 0 ? "text-warning" : "text-success"
                }`}
              >
                {stats.cardsDue}
              </div>
            </div>
          </div>
          {stats.cardsDue > 0 && (
            <a
              href="/countries/mexico/jalisco/study"
              className="btn-primary mt-4 w-full sm:w-auto"
            >
              Study {stats.cardsDue} due card
              {stats.cardsDue !== 1 ? "s" : ""}
            </a>
          )}
        </div>
      )}

      {/* Vocabulary Progress */}
      {stats.vocabTermsSeen > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Vocabulary</h3>
          <p className="text-sm text-text-secondary">
            {stats.vocabTermsSeen} of {totalVocab || "—"} terms practiced
          </p>
          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-navy"
                style={{
                  width: `${totalVocab > 0 ? Math.min(100, Math.round((stats.vocabTermsSeen / totalVocab) * 100)) : 0}%`,
                }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1">
              {totalVocab > 0
                ? `${Math.round((stats.vocabTermsSeen / totalVocab) * 100)}% coverage`
                : `${stats.vocabTermsSeen} terms seen`}
            </div>
          </div>
        </div>
      )}

      {/* Clear data */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-2">Data management</h3>
        <p className="text-sm text-text-secondary mb-4">
          All study data is stored locally in your browser. No data is sent to
          any server.
        </p>
        {showClearConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-error font-medium">
              This will permanently delete all your progress.
            </span>
            <button
              onClick={handleClear}
              className="btn bg-error text-white hover:bg-error/90 text-sm py-2 px-4"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="btn-ghost text-sm py-2 px-4"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-error hover:underline"
          >
            Clear all study data
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Readiness Card ──────────────────────────────────────────

function ReadinessCard({
  assessment,
  aiAnalysis,
  aiLoading,
  aiError,
  onRequestAi,
}: {
  assessment: ReadinessAssessment;
  aiAnalysis: string | null;
  aiLoading: boolean;
  aiError: string | null;
  onRequestAi: () => void;
}) {
  const { overallScore, confidenceLevel, confidenceLabel, confidenceDetail, factors, weakestCategory, recommendation } =
    assessment;

  const ringColor = levelColor(confidenceLevel);
  const ringBg = levelBgColor(confidenceLevel);

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Confidence ring */}
        <div className="shrink-0">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-border"
              />
              {/* Progress ring */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 327} 327`}
                className={ringColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${ringColor}`}>
                {overallScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-bold text-navy mb-1">
            Exam Readiness
          </h3>
          <div className={`inline-block text-sm font-medium px-3 py-1 rounded-full mb-2 ${ringBg} ${ringColor}`}>
            {confidenceLabel}
          </div>
          <p className="text-sm text-text-secondary mb-3">
            {confidenceDetail}
          </p>

          {/* Recommendation */}
          <div className="p-3 rounded-lg bg-surface border border-border">
            <p className="text-sm text-text-primary font-medium">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          What's driving your score
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <FactorBar label="Exam scores" value={factors.examPerformance} weight={35} />
          <FactorBar label="Category depth" value={factors.categoryCoverage} weight={25} />
          <FactorBar label="Questions seen" value={factors.questionCoverage} weight={20} />
          <FactorBar label="Flashcard mastery" value={factors.srMastery} weight={10} />
          <FactorBar label="Vocab" value={factors.vocabMastery} weight={10} />
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mt-6 pt-6 border-t border-border">
        {aiAnalysis ? (
          <div className="p-4 rounded-lg bg-navy/5 border border-navy/10">
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">
              AI Study Coach
            </h4>
            <p className="text-sm text-text-primary leading-relaxed">
              {aiAnalysis}
            </p>
            <button
              onClick={onRequestAi}
              disabled={aiLoading}
              className="mt-3 text-xs text-text-muted hover:text-navy transition-colors"
            >
              Refresh analysis
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={onRequestAi}
              disabled={aiLoading}
              className="btn-secondary text-sm py-2 px-4"
            >
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "AI Analysis"
              )}
            </button>
            {aiError && (
              <p className="text-xs text-error mt-2">{aiError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FactorBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: number;
}) {
  const barColor =
    value >= 80
      ? "bg-success"
      : value >= 50
        ? "bg-warning"
        : value > 0
          ? "bg-error"
          : "bg-border";

  return (
    <div>
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-[10px] text-text-muted mt-0.5">{weight}% weight</div>
    </div>
  );
}

// ─── Category Mastery Card ───────────────────────────────────

function CategoryMasteryCard({
  scores,
}: {
  scores: ReadinessAssessment["categoryScores"];
}) {
  const hasAnySeen = scores.some((s) => s.questionsSeen > 0);
  if (!hasAnySeen) return null;

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4">Category mastery</h3>
      <div className="space-y-3">
        {scores.map((cat) => {
          const barColor =
            cat.status === "strong"
              ? "bg-success"
              : cat.status === "moderate"
                ? "bg-warning"
                : cat.status === "weak"
                  ? "bg-error"
                  : "bg-border";

          const statusLabel =
            cat.status === "unseen"
              ? "Not yet studied"
              : `${cat.accuracy}% accuracy`;

          return (
            <div key={cat.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-primary font-medium">
                  {cat.displayName}
                </span>
                <span className="text-text-muted">
                  {cat.status === "unseen"
                    ? "—"
                    : `${cat.questionsSeen}/${cat.questionsInBank} questions`}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${barColor}`}
                  style={{ width: cat.status === "unseen" ? "0%" : `${cat.accuracy}%` }}
                />
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {statusLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exam History Row ────────────────────────────────────────

function ExamHistoryRow({ exam }: { exam: ExamAttempt }) {
  const pct = Math.round((exam.correctCount / exam.totalQuestions) * 100);
  const date = new Date(exam.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
      <div>
        <div className="text-sm font-medium text-text-primary">
          {exam.correctCount}/{exam.totalQuestions} correct ({pct}%)
        </div>
        <div className="text-xs text-text-muted">{date}</div>
      </div>
      <span
        className={`text-sm font-medium px-3 py-1 rounded-full ${
          exam.passed
            ? "bg-success-bg text-success"
            : "bg-error-bg text-error"
        }`}
      >
        {exam.passed ? "Passed" : "Did not pass"}
      </span>
    </div>
  );
}

// ─── Color helpers ───────────────────────────────────────────

function levelColor(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "text-success";
    case "moderate":
      return "text-navy";
    case "building":
      return "text-warning";
    case "early":
      return "text-error";
  }
}

function levelBgColor(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "bg-success-bg";
    case "moderate":
      return "bg-surface";
    case "building":
      return "bg-warning-bg";
    case "early":
      return "bg-error-bg";
  }
}
