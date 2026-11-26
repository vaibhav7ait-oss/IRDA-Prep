import type { Language } from '../types';

interface HeaderProps {
  language: Language;
  languageLabel: string;
  onLanguageChange: (lang: Language) => void;
  onBrandClick: () => void;
}

export function Header({ language, languageLabel, onLanguageChange, onBrandClick }: HeaderProps) {
  return (
    <header className="site-header">
      <button type="button" className="brand-button" onClick={onBrandClick} aria-label="Insurance Prep">
        <span className="brand-mark" aria-hidden="true">i.</span>
        <span>Insurance Prep</span>
      </button>
      <label className="language-picker" htmlFor="language-select">
        <span>{languageLabel}</span>
        <select
          id="language-select"
          aria-label={languageLabel}
          value={language}
          onChange={e => onLanguageChange(e.target.value as Language)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="gu">ગુજરાતી</option>
        </select>
      </label>
    </header>
  );
}
