import type {
  StudyProgress,
  SRCard,
  ExamAttempt,
  VocabProgress,
} from "./types";

const STORAGE_KEY = "expatdrive_progress";

function defaultProgress(): StudyProgress {
  return {
    srCards: {},
    examHistory: [],
    vocabProgress: {},
    lastStudyDate: null,
  };
}

/** Safely read from localStorage */
function read(): StudyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return JSON.parse(raw) as StudyProgress;
  } catch {
    return defaultProgress();
  }
}

/** Safely write to localStorage */
function write(data: StudyProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/** Get full progress data */
export function getProgress(): StudyProgress {
  return read();
}

/** Save an SR card update */
export function saveSRCard(card: SRCard): void {
  const data = read();
  data.srCards[card.id] = card;
  data.lastStudyDate = new Date().toISOString().split("T")[0];
  write(data);
}

/** Get an SR card by question ID */
export function getSRCard(questionId: string): SRCard | null {
  const data = read();
  return data.srCards[questionId] || null;
}

/** Get all SR cards */
export function getAllSRCards(): Record<string, SRCard> {
  return read().srCards;
}

/** Save an exam attempt */
export function saveExamAttempt(attempt: ExamAttempt): void {
  const data = read();
  data.examHistory.push(attempt);
  data.lastStudyDate = new Date().toISOString().split("T")[0];
  write(data);
}

/** Get exam history */
export function getExamHistory(): ExamAttempt[] {
  return read().examHistory;
}

/** Save vocab progress for a term */
export function saveVocabProgress(termEs: string, correct: boolean): void {
  const data = read();
  const existing = data.vocabProgress[termEs] || {
    termEs,
    timesCorrect: 0,
    timesIncorrect: 0,
    lastSeen: "",
  };
  if (correct) {
    existing.timesCorrect += 1;
  } else {
    existing.timesIncorrect += 1;
  }
  existing.lastSeen = new Date().toISOString().split("T")[0];
  data.vocabProgress[termEs] = existing;
  data.lastStudyDate = new Date().toISOString().split("T")[0];
  write(data);
}

/** Get vocab progress */
export function getVocabProgress(): Record<string, VocabProgress> {
  return read().vocabProgress;
}

/** Clear all progress data */
export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/** Get summary stats */
export function getStats(): {
  totalExams: number;
  passRate: number;
  cardsStudied: number;
  cardsDue: number;
  vocabTermsSeen: number;
} {
  const data = read();
  const today = new Date().toISOString().split("T")[0];
  const cards = Object.values(data.srCards);
  const exams = data.examHistory;
  const passed = exams.filter((e) => e.passed).length;

  return {
    totalExams: exams.length,
    passRate: exams.length > 0 ? Math.round((passed / exams.length) * 100) : 0,
    cardsStudied: cards.length,
    cardsDue: cards.filter((c) => c.nextReview <= today).length,
    vocabTermsSeen: Object.keys(data.vocabProgress).length,
  };
}
