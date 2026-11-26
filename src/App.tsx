import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { useHashRoute } from './hooks/useHashRoute';
import { useQuestionBank } from './hooks/useQuestionBank';
import { createTranslator, LETTERS } from './i18n/copy';
import { HomePage } from './pages/HomePage';
import { PrepPage } from './pages/PrepPage';
import { ResultsPage } from './pages/ResultsPage';
import { TestPage } from './pages/TestPage';
import type { Language, Letter, PrepMode, StudyMode, TestSession } from './types';
import {
  categoryQuestions,
  loadLanguage,
  loadPrepPrefs,
  loadSession,
  saveLanguage,
  savePrepPrefs,
  saveSession,
  shuffle,
} from './utils/questions';

export function App() {
  const [language, setLanguage] = useState<Language>(loadLanguage);
  const { questions, byId, categories, loading, error } = useQuestionBank(language);
  const { route, navigate } = useHashRoute();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMode, setSelectedMode] = useState<StudyMode>('preparation');
  const [session, setSession] = useState<TestSession | null>(null);
  const [prepPrefs, setPrepPrefs] = useState(loadPrepPrefs);

  const t = useMemo(() => createTranslator(language), [language]);
  const bookmarkSet = useMemo(() => new Set(prepPrefs.bookmarks), [prepPrefs.bookmarks]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t('preparation')} · Insurance Prep`;
  }, [language, t]);

  useEffect(() => {
    if (!categories.length) return;
    setSelectedCategory(prev => (prev && categories.includes(prev) ? prev : categories[0]));
    const loaded = loadSession(language, categories, byId);
    setSession(loaded);
  }, [language, categories, byId]);

  // Keep route consistent with session state on refresh
  useEffect(() => {
    if (loading) return;
    if ((route === 'test' || route === 'results') && !session) {
      navigate('home');
    } else if (route === 'test' && session?.finished) {
      navigate('results');
    }
  }, [loading, route, session, navigate]);

  const handleLanguageChange = useCallback(
    (next: Language) => {
      if (session && !session.finished && !window.confirm(t('languageConfirm'))) return;
      saveSession(null);
      setSession(null);
      saveLanguage(next);
      setLanguage(next);
      navigate('home');
    },
    [session, t, navigate]
  );

  const handleSetPrepMode = useCallback((mode: PrepMode) => {
    setPrepPrefs(prev => {
      const next = { ...prev, prepMode: mode };
      savePrepPrefs(next);
      return next;
    });
  }, []);

  const handleToggleBookmark = useCallback((id: string) => {
    setPrepPrefs(prev => {
      const set = new Set(prev.bookmarks);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const next = { ...prev, bookmarks: [...set] };
      savePrepPrefs(next);
      return next;
    });
  }, []);

  const handleStartTest = useCallback(
    (countValue: number, timed: boolean) => {
      if (session && !session.finished && !window.confirm(t('replaceConfirm'))) return;
      const pool = categoryQuestions(questions, selectedCategory, true);
      const count = Math.min(countValue, pool.length);
      const ids = shuffle(pool)
        .slice(0, count)
        .map(q => q.id);
      const minutes = count <= 20 ? 25 : 60;
      const optionOrders = Object.fromEntries(ids.map(id => [id, shuffle(LETTERS)]));
      const nextSession: TestSession = {
        mode: 'test',
        category: selectedCategory,
        language,
        ids,
        optionOrders,
        index: 0,
        answers: {},
        visited: ids.length ? [ids[0]] : [],
        flagged: [],
        finished: false,
        deadline: timed ? Date.now() + minutes * 60_000 : null,
      };
      saveSession(nextSession);
      setSession(nextSession);
      navigate('test');
    },
    [session, t, questions, selectedCategory, language, navigate]
  );

  const handleAnswer = useCallback((questionId: string, sourceLetter: Letter) => {
    setSession(prev => {
      if (!prev || prev.finished) return prev;
      const visited = prev.visited.includes(questionId) ? prev.visited : [...prev.visited, questionId];
      const next: TestSession = {
        ...prev,
        answers: { ...prev.answers, [questionId]: sourceLetter },
        visited,
      };
      saveSession(next);
      return next;
    });
  }, []);

  const handleToggleFlag = useCallback((questionId: string) => {
    setSession(prev => {
      if (!prev || prev.finished) return prev;
      const exists = prev.flagged.includes(questionId);
      const flagged = exists ? prev.flagged.filter(id => id !== questionId) : [...prev.flagged, questionId];
      const visited = prev.visited.includes(questionId) ? prev.visited : [...prev.visited, questionId];
      const next: TestSession = { ...prev, flagged, visited };
      saveSession(next);
      return next;
    });
  }, []);

  const handleNavigateIndex = useCallback((nextIndex: number) => {
    setSession(prev => {
      if (!prev || prev.finished) return prev;
      const clamped = Math.max(0, Math.min(prev.ids.length - 1, nextIndex));
      const targetId = prev.ids[clamped];
      const visited = prev.visited.includes(targetId) ? prev.visited : [...prev.visited, targetId];
      const next: TestSession = { ...prev, index: clamped, visited };
      saveSession(next);
      return next;
    });
  }, []);

  const handleFinish = useCallback(
    (expired = false) => {
      if (!session || session.finished) return;
      if (!expired) {
        const unanswered = session.ids.filter(id => !session.answers[id]).length;
        if (!window.confirm(t('finishConfirm', { count: unanswered }))) return;
      }
      const next: TestSession = { ...session, finished: true, expired };
      saveSession(next);
      setSession(next);
      navigate('results');
    },
    [session, t, navigate]
  );

  const handleStartNewFromResults = useCallback(() => {
    saveSession(null);
    setSession(null);
    navigate('home');
  }, [navigate]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <Header
        language={language}
        languageLabel={t('language')}
        onLanguageChange={handleLanguageChange}
        onBrandClick={() => navigate('home')}
      />
      <main id="main" tabIndex={-1}>
        {error ? (
          <div className="error-state" role="alert">
            <div className="eyebrow">{t('loadLabel')}</div>
            <h1>{t('loadTitle')}</h1>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="loading-state" role="status">
            {t('loading')}
          </div>
        ) : route === 'prep' ? (
          <PrepPage
            language={language}
            questions={questions}
            categories={categories}
            selectedCategory={selectedCategory || categories[0]}
            prepMode={prepPrefs.prepMode}
            bookmarks={bookmarkSet}
            t={t}
            onSelectCategory={setSelectedCategory}
            onSetPrepMode={handleSetPrepMode}
            onToggleBookmark={handleToggleBookmark}
            onGoHome={() => navigate('home')}
          />
        ) : route === 'test' && session && !session.finished ? (
          <TestPage
            language={language}
            session={session}
            byId={byId}
            t={t}
            onAnswer={handleAnswer}
            onToggleFlag={handleToggleFlag}
            onNavigateIndex={handleNavigateIndex}
            onFinish={handleFinish}
            onGoHome={() => navigate('home')}
          />
        ) : route === 'results' && session?.finished ? (
          <ResultsPage
            language={language}
            session={session}
            byId={byId}
            t={t}
            onStartNew={handleStartNewFromResults}
          />
        ) : (
          <HomePage
            language={language}
            questions={questions}
            categories={categories}
            selectedCategory={selectedCategory || categories[0]}
            selectedMode={selectedMode}
            session={session}
            t={t}
            onSelectCategory={setSelectedCategory}
            onSelectMode={setSelectedMode}
            onOpenPrep={() => navigate('prep')}
            onStartTest={handleStartTest}
            onResumeTest={() => navigate(session?.finished ? 'results' : 'test')}
          />
        )}
      </main>
      <footer className="site-footer">{t('footer')}</footer>
    </>
  );
}
