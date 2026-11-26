import type { CopyKey } from '../i18n/copy';
import { getSubjectName, LETTERS } from '../i18n/copy';
import type { Language, Question, TestSession } from '../types';
import { displayLetter } from '../utils/questions';

interface ResultsPageProps {
  language: Language;
  session: TestSession;
  byId: Map<string, Question>;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onStartNew: () => void;
}

export function ResultsPage({ language, session, byId, t, onStartNew }: ResultsPageProps) {
  const items = session.ids.map(id => byId.get(id)).filter((q): q is Question => Boolean(q));
  const scored = items.filter(q => q.answer !== null);
  const correct = scored.filter(q => session.answers[q.id] === q.answer).length;
  const incorrect = scored.filter(q => session.answers[q.id] && session.answers[q.id] !== q.answer).length;
  const unanswered = scored.length - correct - incorrect;
  const percent = scored.length ? Math.round((correct / scored.length) * 100) : 0;

  return (
    <section className="results" aria-labelledby="results-title">
      <div className="eyebrow">
        {t(session.expired ? 'timeUp' : 'complete')} · {getSubjectName(language, session.category)}
      </div>
      <h1 id="results-title">{t('resultTitle')}</h1>
      <p className="result-intro">{t('resultIntro')}</p>
      <div className="score-line">
        {percent}% <span>{t('scoreText', { correct, total: scored.length })}</span>
      </div>
      <div className="score-grid">
        <div className="stat">
          <strong>{correct}</strong>
          <span>{t('correct')}</span>
        </div>
        <div className="stat">
          <strong>{incorrect}</strong>
          <span>{t('revisit')}</span>
        </div>
        <div className="stat">
          <strong>{unanswered}</strong>
          <span>{t('unanswered')}</span>
        </div>
      </div>

      <button type="button" className="primary" onClick={onStartNew}>
        {t('newSession')}
      </button>

      <div className="review-head">
        <div className="eyebrow">{t('closer')}</div>
        <h2>{t('reviewTitle')}</h2>
      </div>

      <div className="review-list">
        {items.length ? (
          items.map((q, index) => {
            const chosen = session.answers[q.id];
            const state = !q.answer ? 'unscored' : !chosen ? 'skipped' : chosen === q.answer ? 'correct' : 'review';
            const picked = chosen
              ? `${displayLetter(session, q.id, chosen)}. ${q.choices[LETTERS.indexOf(chosen)]}`
              : t('noSelected');
            const actual = q.answer
              ? `${displayLetter(session, q.id, q.answer)}. ${q.choices[LETTERS.indexOf(q.answer)]}`
              : t('noSourceAnswer');
            const wasBookmarked = session.flagged.includes(q.id);

            return (
              <details key={q.id} className="review-item">
                <summary>
                  <span className={`badge ${state === 'review' ? 'wrong' : ''}`}>{t(state)}</span>
                  {wasBookmarked && <span className="badge badge-blue">{t('statusBookmarked')}</span>}
                  <span>
                    {index + 1}. {q.text}
                  </span>
                </summary>
                <div className="review-body">
                  <p>
                    {t('yourAnswer')}: {picked}
                  </p>
                  <p className="answer-line">
                    {t('correctAnswer')}: {actual}
                  </p>
                </div>
              </details>
            );
          })
        ) : (
          <p>{t('noAnswered')}</p>
        )}
      </div>
    </section>
  );
}
