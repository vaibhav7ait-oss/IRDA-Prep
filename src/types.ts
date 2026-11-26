export type Language = 'en' | 'hi' | 'gu';
export type Letter = 'A' | 'B' | 'C' | 'D';
export type StudyMode = 'preparation' | 'test';
export type PrepMode = 'all' | 'answer' | 'flash';
export type RouteName = 'home' | 'prep' | 'test' | 'results';

export interface Question {
  id: string;
  language: Language;
  text: string;
  choices: [string, string, string, string];
  answer: Letter | null;
  categories: string[];
}

export interface TestSession {
  mode: 'test';
  category: string;
  language: Language;
  ids: string[];
  optionOrders: Record<string, Letter[]>;
  index: number;
  answers: Record<string, Letter>;
  visited: string[];
  flagged: string[];
  finished: boolean;
  expired?: boolean;
  deadline: number | null;
}

export interface PrepPrefs {
  prepMode: PrepMode;
  bookmarks: string[];
}

export type QuestionStatus = 'answered' | 'unanswered' | 'bookmarked' | 'unvisited';
