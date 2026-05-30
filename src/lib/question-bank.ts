import type { Question, QuestionCategory } from "./types";

const DATA_PATH = "/data/jalisco/questions.json";

let cachedQuestions: Question[] | null = null;

/** Load questions from public JSON (client-side fetch) */
export async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const response = await fetch(DATA_PATH);
  if (!response.ok)
    throw new Error(`Failed to load questions: ${response.status}`);
  cachedQuestions = (await response.json()) as Question[];
  return cachedQuestions;
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * A sign-recognition question ("¿qué nos indica esta señal?") cannot be answered
 * without its image. jalisco-059 references a sign but has no image, and its
 * correct answer is unverified — three official Jalisco sources disagree
 * (vuelta continua / codo inverso / entronque lateral) because the answer depends
 * on the missing image. Exclude such questions from the exam until a verified
 * image and answer are restored. See docs/SESSION_LOG.md (2026-05-30).
 */
function isAnswerable(q: Question): boolean {
  const referencesShownSign =
    /esta señal|este señalamiento|siguiente señal/i.test(q.question_original);
  return !referencesShownSign || Boolean(q.has_image && q.image_ref);
}

/** Get a random exam of N questions (excludes unanswerable image-less sign questions) */
export function generateExam(questions: Question[], count: number): Question[] {
  return shuffle(questions.filter(isAnswerable)).slice(0, count);
}

/** Filter questions by category */
export function filterByCategory(
  questions: Question[],
  category: QuestionCategory,
): Question[] {
  return questions.filter((q) => q.category === category);
}

/** Filter questions by difficulty */
export function filterByDifficulty(
  questions: Question[],
  difficulty: Question["difficulty"],
): Question[] {
  return questions.filter((q) => q.difficulty === difficulty);
}

/** Get unique categories from question bank */
export function getCategories(questions: Question[]): QuestionCategory[] {
  return [...new Set(questions.map((q) => q.category))];
}

/** Get category display name */
export function categoryDisplayName(category: QuestionCategory): string {
  const names: Record<QuestionCategory, string> = {
    "traffic-law": "Traffic Law",
    "road-signs": "Road Signs",
    "traffic-signs": "Traffic Signs",
    "driving-technique": "Driving Technique",
    "defensive-driving": "Defensive Driving",
    "right-of-way": "Right of Way",
    safety: "Safety",
    "vehicle-maintenance": "Vehicle Maintenance",
    "sanctions-procedures": "Sanctions & Procedures",
    "speed-limits": "Speed Limits",
    environmental: "Environmental",
    "pedestrians-cyclists": "Pedestrians & Cyclists",
    "pedestrian-safety": "Pedestrian Safety",
    "officer-signals": "Officer Signals",
    parking: "Parking",
  };
  return names[category] || category;
}

/** Get a question by ID */
export function getQuestionById(
  questions: Question[],
  id: string,
): Question | undefined {
  return questions.find((q) => q.id === id);
}
