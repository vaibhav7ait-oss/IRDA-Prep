import { useEffect, useRef, useState } from 'react';
import { BookmarkIcon } from '../components/Icons';
import { TestProgressPanel } from '../components/TestProgressPanel';
import type { CopyKey } from '../i18n/copy';
import { getSubjectName, LETTERS } from '../i18n/copy';
import type { Language, Letter, Question, TestSession } from '../types';
import { formatRemaining, optionOrder } from '../utils/questions';

interface TestPageProps {
  language: Language;
  session: TestSession;
  byId: Map<string, Question>;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onAnswer: (questionId: string, sourceLetter: Letter) => void;
  onToggleFlag: (questionId: string) => void;
  onNavigateIndex: (nextIndex: number) => void;
  onFinish: (expired?: boolean) => void;
  onGoHome: () => void;
}

export function TestPage({
  language,
  session,
  byId,
  t,
  onAnswer,
  onToggleFlag,
  onNavigateIndex,
  onFinish,
  onGoHome,
}: TestPageProps) {
  const [now, setNow] = useState(Date.now);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const q = byId.get(session.ids[session.index]);

  useEffect(() => {
    if (!session.deadline || session.finished) return;
    if (session.deadline <= Date.now()) {
      onFinish(true);
      return;
    }
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (session.deadline && session.deadline <= current) {
        onFinish(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [session.deadline, session.finished, onFinish]);

  useEffect(() => {
    titleRef.current?.focus();
    window.scrollTo(0, 0);
  }, [session.index]);

  useEffect(() => {
    if (!q) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || drawerOpen) return;
      const activeTag = document.activeElement?.tagName || '';
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(activeTag)) return;

      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const order = optionOrder(session, q.id);
        const sourceLetter = order[Number(event.key) - 1];
        if (sourceLetter) onAnswer(q.id, sourceLetter);
      } else if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        onToggleFlag(q.id);
      } else if (event.key === 'ArrowRight' && session.index < session.ids.length - 1) {
        event.preventDefault();
        onNavigateIndex(session.index + 1);
      } else if (event.key === 'ArrowLeft' && session.index > 0) {
        event.preventDefault();
        onNavigateIndex(session.index - 1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [q, session, drawerOpen, onAnswer, onToggleFlag, onNavigateIndex]);

  if (!q) return null;

  const answer = session.answers[q.id];
  const isFlagged = session.flagged.includes(q.id);
  const order = optionOrder(session, q.id);
  const timerText = formatRemaining(session.deadline, now);
  const timerLow = session.deadline !== null && session.deadline - now < 5 * 60_000;

  return (
    <>
      <div className="session-top">
        <button type="button" className="plain-button" onClick={onGoHome}>
          ← {t('desk')}
        </button>
        <div className="meta">
          {getSubjectName(language, session.category)} <span aria-hidden="true">·</span> {t('test')}
        </div>
      </div>

      <div className="session-layout">
        <TestProgressPanel
          session={session}
          timerText={timerText}
          timerLow={timerLow}
          drawerOpen={drawerOpen}
          onToggleDrawer={setDrawerOpen}
          onJump={onNavigateIndex}
          onFinish={() => onFinish(false)}
          t={t}
        />

        <article className="question-sheet" aria-labelledby="question-title">
          <div className="question-kicker">
            <span>{t('questionPosition', { number: session.index + 1, total: session.ids.length })}</span>
            <button
              type="button"
              className={`test-bookmark-btn ${isFlagged ? 'flagged' : ''}`}
              aria-pressed={isFlagged}
              onClick={() => onToggleFlag(q.id)}
            >
              <BookmarkIcon filled={isFlagged} />
              <span>{t(isFlagged ? 'bookmarkedLater' : 'bookmarkLater')}</span>
            </button>
          </div>

          <h1 ref={titleRef} id="question-title" tabIndex={-1}>
            {q.text}
          </h1>

          <fieldset className="choices">
            <legend>{t('chooseAnswer')}</legend>
            {order.map((sourceLetter, index) => {
              const displayChar = LETTERS[index];
              const choiceText = q.choices[LETTERS.indexOf(sourceLetter)];
              const isSelected = answer === sourceLetter;
              return (
                <button
                  key={sourceLetter}
                  type="button"
                  className={`choice ${isSelected ? 'selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onAnswer(q.id, sourceLetter)}
                >
                  <span className="letter">{displayChar}</span>
                  <span>{choiceText}</span>
                </button>
              );
            })}
          </fieldset>

          <div className="question-actions">
            <button
              type="button"
              className="secondary"
              disabled={session.index === 0}
              onClick={() => onNavigateIndex(Math.max(0, session.index - 1))}
            >
              ← {t('previous')}
            </button>
            <div className="action-group">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  if (session.index === session.ids.length - 1) onFinish(false);
                  else onNavigateIndex(session.index + 1);
                }}
              >
                {session.index === session.ids.length - 1 ? t('finishReview') : `${t('next')} →`}
              </button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
