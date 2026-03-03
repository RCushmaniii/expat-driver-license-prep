import { useState, useEffect } from "react";
import type { StudyProgress, ExamAttempt } from "@lib/types";
import { getProgress, getStats, clearProgress } from "@lib/progress-store";

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setProgress(getProgress());
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
          Start studying to see your progress here. Try a practice exam, flashcards, or vocabulary drill.
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

  const handleClear = () => {
    clearProgress();
    setProgress(getProgress());
    setShowClearConfirm(false);
  };

  // Category mastery from exam history
  const categoryStats = new Map<string, { correct: number; total: number }>();
  progress.examHistory.forEach((exam) => {
    exam.questionResults.forEach((r) => {
      // We'd need question data for category. Use ID prefix as fallback.
      // For now, track overall correctness per question ID
    });
  });

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-navy">{stats.totalExams}</div>
          <div className="text-sm text-text-muted mt-1">Exams taken</div>
        </div>
        <div className="card text-center">
          <div className={`text-3xl font-bold ${stats.passRate >= 80 ? "text-success" : stats.passRate >= 50 ? "text-warning" : "text-error"}`}>
            {stats.passRate}%
          </div>
          <div className="text-sm text-text-muted mt-1">Pass rate</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-navy">{stats.cardsStudied}</div>
          <div className="text-sm text-text-muted mt-1">Cards studied</div>
        </div>
        <div className="card text-center">
          <div className={`text-3xl font-bold ${stats.cardsDue > 0 ? "text-warning" : "text-success"}`}>
            {stats.cardsDue}
          </div>
          <div className="text-sm text-text-muted mt-1">Cards due</div>
        </div>
      </div>

      {/* Exam History */}
      {progress.examHistory.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Exam history</h3>
          <div className="space-y-3">
            {[...progress.examHistory].reverse().slice(0, 10).map((exam) => (
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
              <div className="text-sm text-text-muted mb-1">Cards in system</div>
              <div className="text-xl font-bold text-navy">{stats.cardsStudied}</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Due for review</div>
              <div className={`text-xl font-bold ${stats.cardsDue > 0 ? "text-warning" : "text-success"}`}>
                {stats.cardsDue}
              </div>
            </div>
          </div>
          {stats.cardsDue > 0 && (
            <a
              href="/countries/mexico/jalisco/study"
              className="btn-primary mt-4 w-full sm:w-auto"
            >
              Study {stats.cardsDue} due card{stats.cardsDue !== 1 ? "s" : ""}
            </a>
          )}
        </div>
      )}

      {/* Vocabulary Progress */}
      {stats.vocabTermsSeen > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Vocabulary</h3>
          <p className="text-sm text-text-secondary">
            {stats.vocabTermsSeen} terms practiced
          </p>
          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-navy"
                style={{ width: `${Math.min(100, Math.round((stats.vocabTermsSeen / 150) * 100))}%` }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1">
              {stats.vocabTermsSeen} terms seen
            </div>
          </div>
        </div>
      )}

      {/* Clear data */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-2">Data management</h3>
        <p className="text-sm text-text-secondary mb-4">
          All study data is stored locally in your browser. No data is sent to any server.
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
