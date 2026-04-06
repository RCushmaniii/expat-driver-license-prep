import { describe, it, expect } from "vitest";
import { computeReadiness } from "../readiness";
import type { Question, StudyProgress, ExamAttempt, QuestionResult } from "../types";

function makeQuestion(id: string, category: string = "traffic-law"): Question {
  return {
    id,
    question_number: 1,
    country: "mexico",
    region: "jalisco",
    category: category as Question["category"],
    difficulty: "medium",
    question_original: "Pregunta",
    question_translated: "Question",
    question_official_en: "Question (official)",
    options: [
      { key: "a", text_original: "A", text_translated: "A", text_official_en: "A", is_correct: true },
      { key: "b", text_original: "B", text_translated: "B", text_official_en: "B", is_correct: false },
    ],
    explanation_en: "Because A",
    explanation_es: "Porque A",
    vocabulary: [],
    has_image: false,
    image_ref: null,
    source: "test",
    source_url: "",
    last_verified: "2026-01-01",
  };
}

function makeExamAttempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    id: "exam-001",
    date: "2026-04-06",
    region: "jalisco",
    totalQuestions: 20,
    correctCount: 16,
    passed: true,
    questionResults: [],
    ...overrides,
  };
}

function emptyProgress(): StudyProgress {
  return {
    srCards: {},
    examHistory: [],
    vocabProgress: {},
    lastStudyDate: null,
  };
}

const QUESTIONS = [
  makeQuestion("q-001", "traffic-law"),
  makeQuestion("q-002", "traffic-law"),
  makeQuestion("q-003", "road-signs"),
  makeQuestion("q-004", "road-signs"),
  makeQuestion("q-005", "safety"),
  makeQuestion("q-006", "safety"),
  makeQuestion("q-007", "driving-technique"),
  makeQuestion("q-008", "driving-technique"),
  makeQuestion("q-009", "right-of-way"),
  makeQuestion("q-010", "right-of-way"),
];

