import { describe, it, expect } from "vitest";
import {
  generateExam,
  filterByCategory,
  filterByDifficulty,
  getCategories,
  categoryDisplayName,
  getQuestionById,
} from "../question-bank";
import type { Question } from "../types";

// Minimal question factory for testing
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: overrides.id ?? "q-001",
    question_number: overrides.question_number ?? 1,
    country: "mexico",
    region: "jalisco",
    category: overrides.category ?? "traffic-law",
    difficulty: overrides.difficulty ?? "medium",
    question_original: "Pregunta de prueba",
    question_translated: "Test question",
    question_official_en: "Test question (official)",
    options: [
      {
        key: "a",
        text_original: "Opción A",
        text_translated: "Option A",
        text_official_en: "Option A (official)",
        is_correct: true,
      },
      {
        key: "b",
        text_original: "Opción B",
        text_translated: "Option B",
        text_official_en: "Option B (official)",
        is_correct: false,
      },
    ],
    explanation_en: "Because A is correct",
    explanation_es: "Porque A es correcto",
    vocabulary: [],
    has_image: false,
    image_ref: null,
    source: "test",
    source_url: "",
    last_verified: "2026-01-01",
  };
}

function makeQuestionBank(count: number): Question[] {
  const categories = ["traffic-law", "road-signs", "safety", "driving-technique", "right-of-way"] as const;
  const difficulties = ["easy", "medium", "hard"] as const;

  return Array.from({ length: count }, (_, i) => makeQuestion({
    id: `q-${String(i + 1).padStart(3, "0")}`,
    question_number: i + 1,
    category: categories[i % categories.length],
    difficulty: difficulties[i % difficulties.length],
  }));
}

describe("generateExam", () => {
  const questions = makeQuestionBank(50);

  it("returns the requested number of questions", () => {
    const exam = generateExam(questions, 20);
    expect(exam).toHaveLength(20);
  });

  it("returns all questions if count exceeds bank size", () => {
    const small = makeQuestionBank(5);
    const exam = generateExam(small, 20);
    expect(exam).toHaveLength(5);
  });

  it("returns an empty array for empty bank", () => {
    expect(generateExam([], 20)).toEqual([]);
  });

  it("returns unique questions (no duplicates)", () => {
    const exam = generateExam(questions, 20);
    const ids = exam.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("shuffles the questions (not always the same order)", () => {
    // Run 10 exams and check at least one has a different first question
    const firstIds = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const exam = generateExam(questions, 20);
      firstIds.add(exam[0].id);
    }
    expect(firstIds.size).toBeGreaterThan(1);
  });

  it("does not mutate the original array", () => {
    const original = [...questions];
    generateExam(questions, 20);
    expect(questions.map((q) => q.id)).toEqual(original.map((q) => q.id));
  });
});

describe("filterByCategory", () => {
  const questions = makeQuestionBank(50);

  it("returns only questions matching the category", () => {
    const filtered = filterByCategory(questions, "traffic-law");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((q) => q.category === "traffic-law")).toBe(true);
  });

  it("returns empty array for category with no questions", () => {
    const filtered = filterByCategory(questions, "parking");
    expect(filtered).toEqual([]);
  });
});

describe("filterByDifficulty", () => {
  const questions = makeQuestionBank(50);

  it("returns only questions matching the difficulty", () => {
    const filtered = filterByDifficulty(questions, "easy");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((q) => q.difficulty === "easy")).toBe(true);
  });

  it("returns empty array for empty bank", () => {
    expect(filterByDifficulty([], "hard")).toEqual([]);
  });
});

describe("getCategories", () => {
  it("returns unique categories from the question bank", () => {
    const questions = makeQuestionBank(50);
    const categories = getCategories(questions);
    expect(categories).toContain("traffic-law");
    expect(categories).toContain("road-signs");
    expect(categories).toContain("safety");
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("returns empty array for empty bank", () => {
    expect(getCategories([])).toEqual([]);
  });
});

describe("categoryDisplayName", () => {
  it("maps known categories to display names", () => {
    expect(categoryDisplayName("traffic-law")).toBe("Traffic Law");
    expect(categoryDisplayName("road-signs")).toBe("Road Signs");
    expect(categoryDisplayName("defensive-driving")).toBe("Defensive Driving");
    expect(categoryDisplayName("right-of-way")).toBe("Right of Way");
    expect(categoryDisplayName("vehicle-maintenance")).toBe("Vehicle Maintenance");
    expect(categoryDisplayName("sanctions-procedures")).toBe("Sanctions & Procedures");
    expect(categoryDisplayName("pedestrians-cyclists")).toBe("Pedestrians & Cyclists");
  });

  it("falls back to the raw category string for unknown categories", () => {
    // @ts-expect-error — testing fallback behavior
    expect(categoryDisplayName("unknown-category")).toBe("unknown-category");
  });
});

describe("getQuestionById", () => {
  const questions = makeQuestionBank(10);

  it("returns the matching question", () => {
    const q = getQuestionById(questions, "q-005");
    expect(q).toBeDefined();
    expect(q!.id).toBe("q-005");
  });

  it("returns undefined for a non-existent id", () => {
    expect(getQuestionById(questions, "q-999")).toBeUndefined();
  });
});
