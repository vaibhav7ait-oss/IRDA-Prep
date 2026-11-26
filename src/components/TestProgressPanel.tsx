import { useEffect, useRef } from 'react';
import type { CopyKey } from '../i18n/copy';
import type { QuestionStatus, TestSession } from '../types';
import { getQuestionStatus } from '../utils/questions';
import { GridIcon } from './Icons';

interface TestProgressPanelProps {
  session: TestSession;
  timerText: string;
  timerLow: boolean;
  drawerOpen: boolean;
  onToggleDrawer: (open: boolean) => void;
  onJump: (index: number) => void;
  onFinish: () => void;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
}

export function TestProgressPanel({
  session,
  timerText,
  timerLow,
  drawerOpen,
  onToggleDrawer,
  onJump,
  onFinish,
  t,
}: TestProgressPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const statuses: QuestionStatus[] = session.ids.map(id => getQuestionStatus(id, session));
  const counts = {
    answered: statuses.filter(s => s === 'answered').length,
    unanswered: statuses.filter(s => s === 'unanswered').length,
    bookmarked: statuses.filter(s => s === 'bookmarked').length,
    unvisited: statuses.filter(s => s === 'unvisited').length,
  };
  const attempted = session.ids.filter(id => Boolean(session.answers[id])).length;

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, onToggleDrawer]);

  const legendAndGrid = (isMobileDrawer: boolean) => (
    <>
      <div className="status-legend" aria-label={t('testProgress')}>
        <span className="legend-item status-answered">
          <i className="legend-dot" aria-hidden="true" />
          <span>{t('statusAnswered')}</span>
          <b>{counts.answered}</b>
        </span>
        <span className="legend-item status-unanswered">
          <i className="legend-dot" aria-hidden="true" />
          <span>{t('statusUnanswered')}</span>
          <b>{counts.unanswered}</b>
        </span>
        <span className="legend-item status-bookmarked">
          <i className="legend-dot" aria-hidden="true" />
          <span>{t('statusBookmarked')}</span>
          <b>{counts.bookmarked}</b>
        </span>
        <span className="legend-item status-unvisited">
          <i className="legend-dot" aria-hidden="true" />
          <span>{t('statusUnvisited')}</span>
          <b>{counts.unvisited}</b>
        </span>
      </div>

      <div className="question-map" aria-label={t('jump')}>
        {session.ids.map((id, index) => {
          const status = statuses[index];
          const isCurrent = index === session.index;
          const isAlsoAnswered = status === 'bookmarked' && Boolean(session.answers[id]);
          const statusLabel =
            status === 'bookmarked'
              ? t('statusBookmarked')
              : status === 'answered'
                ? t('statusAnswered')
                : status === 'unanswered'
                  ? t('statusUnanswered')
                  : t('statusUnvisited');

          return (
            <button
              key={id}
              type="button"
              className={`map-button status-${status} ${isCurrent ? 'current' : ''} ${isAlsoAnswered ? 'also-answered' : ''}`}
              onClick={() => {
                onJump(index);
                if (isMobileDrawer) onToggleDrawer(false);
              }}
              aria-label={`${t('questionPosition', { number: index + 1, total: session.ids.length })} (${statusLabel})`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <button type="button" className="secondary finish-button" onClick={onFinish}>
        {t('finishTest')}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile sticky summary bar + slide-up sheet trigger */}
      <div className="mobile-progress-bar">
        <div className="mobile-progress-stats">
          <div className="mobile-mini-counts" aria-label={t('testProgress')}>
            <span className="mini-pill status-answered" title={t('statusAnswered')}>{counts.answered}</span>
            <span className="mini-pill status-unanswered" title={t('statusUnanswered')}>{counts.unanswered}</span>
            <span className="mini-pill status-bookmarked" title={t('statusBookmarked')}>{counts.bookmarked}</span>
            <span className="mini-pill status-unvisited" title={t('statusUnvisited')}>{counts.unvisited}</span>
          </div>
          {session.deadline && (
            <span className={`mobile-timer ${timerLow ? 'low' : ''}`} aria-label={t('timeRemaining')}>
              {timerText}
            </span>
          )}
        </div>
        <button
          type="button"
          className="mobile-map-trigger"
          aria-expanded={drawerOpen}
          onClick={() => onToggleDrawer(!drawerOpen)}
        >
          <GridIcon />
          <span>{t('openProgress')}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="progress-drawer-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) onToggleDrawer(false);
          }}
        >
          <div
            ref={drawerRef}
            className="progress-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('testProgress')}
            tabIndex={-1}
          >
            <div className="drawer-head">
              <div>
                <h2>{t('testProgress')}</h2>
                <p>{t('answeredCount', { count: attempted, total: session.ids.length })}</p>
              </div>
              <button type="button" className="secondary drawer-close" onClick={() => onToggleDrawer(false)}>
                {t('closeProgress')}
              </button>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${(attempted / session.ids.length) * 100}%` }} />
            </div>
            {legendAndGrid(true)}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="side-panel" aria-label={t('sessionProgress')}>
        <h2>{t('testProgress')}</h2>
        <p>{t('answeredCount', { count: attempted, total: session.ids.length })}</p>
        {session.deadline && (
          <div className={`timer ${timerLow ? 'low' : ''}`} aria-label={t('timeRemaining')}>
            {timerText}
          </div>
        )}
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(attempted / session.ids.length) * 100}%` }} />
        </div>
        {legendAndGrid(false)}
        <div className="keyboard-tip">{t('keyboardTip')}</div>
      </aside>
    </>
  );
}
