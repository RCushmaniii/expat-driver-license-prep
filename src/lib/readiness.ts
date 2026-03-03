import type {
  Question,
  QuestionCategory,
  StudyProgress,
  SRCard,
} from "./types";
import { categoryDisplayName } from "./question-bank";

// ─── Public types ────────────────────────────────────────────

export interface CategoryScore {
  category: QuestionCategory;
  displayName: string;
  accuracy: number; // 0–100
  questionsSeen: number;
  questionsInBank: number;
  status: "strong" | "moderate" | "weak" | "unseen";
}

export interface ReadinessFactors {
  examPerformance: number; // 0–100
  categoryCoverage: number; // 0–100
  questionCoverage: number; // 0–100
  srMastery: number; // 0–100
  vocabMastery: number; // 0–100
}

export type ConfidenceLevel = "high" | "moderate" | "building" | "early";

export interface ReadinessAssessment {
  overallScore: number; // 0–100
  confidenceLevel: ConfidenceLevel;
  confidenceLabel: string;
  confidenceDetail: string;
  factors: ReadinessFactors;
  categoryScores: CategoryScore[];
  weakestCategory: CategoryScore | null;
  recommendation: string;
}

// ─── Weights ─────────────────────────────────────────────────

const WEIGHTS = {
  examPerformance: 0.35,
  categoryCoverage: 0.25,
  questionCoverage: 0.2,
  srMastery: 0.1,
  vocabMastery: 0.1,
} as const;

// ─── Algorithm ───────────────────────────────────────────────

/**
 * Compute a readiness assessment from study progress and the full question bank.
 * Pure function — no side-effects, no localStorage access.
 */
export function computeReadiness(
  progress: StudyProgress,
  questions: Question[],
  totalVocabTerms: number,
): ReadinessAssessment {
  const factors = computeFactors(progress, questions, totalVocabTerms);
  const categoryScores = computeCategoryScores(progress, questions);

  const overallScore = Math.round(
    factors.examPerformance * WEIGHTS.examPerformance +
      factors.categoryCoverage * WEIGHTS.categoryCoverage +
      factors.questionCoverage * WEIGHTS.questionCoverage +
      factors.srMastery * WEIGHTS.srMastery +
      factors.vocabMastery * WEIGHTS.vocabMastery,
  );

  const confidenceLevel = scoreToLevel(overallScore);
  const { label, detail } = levelMeta(confidenceLevel);

  // Weakest category = lowest accuracy among categories with at least 1 question seen
  const seen = categoryScores.filter((c) => c.questionsSeen > 0);
  const weakestCategory =
    seen.length > 0
      ? seen.reduce((a, b) => (a.accuracy < b.accuracy ? a : b))
      : null;

  const recommendation = buildRecommendation(
    confidenceLevel,
    weakestCategory,
    factors,
    progress,
  );

  return {
    overallScore,
    confidenceLevel,
    confidenceLabel: label,
    confidenceDetail: detail,
    factors,
    categoryScores,
    weakestCategory,
    recommendation,
  };
}

// ─── Factor computation ──────────────────────────────────────

function computeFactors(
  progress: StudyProgress,
  questions: Question[],
  totalVocabTerms: number,
): ReadinessFactors {
  return {
    examPerformance: calcExamPerformance(progress),
    categoryCoverage: calcCategoryCoverage(progress, questions),
    questionCoverage: calcQuestionCoverage(progress, questions),
    srMastery: calcSRMastery(progress),
    vocabMastery: calcVocabMastery(progress, totalVocabTerms),
  };
}

/**
 * Exam performance: weighted average of recent exam scores (most recent weighted highest).
 * Uses last 5 exams with exponential decay.
 */
function calcExamPerformance(progress: StudyProgress): number {
  const exams = progress.examHistory;
  if (exams.length === 0) return 0;

  const recent = exams.slice(-5); // last 5
  let weightedSum = 0;
  let weightTotal = 0;

  recent.forEach((exam, i) => {
    const weight = Math.pow(2, i); // 1, 2, 4, 8, 16 — most recent = highest
    const score = (exam.correctCount / exam.totalQuestions) * 100;
    weightedSum += score * weight;
    weightTotal += weight;
  });

  return Math.round(weightedSum / weightTotal);
}

