// Question bank types (matches questions.json schema)
export interface QuestionOption {
  key: string;
  text_original: string;
  text_translated: string;
  text_official_en: string;
  is_correct: boolean;
}

export interface VocabularyItem {
  es: string;
  en: string;
}

export interface Question {
  id: string;
  question_number: number;
  country: string;
  region: string;
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "hard";
  question_original: string;
  question_translated: string;
  question_official_en: string;
  options: QuestionOption[];
  explanation_en: string;
  explanation_es: string;
  vocabulary: VocabularyItem[];
  has_image: boolean;
  image_ref: string | null;
  source: string;
  source_url: string;
  last_verified: string;
}

export type QuestionCategory =
  | "traffic-law"
  | "road-signs"
  | "traffic-signs"
  | "driving-technique"
  | "defensive-driving"
  | "right-of-way"
  | "safety"
  | "vehicle-maintenance"
  | "sanctions-procedures"
  | "speed-limits"
  | "environmental"
  | "pedestrians-cyclists"
  | "pedestrian-safety"
  | "officer-signals"
  | "parking";

// Road sign metadata types
export type NomSignCategory =
  | "restrictive"
  | "prohibitive"
  | "warning"
  | "informational"
  | "officer-signals";

export type SignShape = "circle" | "diamond" | "triangle" | "rectangle" | "octagon" | "other";
export type SignColor = "red" | "yellow" | "blue" | "green" | "white" | "orange";

export interface SignMetadata {
  id: string;
  signFile: string;
  questionId: string | null;
  nameEs: string;
  nameEn: string;
  nomCategory: NomSignCategory;
  shape: SignShape;
  primaryColor: SignColor;
  description: string;
}

// Vocabulary types (matches vocabulary.json schema)
export interface VocabTerm {
  term_es: string;
  term_en: string;
  category: string;
  frequency: number;
  question_ids: string[];
  context: string;
}

// Region metadata (matches meta.json schema)
export interface ExamFormat {
  total_questions_in_bank: number;
  questions_per_exam: number;
  passing_score: number;
  passing_percentage: number;
  time_limit_minutes: number;
  answer_format: string;
  options_per_question: number;
  negative_scoring: boolean;
}

export interface LicenseType {
  type: string;
  description: string;
  validity_years: number;
  min_age: number;
}

export interface RegionMeta {
  country: string;
  country_name: string;
  country_name_es: string;
  region: string;
  region_name: string;
  language: string;
  language_name: string;
  flag_emoji: string;
  exam_format: ExamFormat;
  exam_delivery: {
    computer_based: boolean;
    paper_available: boolean;
    paper_language: string;
    computer_language: string;
    notes: string;
  };
  english_available_at_exam: boolean;
  interpreter_allowed: boolean;
  interpreter_notes: string;
  practical_test_required: boolean;
  practical_test_type: string;
  practical_test_notes: string;
  license_types: LicenseType[];
  retake_policy: {
    wait_period_days: number;
    max_attempts: number | null;
    fee_per_retake: boolean;
  };
  costs: {
    currency: string;
    license_fee_range: string;
    exam_fee_included: boolean;
    notes: string;
  };
  required_documents: string[];
  official_source_url: string;
  appointment_url: string;
  last_content_update: string;
  content_version: string;
}

// Spaced repetition types
export type SRRating = "got-it" | "not-sure" | "missed-it";

export interface SRCard {
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO date string
  lastReview: string | null;
}

// Progress / storage types
export interface ExamAttempt {
  id: string;
  date: string;
  region: string;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  selectedKey: string;
  correctKey: string;
  isCorrect: boolean;
}

export interface StudyProgress {
  srCards: Record<string, SRCard>;
  examHistory: ExamAttempt[];
  vocabProgress: Record<string, VocabProgress>;
  lastStudyDate: string | null;
}

export interface VocabProgress {
  termEs: string;
  timesCorrect: number;
  timesIncorrect: number;
  lastSeen: string;
}

// Display mode for bilingual content
export type DisplayMode = "spanish" | "english" | "official";
