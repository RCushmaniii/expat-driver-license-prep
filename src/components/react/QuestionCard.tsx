import type { Question, DisplayMode } from "@lib/types";

interface Props {
  question: Question;
  displayMode: DisplayMode;
  selectedKey: string | null;
  showAnswer: boolean;
  onSelect: (key: string) => void;
  questionNumber?: number;
  totalQuestions?: number;
}

function getQuestionText(q: Question, mode: DisplayMode): string {
  switch (mode) {
    case "spanish":
      return q.question_original;
    case "english":
      return q.question_translated;
    case "official":
      return q.question_official_en;
  }
}

function getOptionText(
  opt: Question["options"][0],
  mode: DisplayMode
): string {
  switch (mode) {
    case "spanish":
      return opt.text_original;
    case "english":
      return opt.text_translated;
    case "official":
      return opt.text_official_en;
  }
}

export default function QuestionCard({
  question,
  displayMode,
  selectedKey,
  showAnswer,
  onSelect,
  questionNumber,
  totalQuestions,
}: Props) {
  const correctKey = question.options.find((o) => o.is_correct)?.key;

  return (
    <div className="card">
      {questionNumber != null && totalQuestions != null && (
        <div className="text-sm text-text-muted mb-2">
          Question {questionNumber} of {totalQuestions}
        </div>
      )}

      {/* Sign image */}
      {question.has_image && question.image_ref && (
        <div className="flex justify-center mb-4">
          <img
            src={`/${question.image_ref}`}
            alt="Road sign"
            className="w-32 h-32 sm:w-40 sm:h-40"
            loading="lazy"
          />
        </div>
      )}

      {/* Question text */}
      <div className="mb-6">
        {displayMode === "spanish" ? (
          <p className="bilingual-spanish text-lg leading-relaxed">
            {getQuestionText(question, "spanish")}
          </p>
        ) : displayMode === "english" ? (
          <>
            <p className="bilingual-spanish text-lg leading-relaxed">
              {getQuestionText(question, "spanish")}
            </p>
            <p className="bilingual-english mt-2 text-base">
              {getQuestionText(question, "english")}
            </p>
          </>
        ) : (
          <>
            <p className="bilingual-spanish text-lg leading-relaxed">
              {getQuestionText(question, "spanish")}
            </p>
            <p className="bilingual-official mt-2">
              {getQuestionText(question, "official")}
            </p>
          </>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          const isCorrect = opt.is_correct;
          let borderClass = "border-border";
          let bgClass = "bg-surface-white";

          if (showAnswer) {
            if (isCorrect) {
              borderClass = "border-success";
              bgClass = "bg-success-bg";
            } else if (isSelected && !isCorrect) {
              borderClass = "border-error";
              bgClass = "bg-error-bg";
            }
          } else if (isSelected) {
            borderClass = "border-navy";
            bgClass = "bg-surface";
          }

          return (
            <button
              key={opt.key}
              onClick={() => !showAnswer && onSelect(opt.key)}
              disabled={showAnswer}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 touch-target ${borderClass} ${bgClass} ${
                !showAnswer ? "hover:border-navy-light hover:shadow-sm hover:-translate-y-px cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-bold text-navy shrink-0 mt-0.5">
                  {opt.key}.
                </span>
                <div className="flex-1">
                  {displayMode === "spanish" ? (
                    <p className="bilingual-spanish">
                      {getOptionText(opt, "spanish")}
                    </p>
                  ) : displayMode === "english" ? (
                    <>
                      <p className="bilingual-spanish">
                        {getOptionText(opt, "spanish")}
                      </p>
                      <p className="bilingual-english mt-1 text-sm">
                        {getOptionText(opt, "english")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="bilingual-spanish">
                        {getOptionText(opt, "spanish")}
                      </p>
                      <p className="bilingual-official mt-1">
                        {getOptionText(opt, "official")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showAnswer && (
        <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
          <h4 className="font-semibold text-navy text-sm mb-2">Explanation</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {question.explanation_en}
          </p>
          {question.vocabulary.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <h5 className="font-semibold text-navy text-xs mb-2 uppercase tracking-wider">
                Key Vocabulary
              </h5>
              <div className="flex flex-wrap gap-2">
                {question.vocabulary.map((v) => (
                  <span
                    key={v.es}
                    className="inline-block text-xs bg-surface-white border border-border rounded px-2 py-1"
                  >
                    <span className="font-medium text-spanish">{v.es}</span>
                    <span className="text-text-muted mx-1">—</span>
                    <span className="text-english">{v.en}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
