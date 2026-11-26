import { useState } from 'react';
import type { CopyKey } from '../i18n/copy';
import { getSubjectName } from '../i18n/copy';
import type { Language, Question, StudyMode, TestSession } from '../types';
import { categoryQuestions } from '../utils/questions';

interface HomePageProps {
  language: Language;
  questions: Question[];
  categories: string[];
  selectedCategory: string;
  selectedMode: StudyMode;
  session: TestSession | null;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onSelectCategory: (cat: string) => void;
  onSelectMode: (mode: StudyMode) => void;
  onOpenPrep: () => void;
  onStartTest: (count: number, timed: boolean) => void;
  onResumeTest: () => void;
}

export function HomePage({
  language,
  questions,
  categories,
  selectedCategory,
  selectedMode,
  session,
  t,
  onSelectCategory,
  onSelectMode,
  onOpenPrep,
  onStartTest,
  onResumeTest,
}: HomePageProps) {
  const [questionCount, setQuestionCount] = useState(20);
  const [timed, setTimed] = useState(true);

  return (
    <>
      <section className="intro" aria-labelledby="intro-title">
        <div className="eyebrow">{t('introLabel')}</div>
        <h1 id="intro-title">{t('introTitle')}</h1>
        <p>{t('introText')}</p>
      </section>

      {session && !session.finished && session.language === language && (
        <button type="button" className="secondary resume-button" onClick={onResumeTest}>
          {t('resume', { subject: getSubjectName(language, session.category) })}
        </button>
      )}

      <section aria-labelledby="category-title">
        <div className="section-head">
          <h2 id="category-title">{t('chooseSubject')}</h2>
          <span>{t('distinct', { count: questions.length.toLocaleString() })}</span>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`category-card ${selectedCategory === category ? 'selected' : ''}`}
              aria-pressed={selectedCategory === category}
              onClick={() => onSelectCategory(category)}
            >
              <span className="num">{t('subjectNumber', { number: index + 1 })}</span>
              <strong>{getSubjectName(language, category)}</strong>
              <small>{t('available', { count: categoryQuestions(questions, category).length.toLocaleString() })}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-panel" aria-labelledby="setup-title">
        <div>
          <div className="eyebrow">{t('ready')}</div>
          <h2 id="setup-title">{t(selectedMode === 'preparation' ? 'prepTitle' : 'testTitle')}</h2>
          <p>{t(selectedMode === 'preparation' ? 'prepText' : 'testText')}</p>
        </div>

        <div className="setup-controls">
          <div className="segmented" role="group" aria-label={t('modeLabel')}>
            <button
              type="button"
              className={selectedMode === 'preparation' ? 'active' : ''}
              aria-pressed={selectedMode === 'preparation'}
              onClick={() => onSelectMode('preparation')}
            >
              {t('preparation')}
            </button>
            <button
              type="button"
              className={selectedMode === 'test' ? 'active' : ''}
              aria-pressed={selectedMode === 'test'}
              onClick={() => onSelectMode('test')}
            >
              {t('takeTest')}
            </button>
          </div>

          {selectedMode === 'test' && (
            <div className="setting-row">
              <label htmlFor="question-count">{t('questions')}</label>
              <select
                id="question-count"
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
              >
                <option value={20}>{t('questionCount', { count: 20 })}</option>
                <option value={50}>{t('questionCount', { count: 50 })}</option>
              </select>
              <label className="check-setting">
                <input type="checkbox" checked={timed} onChange={e => setTimed(e.target.checked)} />
                <span>{t('timed')}</span>
              </label>
            </div>
          )}

          <button
            type="button"
            className="primary light"
            onClick={() => (selectedMode === 'preparation' ? onOpenPrep() : onStartTest(questionCount, timed))}
          >
            {t(selectedMode === 'preparation' ? 'openBank' : 'startTest')} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <p className="fine-print">{t('sourceNote')}</p>
    </>
  );
}
