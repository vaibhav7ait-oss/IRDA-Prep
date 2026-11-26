import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkIcon, SearchIcon } from '../components/Icons';
import { PrepCard } from '../components/PrepCard';
import type { CopyKey } from '../i18n/copy';
import { getSubjectName } from '../i18n/copy';
import type { Language, Letter, PrepMode, Question } from '../types';
import { categoryQuestions } from '../utils/questions';

const BATCH_SIZE = 60;

interface PrepPageProps {
  language: Language;
  questions: Question[];
  categories: string[];
  selectedCategory: string;
  prepMode: PrepMode;
  bookmarks: Set<string>;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onSelectCategory: (cat: string) => void;
  onSetPrepMode: (mode: PrepMode) => void;
  onToggleBookmark: (id: string) => void;
  onGoHome: () => void;
}

export function PrepPage({
  language,
  questions,
  categories,
  selectedCategory,
  prepMode,
  bookmarks,
  t,
  onSelectCategory,
  onSetPrepMode,
  onToggleBookmark,
  onGoHome,
}: PrepPageProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [flashPicks, setFlashPicks] = useState<Map<string, Letter>>(() => new Map());
  const [visibleLimit, setVisibleLimit] = useState(BATCH_SIZE);
  const [showTop, setShowTop] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allInCategory = useMemo(
    () => categoryQuestions(questions, selectedCategory),
    [questions, selectedCategory]
  );

  const savedInCat = useMemo(
    () => allInCategory.filter(q => bookmarks.has(q.id)).length,
    [allInCategory, bookmarks]
  );

  const trimmed = deferredQuery.trim();
  const numberMatch = trimmed.match(/^#\s*(\d+)$/);

  const matching = useMemo(() => {
    const numbered = allInCategory.map((q, index) => ({ q, number: index + 1 }));
    let list = numberMatch
      ? numbered.filter(({ number }) => number === Number(numberMatch[1]))
      : !trimmed
        ? numbered
        : numbered.filter(({ q }) =>
            `${q.text} ${q.choices.join(' ')}`.toLocaleLowerCase().includes(trimmed.toLocaleLowerCase())
          );
    if (onlyBookmarked) list = list.filter(({ q }) => bookmarks.has(q.id));
    return list;
  }, [allInCategory, trimmed, numberMatch, onlyBookmarked, bookmarks]);

  useEffect(() => {
    setVisibleLimit(BATCH_SIZE);
  }, [selectedCategory, trimmed, onlyBookmarked]);

  useEffect(() => {
    setRevealedIds(new Set());
    setFlashPicks(new Map());
    titleRef.current?.focus();
  }, [selectedCategory]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleLimit >= matching.length) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisibleLimit(prev => Math.min(matching.length, prev + BATCH_SIZE));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleLimit, matching.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (event.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test(active?.tagName || '')) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (event.key === 'Escape' && active === searchInputRef.current) {
        if (query) {
          event.preventDefault();
          setQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [query]);

  const handleFlashPick = useCallback((id: string, letter: Letter) => {
    setRevealedIds(prev => new Set(prev).add(id));
    setFlashPicks(prev => new Map(prev).set(id, letter));
  }, []);

  const handleFlashToggle = useCallback((id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setFlashPicks(fp => {
          const nextFp = new Map(fp);
          nextFp.delete(id);
          return nextFp;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const highlightQuery = trimmed && !numberMatch ? trimmed : '';
  const visibleItems = matching.slice(0, visibleLimit);
  const remaining = matching.length - visibleItems.length;

  let countLabel = t('showingAll', { count: allInCategory.length.toLocaleString() });
  if (onlyBookmarked && !trimmed) {
    countLabel = t('savedCount', { count: matching.length.toLocaleString() });
  } else if (numberMatch) {
    countLabel = matching.length
      ? t('questionOf', { number: numberMatch[1], total: allInCategory.length.toLocaleString() })
      : t('notFound', { number: numberMatch[1] });
  } else if (trimmed) {
    countLabel = t('shown', {
      count: matching.length.toLocaleString(),
      total: allInCategory.length.toLocaleString(),
    });
  }

  return (
    <>
      <div className="prep-shell">
        <div className="session-top">
          <button type="button" className="plain-button" onClick={onGoHome}>
            ← {t('desk')}
          </button>
          <div className="meta">
            {t('questionCount', { count: allInCategory.length.toLocaleString() })}{' '}
            <span aria-hidden="true">·</span> {t('fastPrep')}
          </div>
        </div>

        <div className="prep-header">
          <h1 ref={titleRef} tabIndex={-1}>
            {getSubjectName(language, selectedCategory)}
          </h1>
          <div className="prep-subjects" role="group" aria-label={t('switchSubject')}>
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`subject-pill ${category === selectedCategory ? 'active' : ''}`}
                aria-pressed={category === selectedCategory}
                onClick={() => onSelectCategory(category)}
              >
                {getSubjectName(language, category).replace(/\s+Insurance$/i, '')}
              </button>
            ))}
          </div>
        </div>

        <div className="prep-sticky-bar">
          <div className="search-field">
            <SearchIcon />
            <input
              ref={searchInputRef}
              id="question-search"
              className="search-input"
              type="search"
              autoComplete="off"
              aria-label={t('searchLabel')}
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query.trim() && (
              <button
                type="button"
                className="search-clear"
                aria-label={t('clearSearch')}
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
              >
                {t('clear')}
              </button>
            )}
          </div>

          <div className="prep-controls-row">
            <div className="prep-mode-pills" role="group" aria-label={t('readingMode')}>
              {(
                [
                  ['all', 'allOptions'],
                  ['answer', 'answerOnly'],
                  ['flash', 'tapCheck'],
                ] as const
              ).map(([mode, labelKey]) => (
                <button
                  key={mode}
                  type="button"
                  className={`prep-mode-btn ${prepMode === mode ? 'active' : ''}`}
                  aria-pressed={prepMode === mode}
                  onClick={() => onSetPrepMode(mode)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`bookmark-filter ${onlyBookmarked ? 'active' : ''}`}
              aria-pressed={onlyBookmarked}
              onClick={() => setOnlyBookmarked(v => !v)}
            >
              <BookmarkIcon filled={onlyBookmarked} />
              <span>
                {t('saved')} ({savedInCat})
              </span>
            </button>
          </div>
        </div>

        <div className="prep-meta-bar">
          <p className="prep-count" role="status">
            {countLabel}
          </p>
          <p className="prep-source-note">{t('sourceAnswers')}</p>
        </div>

        <section className={`prep-list mode-${prepMode}`} aria-label={t('listLabel')}>
          {visibleItems.length > 0 ? (
            <>
              {visibleItems.map(({ q, number }) => (
                <PrepCard
                  key={q.id}
                  question={q}
                  number={number}
                  prepMode={prepMode}
                  highlightQuery={highlightQuery}
                  isSaved={bookmarks.has(q.id)}
                  isRevealed={revealedIds.has(q.id)}
                  pickedLetter={flashPicks.get(q.id)}
                  t={t}
                  onToggleBookmark={onToggleBookmark}
                  onFlashPick={handleFlashPick}
                  onFlashToggle={handleFlashToggle}
                />
              ))}
              {remaining > 0 && (
                <div ref={sentinelRef} className="load-more-wrap">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setVisibleLimit(prev => Math.min(matching.length, prev + BATCH_SIZE))}
                  >
                    {t('showMore', { count: remaining.toLocaleString() })}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-match">
              <p>
                {onlyBookmarked && !trimmed
                  ? t('noSaved')
                  : t('noMatch', { query: trimmed })}
              </p>
              {trimmed ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                >
                  {t('clearSearch')}
                </button>
              ) : (
                <button type="button" className="secondary" onClick={() => setOnlyBookmarked(false)}>
                  {t('showAll')}
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        className={`back-to-top ${showTop ? 'visible' : ''}`}
        aria-label={t('top')}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑ {t('top')}
      </button>
    </>
  );
}
