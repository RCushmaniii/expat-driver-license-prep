interface Props {
  current: number;
  total: number;
  correctCount: number;
  passingScore: number;
}

export default function StickyProgress({
  current,
  total,
  correctCount,
  passingScore,
}: Props) {
  const progress = Math.round((current / total) * 100);
  const answered = current;
  const remaining = total - current;
  const canStillPass = correctCount + remaining >= passingScore;
  const currentlyPassing = correctCount >= passingScore;

  let statusColor = "bg-navy";
  let statusText = `${correctCount}/${total} correct`;
  if (answered > 0) {
    if (currentlyPassing) {
      statusColor = "bg-success";
      statusText = `${correctCount}/${answered} correct — Passing`;
    } else if (!canStillPass) {
      statusColor = "bg-error";
      statusText = `${correctCount}/${answered} correct — Cannot pass`;
    } else {
      statusColor = "bg-warning";
      statusText = `${correctCount}/${answered} correct — Need ${passingScore - correctCount} more`;
    }
  }

  return (
    <div className="sticky bottom-0 md:top-16 z-40 bg-surface-white/95 backdrop-blur border-t md:border-b md:border-t-0 border-border px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-secondary">
            Question {Math.min(current + 1, total)} of {total}
          </span>
          <span className="text-text-secondary font-medium">{statusText}</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${statusColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
