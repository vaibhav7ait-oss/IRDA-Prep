import { useEffect, useState } from 'react';
import { CATEGORY_ORDER } from '../i18n/copy';
import type { Language, Question } from '../types';

const LOADERS: Record<Language, () => Promise<{ default: Question[] }>> = {
  en: () => import('../data/questions-en.json') as unknown as Promise<{ default: Question[] }>,
  hi: () => import('../data/questions-hi.json') as unknown as Promise<{ default: Question[] }>,
  gu: () => import('../data/questions-gu.json') as unknown as Promise<{ default: Question[] }>,
};

const cache = new Map<Language, Question[]>();

export function useQuestionBank(language: Language) {
  const [questions, setQuestions] = useState<Question[]>(() => cache.get(language) ?? []);
  const [loading, setLoading] = useState(!cache.has(language));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const cached = cache.get(language);
    if (cached) {
      setQuestions(cached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    LOADERS[language]()
      .then(mod => {
        if (!active) return;
        const rows = Array.isArray(mod.default) ? mod.default : [];
        if (!rows.length) throw new Error('Question data is empty');
        cache.set(language, rows);
        setQuestions(rows);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language]);

  const categories = [...new Set(questions.flatMap(q => q.categories))].sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]) + 1 || 99) -
      (CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]) + 1 || 99)
  );

  const byId = new Map(questions.map(q => [q.id, q]));

  return { questions, byId, categories, loading, error };
}