/**
 * Category coverage: % of categories where accuracy >= 70%.
 * Only counts categories the user has actually encountered.
 */
function calcCategoryCoverage(
  progress: StudyProgress,
  questions: Question[],
): number {
  const categories = [...new Set(questions.map((q) => q.category))];
  if (categories.length === 0) return 0;

  const catAccuracy = getCategoryAccuracyMap(progress, questions);
  const strongCategories = categories.filter((cat) => {
    const entry = catAccuracy.get(cat);
    return entry && entry.total >= 1 && entry.correct / entry.total >= 0.7;
  });

  return Math.round((strongCategories.length / categories.length) * 100);
}

/**
 * Question coverage: % of the question bank the user has encountered
 * (via exams or SR flashcards).
 */
function calcQuestionCoverage(
  progress: StudyProgress,
  questions: Question[],
): number {
  if (questions.length === 0) return 0;

  const seenIds = new Set<string>();

  // From exams
  progress.examHistory.forEach((exam) => {
    exam.questionResults.forEach((r) => seenIds.add(r.questionId));
  });

  // From SR cards
  Object.keys(progress.srCards).forEach((id) => seenIds.add(id));

  return Math.round((seenIds.size / questions.length) * 100);
}

/**
 * SR mastery: normalized average ease factor.
 * SM-2 ease factor ranges from 1.3 (hard) to ~3.0+ (easy).
 * Default starting EF is 2.5. We normalize to 0–100.
 */
function calcSRMastery(progress: StudyProgress): number {
  const cards = Object.values(progress.srCards);
  if (cards.length === 0) return 0;

  const avgEF =
    cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length;

  // Normalize: EF 1.3 = 0%, EF 2.5 = 70%, EF 3.0+ = 100%
  const normalized = Math.max(0, Math.min(100, ((avgEF - 1.3) / 1.7) * 100));
  return Math.round(normalized);
}

/**
 * Vocab mastery: % of terms with >= 60% accuracy rate.
 */
function calcVocabMastery(
  progress: StudyProgress,
  totalVocabTerms: number,
): number {
  if (totalVocabTerms === 0) return 0;

  const vocabEntries = Object.values(progress.vocabProgress);
  const mastered = vocabEntries.filter((v) => {
    const total = v.timesCorrect + v.timesIncorrect;
    return total >= 1 && v.timesCorrect / total >= 0.6;
  });

  return Math.round((mastered.length / totalVocabTerms) * 100);
}

// ─── Category breakdown ──────────────────────────────────────

function computeCategoryScores(
  progress: StudyProgress,
  questions: Question[],
): CategoryScore[] {
  const categories = [...new Set(questions.map((q) => q.category))];
  const catAccuracy = getCategoryAccuracyMap(progress, questions);

  // Count questions per category in the bank
  const bankCount = new Map<QuestionCategory, number>();
  questions.forEach((q) => {
    bankCount.set(q.category, (bankCount.get(q.category) || 0) + 1);
  });

  return categories
    .map((cat): CategoryScore => {
      const entry = catAccuracy.get(cat);
      const questionsInBank = bankCount.get(cat) || 0;

      if (!entry || entry.total === 0) {
        return {
          category: cat,
          displayName: categoryDisplayName(cat),
          accuracy: 0,
          questionsSeen: 0,
          questionsInBank,
          status: "unseen",
        };
      }

      const accuracy = Math.round((entry.correct / entry.total) * 100);
      return {
        category: cat,
        displayName: categoryDisplayName(cat),
        accuracy,
        questionsSeen: entry.seen.size,
        questionsInBank,
        status: accuracy >= 80 ? "strong" : accuracy >= 50 ? "moderate" : "weak",
      };
    })
    .sort((a, b) => {
      // Unseen last, then by accuracy ascending (weakest first)
      if (a.status === "unseen" && b.status !== "unseen") return 1;
      if (b.status === "unseen" && a.status !== "unseen") return -1;
      return a.accuracy - b.accuracy;
    });
}

