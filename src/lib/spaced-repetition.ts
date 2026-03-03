import type { SRCard, SRRating } from "./types";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/** Map 3-tier rating to SM-2 quality score (0-5) */
function ratingToQuality(rating: SRRating): number {
  switch (rating) {
    case "got-it":
      return 5;
    case "not-sure":
      return 3;
    case "missed-it":
      return 1;
  }
}

/** Create a new SR card for a question that hasn't been studied yet */
export function createCard(id: string): SRCard {
  return {
    id,
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().split("T")[0],
    lastReview: null,
  };
}

/** SM-2 algorithm: update card after a review */
export function reviewCard(card: SRCard, rating: SRRating): SRCard {
  const quality = ratingToQuality(rating);
  const today = new Date().toISOString().split("T")[0];

  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset to beginning
    repetitions = 0;
    interval = 0;
  } else {
    // Passed — advance
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (SM-2 formula)
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (interval === 0 ? 0 : interval));
  const nextReview = nextDate.toISOString().split("T")[0];

  return {
    id: card.id,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: today,
  };
}

/** Check if a card is due for review */
export function isDue(card: SRCard): boolean {
  const today = new Date().toISOString().split("T")[0];
  return card.nextReview <= today;
}

/** Sort cards: due first (oldest first), then by ease factor (hardest first) */
export function sortByPriority(cards: SRCard[]): SRCard[] {
  const today = new Date().toISOString().split("T")[0];
  return [...cards].sort((a, b) => {
    const aDue = a.nextReview <= today;
    const bDue = b.nextReview <= today;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    if (aDue && bDue) {
      // Both due — oldest review first
      if (a.nextReview !== b.nextReview)
        return a.nextReview.localeCompare(b.nextReview);
      // Same date — hardest first
      return a.easeFactor - b.easeFactor;
    }
    // Neither due — soonest first
    return a.nextReview.localeCompare(b.nextReview);
  });
}
