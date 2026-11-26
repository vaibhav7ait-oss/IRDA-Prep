import { LETTERS } from '../i18n/copy';
import type { Language, Letter, PrepPrefs, Question, QuestionStatus, TestSession } from '../types';

export const SESSION_STORE = 'insurance-prep-session-v1';
export const PREP_PREF_STORE = 'insurance-prep-prefs-v1';
export const LANGUAGE_STORE = 'insurance-prep-language-v1';

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function categoryQuestions(
  questions: Question[],
  category: string,
  scoredOnly = false
): Question[] {
  return questions.filter(
    q => q.categories.includes(category) && (!scoredOnly || (q.answer !== null && LETTERS.includes(q.answer)))
  );
}

export function optionOrder(session: TestSession | null, qId: string): Letter[] {
  const stored = session?.optionOrders?.[qId];
  return Array.isArray(stored) && stored.length === 4 && LETTERS.every(l => stored.includes(l))
    ? stored
    : [...LETTERS];
}

export function displayLetter(session: TestSession | null, qId: string, originalLetter: Letter): Letter {
  const idx = optionOrder(session, qId).indexOf(originalLetter);
  return LETTERS[idx] ?? originalLetter;
}

export function getQuestionStatus(id: string, session: TestSession): QuestionStatus {
  if (session.flagged.includes(id)) return 'bookmarked';
  if (session.answers[id]) return 'answered';
  if (session.visited.includes(id)) return 'unanswered';
  return 'unvisited';
}

export function formatRemaining(deadline: number | null, now = Date.now()): string {
  if (!deadline) return '';
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORE);
    if (saved === 'en' || saved === 'hi' || saved === 'gu') return saved;
  } catch { /* Optional */ }
  return 'en';
}

export function saveLanguage(lang: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORE, lang);
  } catch { /* Optional */ }
}

export function saveSession(session: TestSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_STORE, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORE);
  } catch { /* Optional */ }
}

export function loadSession(
  language: Language,
  categories: string[],
  byId: Map<string, Question>
): TestSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORE);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<TestSession>;
    if (
      stored &&
      stored.mode === 'test' &&
      stored.category &&
      categories.includes(stored.category) &&
      (stored.language || 'en') === language &&
      Array.isArray(stored.ids) &&
      stored.ids.length > 0 &&
      Number.isInteger(stored.index) &&
      (stored.index as number) >= 0 &&
      (stored.index as number) < stored.ids.length &&
      stored.ids.every(
        id => byId.get(id)?.language === language && byId.get(id)?.categories.includes(stored.category!)
      ) &&
      stored.answers &&
      typeof stored.answers === 'object' &&
      Object.entries(stored.answers).every(
        ([id, ans]) => stored.ids!.includes(id) && LETTERS.includes(ans as Letter)
      )
    ) {
      const optionOrders: Record<string, Letter[]> = { ...(stored.optionOrders || {}) };
      for (const id of stored.ids) {
        const order = optionOrders[id];
        if (!Array.isArray(order) || order.length !== 4 || !LETTERS.every(l => order.includes(l))) {
          optionOrders[id] = shuffle(LETTERS);
        }
      }
      const currentId = stored.ids[stored.index as number];
      const visitedSet = new Set(
        Array.isArray(stored.visited) ? stored.visited.filter(id => stored.ids!.includes(id)) : []
      );
      visitedSet.add(currentId);
      for (const id of Object.keys(stored.answers)) visitedSet.add(id);
      const flagged = Array.isArray(stored.flagged)
        ? stored.flagged.filter(id => stored.ids!.includes(id))
        : [];
      return {
        mode: 'test',
        category: stored.category,
        language,
        ids: stored.ids,
        optionOrders,
        index: stored.index as number,
        answers: stored.answers as Record<string, Letter>,
        visited: [...visitedSet],
        flagged,
        finished: Boolean(stored.finished),
        expired: Boolean(stored.expired),
        deadline: typeof stored.deadline === 'number' ? stored.deadline : null,
      };
    }
    localStorage.removeItem(SESSION_STORE);
  } catch { /* Ignore */ }
  return null;
}

export function loadPrepPrefs(): PrepPrefs {
  try {
    const raw = localStorage.getItem(PREP_PREF_STORE);
    if (!raw) return { prepMode: 'all', bookmarks: [] };
    const stored = JSON.parse(raw) as Partial<PrepPrefs>;
    return {
      prepMode: stored.prepMode === 'answer' || stored.prepMode === 'flash' ? stored.prepMode : 'all',
      bookmarks: Array.isArray(stored.bookmarks) ? stored.bookmarks.filter(x => typeof x === 'string') : [],
    };
  } catch {
    return { prepMode: 'all', bookmarks: [] };
  }
}

export function savePrepPrefs(prefs: PrepPrefs) {
  try {
    localStorage.setItem(PREP_PREF_STORE, JSON.stringify(prefs));
  } catch { /* Optional */ }
}