describe("computeReadiness", () => {
  describe("with no study history", () => {
    it("returns an early confidence level with score 0", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 50);
      expect(result.overallScore).toBe(0);
      expect(result.confidenceLevel).toBe("early");
      expect(result.confidenceLabel).toBe("Getting started");
    });

    it("returns all categories as unseen", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 50);
      expect(result.categoryScores.every((c) => c.status === "unseen")).toBe(true);
    });

    it("returns null for weakest category", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 50);
      expect(result.weakestCategory).toBeNull();
    });

    it("recommends taking a first practice exam", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 50);
      expect(result.recommendation).toContain("first practice exam");
    });
  });

  describe("with exam history", () => {
    it("calculates exam performance from recent exams", () => {
      const progress = emptyProgress();
      progress.examHistory = [
        makeExamAttempt({
          id: "e1",
          correctCount: 18,
          totalQuestions: 20,
          questionResults: [
            { questionId: "q-001", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-002", selectedKey: "a", correctKey: "a", isCorrect: true },
          ],
        }),
      ];

      const result = computeReadiness(progress, QUESTIONS, 0);
      expect(result.factors.examPerformance).toBe(90);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it("weights recent exams higher than older ones", () => {
      const progress = emptyProgress();
      // Old exam: bad
      progress.examHistory.push(makeExamAttempt({ id: "e1", correctCount: 5, totalQuestions: 20 }));
      // New exam: good
      progress.examHistory.push(makeExamAttempt({ id: "e2", correctCount: 18, totalQuestions: 20 }));

      const result = computeReadiness(progress, QUESTIONS, 0);
      // Weighted: (25*1 + 90*2) / (1+2) = 205/3 ≈ 68
      expect(result.factors.examPerformance).toBeCloseTo(68, 0);
    });
  });

  describe("question coverage", () => {
    it("calculates percentage of questions seen", () => {
      const progress = emptyProgress();
      progress.examHistory = [
        makeExamAttempt({
          questionResults: [
            { questionId: "q-001", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-002", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-003", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-004", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-005", selectedKey: "a", correctKey: "a", isCorrect: true },
          ],
        }),
      ];

      const result = computeReadiness(progress, QUESTIONS, 0);
      expect(result.factors.questionCoverage).toBe(50); // 5 of 10
    });

    it("counts SR cards as seen questions", () => {
      const progress = emptyProgress();
      progress.srCards["q-001"] = {
        id: "q-001",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-04-07",
        lastReview: "2026-04-06",
      };

      const result = computeReadiness(progress, QUESTIONS, 0);
      expect(result.factors.questionCoverage).toBe(10); // 1 of 10
    });
  });

  describe("SR mastery", () => {
    it("returns 0 when no SR cards exist", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 0);
      expect(result.factors.srMastery).toBe(0);
    });

    it("calculates mastery from average ease factor", () => {
      const progress = emptyProgress();
      // EF 2.5 → (2.5 - 1.3) / 1.7 * 100 = 70.6%
      progress.srCards["q-001"] = {
        id: "q-001",
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReview: "2026-04-12",
        lastReview: "2026-04-06",
      };

      const result = computeReadiness(progress, QUESTIONS, 0);
      expect(result.factors.srMastery).toBe(71);
    });
  });

  describe("vocab mastery", () => {
    it("returns 0 when totalVocabTerms is 0", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 0);
      expect(result.factors.vocabMastery).toBe(0);
    });

    it("calculates mastery from vocab progress", () => {
      const progress = emptyProgress();
      // 3 terms mastered (>= 60% accuracy) out of 10 total
      progress.vocabProgress = {
        "prelacion": { termEs: "prelacion", timesCorrect: 4, timesIncorrect: 1, lastSeen: "2026-04-06" },
        "carril": { termEs: "carril", timesCorrect: 3, timesIncorrect: 2, lastSeen: "2026-04-06" },
        "rebasar": { termEs: "rebasar", timesCorrect: 5, timesIncorrect: 0, lastSeen: "2026-04-06" },
        "alto": { termEs: "alto", timesCorrect: 1, timesIncorrect: 5, lastSeen: "2026-04-06" },
      };

      const result = computeReadiness(progress, QUESTIONS, 10);
      expect(result.factors.vocabMastery).toBe(30); // 3 mastered / 10 total
    });
  });

  describe("category scores", () => {
    it("identifies weak categories from exam results", () => {
      const progress = emptyProgress();
      progress.examHistory = [
        makeExamAttempt({
          questionResults: [
            { questionId: "q-001", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-002", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-003", selectedKey: "b", correctKey: "a", isCorrect: false },
            { questionId: "q-004", selectedKey: "b", correctKey: "a", isCorrect: false },
          ],
        }),
      ];

      const result = computeReadiness(progress, QUESTIONS, 0);
      const trafficLaw = result.categoryScores.find((c) => c.category === "traffic-law");
      const roadSigns = result.categoryScores.find((c) => c.category === "road-signs");

      expect(trafficLaw?.accuracy).toBe(100);
      expect(trafficLaw?.status).toBe("strong");
      expect(roadSigns?.accuracy).toBe(0);
      expect(roadSigns?.status).toBe("weak");
    });

    it("identifies the weakest category among seen categories", () => {
      const progress = emptyProgress();
      progress.examHistory = [
        makeExamAttempt({
          questionResults: [
            { questionId: "q-001", selectedKey: "a", correctKey: "a", isCorrect: true },
            { questionId: "q-003", selectedKey: "b", correctKey: "a", isCorrect: false },
          ],
        }),
      ];

      const result = computeReadiness(progress, QUESTIONS, 0);
      expect(result.weakestCategory).not.toBeNull();
      expect(result.weakestCategory!.category).toBe("road-signs");
    });
  });

  describe("confidence levels", () => {
    it("returns 'early' for score < 40", () => {
      const result = computeReadiness(emptyProgress(), QUESTIONS, 50);
      expect(result.confidenceLevel).toBe("early");
    });

    it("returns 'high' for strong overall performance", () => {
      const progress = emptyProgress();
      // Perfect exam history across all categories
      const allCorrectResults: QuestionResult[] = QUESTIONS.map((q) => ({
        questionId: q.id,
        selectedKey: "a",
        correctKey: "a",
        isCorrect: true,
      }));

      for (let i = 0; i < 5; i++) {
        progress.examHistory.push(
          makeExamAttempt({
            id: `e${i}`,
            correctCount: 10,
            totalQuestions: 10,
            questionResults: allCorrectResults,
          }),
        );
      }

      // All SR cards with good ease factor
      QUESTIONS.forEach((q) => {
        progress.srCards[q.id] = {
          id: q.id,
          easeFactor: 2.8,
          interval: 6,
          repetitions: 3,
          nextReview: "2026-04-12",
          lastReview: "2026-04-06",
        };
      });

      // Good vocab mastery
      for (let i = 0; i < 40; i++) {
        progress.vocabProgress[`term-${i}`] = {
          termEs: `term-${i}`,
          timesCorrect: 5,
          timesIncorrect: 0,
          lastSeen: "2026-04-06",
        };
      }

      const result = computeReadiness(progress, QUESTIONS, 50);
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.confidenceLevel).toBe("high");
    });
  });

  describe("overall score calculation", () => {
    it("is a weighted sum of all factors", () => {
      const progress = emptyProgress();
      progress.examHistory = [
        makeExamAttempt({
          correctCount: 20,
          totalQuestions: 20,
          questionResults: QUESTIONS.map((q) => ({
            questionId: q.id,
            selectedKey: "a",
            correctKey: "a",
            isCorrect: true,
          })),
        }),
      ];

      const result = computeReadiness(progress, QUESTIONS, 0);

      // Verify the score matches the weighted formula
      const expected = Math.round(
        result.factors.examPerformance * 0.35 +
        result.factors.categoryCoverage * 0.25 +
        result.factors.questionCoverage * 0.2 +
        result.factors.srMastery * 0.1 +
        result.factors.vocabMastery * 0.1,
      );
      expect(result.overallScore).toBe(expected);
    });
  });
});
