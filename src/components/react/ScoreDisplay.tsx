import type { Question, QuestionResult, DisplayMode } from "@lib/types";

interface Props {
  results: QuestionResult[];
  questions: Question[];
  passingScore: number;
  totalQuestions: number;
  displayMode: DisplayMode;
  onRestart: () => void;
  onReviewQuestion: (index: number) => void;
}

export default function ScoreDisplay({
  results,
  questions,
  passingScore,
  totalQuestions,
  displayMode,
  onRestart,
  onReviewQuestion,
}: Props) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = correctCount >= passingScore;

  const missedResults = results
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => !r.isCorrect);

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className={`card text-center ${passed ? "border-success" : "border-error"}`}>
        <div className={`text-5xl font-bold mb-2 ${passed ? "text-success" : "text-error"}`}>
          {correctCount}/{totalQuestions}
        </div>
        <div className="text-lg text-text-secondary mb-1">{percentage}% correct</div>
        <div className={`text-sm font-medium ${passed ? "text-success" : "text-error"}`}>
          {passed
            ? `Passed — needed ${passingScore}/${totalQuestions}`
            : `Did not pass — needed ${passingScore}/${totalQuestions}`}
        </div>
      </div>

      {/* Missed questions review */}
      {missedResults.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">
            Review missed questions ({missedResults.length})
          </h3>
          <div className="space-y-3">
            {missedResults.map((r) => {
              const q = questions.find((q) => q.id === r.questionId);
              if (!q) return null;
              return (
                <button
                  key={r.questionId}
                  onClick={() => onReviewQuestion(r.index)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-navy-light transition-colors"
                >
                  <div className="text-sm text-text-muted mb-1">
                    Question {r.index + 1}
                  </div>
                  <p className="text-sm font-medium text-text-primary line-clamp-2">
                    {displayMode === "spanish"
                      ? q.question_original
                      : displayMode === "official"
                        ? q.question_official_en
                        : q.question_translated}
                  </p>
                  <div className="mt-1 text-xs">
                    <span className="text-error">
                      Your answer: {r.selectedKey}
                    </span>
                    <span className="text-text-muted mx-2">|</span>
                    <span className="text-success">
                      Correct: {r.correctKey}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-4">Category breakdown</h3>
        <div className="space-y-3">
          {(() => {
            const catMap = new Map<string, { correct: number; total: number }>();
            results.forEach((r) => {
              const q = questions.find((q) => q.id === r.questionId);
              if (!q) return;
              const cat = q.category;
              const entry = catMap.get(cat) || { correct: 0, total: 0 };
              entry.total += 1;
              if (r.isCorrect) entry.correct += 1;
              catMap.set(cat, entry);
            });

            return Array.from(catMap.entries()).map(([cat, data]) => {
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-primary capitalize">
                      {cat.replace(/-/g, " ")}
                    </span>
                    <span className="text-text-muted">
                      {data.correct}/{data.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${
                        pct >= 80
                          ? "bg-success"
                          : pct >= 50
                            ? "bg-warning"
                            : "bg-error"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Restart button */}
      <div className="text-center">
        <button onClick={onRestart} className="btn-primary">
          Take Another Exam
        </button>
      </div>
    </div>
  );
}
