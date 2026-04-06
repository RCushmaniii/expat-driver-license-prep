import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createCard, reviewCard, isDue, sortByPriority } from "../spaced-repetition";
import type { SRCard } from "../types";

// Fix the date so tests are deterministic
const FIXED_DATE = new Date("2026-04-06T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createCard", () => {
  it("creates a card with default SM-2 values", () => {
    const card = createCard("q-001");
    expect(card).toEqual({
      id: "q-001",
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: "2026-04-06",
      lastReview: null,
    });
  });

  it("uses today's date as the next review date", () => {
    const card = createCard("q-002");
    expect(card.nextReview).toBe("2026-04-06");
  });
});

describe("reviewCard", () => {
  let freshCard: SRCard;

  beforeEach(() => {
    freshCard = createCard("q-001");
  });

  describe("got-it (quality 5)", () => {
    it("advances a fresh card to interval 1, repetitions 1", () => {
      const updated = reviewCard(freshCard, "got-it");
      expect(updated.interval).toBe(1);
      expect(updated.repetitions).toBe(1);
      expect(updated.lastReview).toBe("2026-04-06");
    });

    it("advances a 1-rep card to interval 6", () => {
      const rep1 = reviewCard(freshCard, "got-it");
      const rep2 = reviewCard(rep1, "got-it");
      expect(rep2.interval).toBe(6);
      expect(rep2.repetitions).toBe(2);
    });

    it("uses ease factor for subsequent intervals", () => {
      let card = freshCard;
      card = reviewCard(card, "got-it"); // interval = 1, EF = 2.6
      card = reviewCard(card, "got-it"); // interval = 6, EF = 2.7
      const prevEF = card.easeFactor; // 2.7 — interval uses EF before update
      card = reviewCard(card, "got-it"); // interval = round(6 * 2.7) = 16
      expect(card.interval).toBe(Math.round(6 * prevEF));
      expect(card.repetitions).toBe(3);
    });

    it("increases ease factor on perfect reviews", () => {
      const updated = reviewCard(freshCard, "got-it");
      // SM-2: EF + 0.1 - (5-5) * (0.08 + (5-5) * 0.02) = 2.5 + 0.1 = 2.6
      expect(updated.easeFactor).toBe(2.6);
    });
  });

  describe("not-sure (quality 3)", () => {
    it("still advances the card (quality >= 3 passes)", () => {
      const updated = reviewCard(freshCard, "not-sure");
      expect(updated.interval).toBe(1);
      expect(updated.repetitions).toBe(1);
    });

    it("decreases ease factor", () => {
      const updated = reviewCard(freshCard, "not-sure");
      // SM-2: 2.5 + 0.1 - (5-3) * (0.08 + (5-3) * 0.02) = 2.5 + 0.1 - 2*(0.08+2*0.02)
      // = 2.5 + 0.1 - 2 * 0.12 = 2.5 + 0.1 - 0.24 = 2.36
      expect(updated.easeFactor).toBeCloseTo(2.36, 2);
    });
  });

  describe("missed-it (quality 1)", () => {
    it("resets repetitions and interval to zero", () => {
      // Build up a card with some progress
      let card = freshCard;
      card = reviewCard(card, "got-it");
      card = reviewCard(card, "got-it");
      expect(card.repetitions).toBe(2);
      expect(card.interval).toBe(6);

      // Miss it — should reset
      const updated = reviewCard(card, "missed-it");
      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(0);
    });

    it("sets next review to today (immediate review)", () => {
      const updated = reviewCard(freshCard, "missed-it");
      expect(updated.nextReview).toBe("2026-04-06");
    });

    it("decreases ease factor but not below minimum 1.3", () => {
      let card = freshCard;
      // Miss it multiple times to drive EF down
      for (let i = 0; i < 20; i++) {
        card = reviewCard(card, "missed-it");
      }
      expect(card.easeFactor).toBe(1.3);
    });
  });

  it("schedules next review based on calculated interval", () => {
    let card = freshCard;
    card = reviewCard(card, "got-it"); // interval 1 → next = Apr 7
    expect(card.nextReview).toBe("2026-04-07");

    card = reviewCard(card, "got-it"); // interval 6 → next = Apr 12
    expect(card.nextReview).toBe("2026-04-12");
  });

  it("preserves the card id through reviews", () => {
    const updated = reviewCard(freshCard, "got-it");
    expect(updated.id).toBe("q-001");
  });
});

describe("isDue", () => {
  it("returns true for a card due today", () => {
    const card = createCard("q-001");
    expect(isDue(card)).toBe(true);
  });

  it("returns true for an overdue card", () => {
    const card: SRCard = {
      id: "q-001",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-01", // 5 days ago
      lastReview: "2026-03-31",
    };
    expect(isDue(card)).toBe(true);
  });

  it("returns false for a future card", () => {
    const card: SRCard = {
      id: "q-001",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2026-04-12",
      lastReview: "2026-04-06",
    };
    expect(isDue(card)).toBe(false);
  });
});

describe("sortByPriority", () => {
  it("puts due cards before non-due cards", () => {
    const due: SRCard = {
      id: "due",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-05",
      lastReview: "2026-04-04",
    };
    const notDue: SRCard = {
      id: "future",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2026-04-12",
      lastReview: "2026-04-06",
    };

    const sorted = sortByPriority([notDue, due]);
    expect(sorted[0].id).toBe("due");
    expect(sorted[1].id).toBe("future");
  });

  it("among due cards, oldest review date comes first", () => {
    const older: SRCard = {
      id: "older",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-01",
      lastReview: "2026-03-31",
    };
    const newer: SRCard = {
      id: "newer",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-05",
      lastReview: "2026-04-04",
    };

    const sorted = sortByPriority([newer, older]);
    expect(sorted[0].id).toBe("older");
    expect(sorted[1].id).toBe("newer");
  });

  it("among due cards with same date, hardest (lowest EF) comes first", () => {
    const hard: SRCard = {
      id: "hard",
      easeFactor: 1.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-05",
      lastReview: "2026-04-04",
    };
    const easy: SRCard = {
      id: "easy",
      easeFactor: 2.8,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-05",
      lastReview: "2026-04-04",
    };

    const sorted = sortByPriority([easy, hard]);
    expect(sorted[0].id).toBe("hard");
    expect(sorted[1].id).toBe("easy");
  });

  it("among non-due cards, soonest review comes first", () => {
    const sooner: SRCard = {
      id: "sooner",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-04-08",
      lastReview: "2026-04-06",
    };
    const later: SRCard = {
      id: "later",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2026-04-15",
      lastReview: "2026-04-06",
    };

    const sorted = sortByPriority([later, sooner]);
    expect(sorted[0].id).toBe("sooner");
    expect(sorted[1].id).toBe("later");
  });

  it("does not mutate the original array", () => {
    const cards = [createCard("a"), createCard("b")];
    const sorted = sortByPriority(cards);
    expect(sorted).not.toBe(cards);
  });
});
