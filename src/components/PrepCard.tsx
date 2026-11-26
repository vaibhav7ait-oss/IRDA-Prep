import { memo, Fragment } from 'react';
import type { CopyKey } from '../i18n/copy';
import { LETTERS } from '../i18n/copy';
import type { Letter, PrepMode, Question } from '../types';
import { BookmarkIcon } from './Icons';

interface PrepCardProps {
  question: Question;
  number: number;
  prepMode: PrepMode;
  highlightQuery: string;
  isSaved: boolean;
  isRevealed: boolean;
  pickedLetter?: Letter;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onToggleBookmark: (id: string) => void;
  onFlashPick: (id: string, letter: Letter) => void;
  onFlashToggle: (id: string) => void;
}

function renderHighlighted(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);
  if (parts.length === 1) return text;
  const lowerQuery = query.toLocaleLowerCase();
  return parts.map((part, idx) =>
    part.toLocaleLowerCase() === lowerQuery ? (
      <mark key={idx} className="search-hit">{part}</mark>
    ) : (
      <Fragment key={idx}>{part}</Fragment>
    )
  );
}

export const PrepCard = memo(function PrepCard({
  question,
  number,
  prepMode,
  highlightQuery,
  isSaved,
  isRevealed,
  pickedLetter,
  t,
  onToggleBookmark,
  onFlashPick,
  onFlashToggle,
}: PrepCardProps) {
  const choicesToRender =
    prepMode === 'answer'
      ? question.answer
        ? [{ choice: question.choices[LETTERS.indexOf(question.answer)], letter: question.answer }]
        : []
      : question.choices.map((choice, index) => ({ choice, letter: LETTERS[index] as Letter }));

  return (
    <article
      className={`prep-card ${question.answer === null ? 'is-unscored' : ''} ${isRevealed ? 'revealed' : ''}`}
      aria-labelledby={`prep-question-${number}`}
    >
      <div className="prep-card-top">
        <span className="prep-number">Q{number}</span>
        <button
          type="button"
          className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
          aria-pressed={isSaved}
          aria-label={t(isSaved ? 'removeBookmark' : 'bookmark')}
          onClick={() => onToggleBookmark(question.id)}
        >
          <BookmarkIcon filled={isSaved} />
          <span>{t(isSaved ? 'saved' : 'save')}</span>
        </button>
      </div>

      <h2 id={`prep-question-${number}`}>{renderHighlighted(question.text, highlightQuery)}</h2>

      {choicesToRender.length > 0 && (
        <ol className="prep-options" aria-label={t('answerOptions')}>
          {choicesToRender.map(({ choice, letter }) => {
            const isAnswer = question.answer === letter;
            if (prepMode === 'flash') {
              const isPickedWrong = isRevealed && pickedLetter === letter && !isAnswer;
              return (
                <li key={letter}>
                  <button
                    type="button"
                    className={`prep-option prep-option-btn ${isAnswer ? 'is-answer' : ''} ${isPickedWrong ? 'picked-wrong' : ''}`}
                    onClick={() => onFlashPick(question.id, letter)}
                  >
                    <span className="letter">{letter}</span>
                    <span className="prep-option-text">{renderHighlighted(choice, highlightQuery)}</span>
                    {isAnswer && <span className="answer-tag">{t('answer')}</span>}
                  </button>
                </li>
              );
            }
            return (
              <li key={letter} className={`prep-option ${isAnswer ? 'is-answer' : ''}`}>
                <span className="letter">{letter}</span>
                <span className="prep-option-text">{renderHighlighted(choice, highlightQuery)}</span>
                {isAnswer && <span className="answer-tag">{t('answer')}</span>}
              </li>
            );
          })}
        </ol>
      )}

      {prepMode === 'flash' && question.answer !== null && (
        <div className="reveal-bar">
          <button type="button" className="reveal-toggle" onClick={() => onFlashToggle(question.id)}>
            {t(isRevealed ? 'hideAnswer' : 'showAnswer')}
          </button>
        </div>
      )}

      {question.answer === null && <p className="missing-answer">{t('noRecorded')}</p>}
    </article>
  );
});