/**
 * Build a per-category accuracy map from all exam history.
 * Tracks unique question IDs seen per category, plus correct/total answers.
 */
function getCategoryAccuracyMap(
  progress: StudyProgress,
  questions: Question[],
): Map<QuestionCategory, { correct: number; total: number; seen: Set<string> }> {
  const questionMap = new Map<string, Question>();
  questions.forEach((q) => questionMap.set(q.id, q));

  const catMap = new Map<
    QuestionCategory,
    { correct: number; total: number; seen: Set<string> }
  >();

  progress.examHistory.forEach((exam) => {
    exam.questionResults.forEach((r) => {
      const q = questionMap.get(r.questionId);
      if (!q) return;

      let entry = catMap.get(q.category);
      if (!entry) {
        entry = { correct: 0, total: 0, seen: new Set() };
        catMap.set(q.category, entry);
      }

      entry.total += 1;
      if (r.isCorrect) entry.correct += 1;
      entry.seen.add(r.questionId);
    });
  });

  return catMap;
}

// ─── Confidence levels ───────────────────────────────────────

function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 85) return "high";
  if (score >= 70) return "moderate";
  if (score >= 40) return "building";
  return "early";
}

function levelMeta(level: ConfidenceLevel): { label: string; detail: string } {
  switch (level) {
    case "high":
      return {
        label: "Ready to pass",
        detail: "Strong performance across categories. You're well prepared.",
      };
    case "moderate":
      return {
        label: "Almost ready",
        detail: "Good foundation. Focus on weak areas to close the gap.",
      };
    case "building":
      return {
        label: "Making progress",
        detail: "Keep studying. Focus on practice exams and weak categories.",
      };
    case "early":
      return {
        label: "Getting started",
        detail:
          "Take practice exams and use flashcards to build your knowledge.",
      };
  }
}

// ─── Recommendations ─────────────────────────────────────────

function buildRecommendation(
  level: ConfidenceLevel,
  weakest: CategoryScore | null,
  factors: ReadinessFactors,
  progress: StudyProgress,
): string {
  // No exams taken yet
  if (progress.examHistory.length === 0) {
    return "Take your first practice exam to establish a baseline and start tracking your readiness.";
  }

  // High confidence — minor refinement
  if (level === "high") {
    if (weakest && weakest.accuracy < 80) {
      return `You're in great shape. To sharpen further, review ${weakest.displayName} — your accuracy there is ${weakest.accuracy}%.`;
    }
    return "You're well prepared. Consider taking one more practice exam to confirm, then go pass the real thing.";
  }

  // Build recommendation from the biggest gap
  const gaps: { message: string; weight: number }[] = [];

  if (weakest && weakest.accuracy < 60) {
    gaps.push({
      message: `Focus on ${weakest.displayName} — only ${weakest.accuracy}% accuracy across ${weakest.questionsSeen} questions seen.`,
      weight: 100 - weakest.accuracy,
    });
  }

  if (factors.questionCoverage < 60) {
    gaps.push({
      message: `You've only seen ${factors.questionCoverage}% of the question bank. Take more practice exams to encounter new questions.`,
      weight: 100 - factors.questionCoverage,
    });
  }

  if (factors.examPerformance < 70 && progress.examHistory.length >= 2) {
    gaps.push({
      message: `Your recent exam average is ${factors.examPerformance}%. Review missed questions and use flashcards on topics you get wrong.`,
      weight: 100 - factors.examPerformance,
    });
  }

  if (factors.vocabMastery < 40) {
    gaps.push({
      message: `Vocabulary is a gap — drill more terms to recognize key words on the exam.`,
      weight: 100 - factors.vocabMastery,
    });
  }

  // Return the highest-weight recommendation
  if (gaps.length > 0) {
    gaps.sort((a, b) => b.weight - a.weight);
    return gaps[0].message;
  }

  return "Keep taking practice exams and reviewing flashcards to improve your score.";
}
