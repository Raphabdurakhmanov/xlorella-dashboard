"use client";

import { LANGS } from "@/lib/i18n";
import { useApp } from "./Providers";

// Переключатель языка (RU / EN / UZ) + кнопка темы
export function Toggles() {
  const { lang, setLang, theme, toggleTheme, t } = useApp();

  return (
    <div className="toggles">
      <div className="lang-switch" role="group" aria-label={t.common.language}>
        {LANGS.map((l) => (
          <button
            key={l}
            className={l === lang ? "active" : ""}
            onClick={() => setLang(l)}
            aria-pressed={l === lang}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        className="theme-btn"
        onClick={toggleTheme}
        title={theme === "dark" ? t.common.lightTheme : t.common.darkTheme}
        aria-label={theme === "dark" ? t.common.lightTheme : t.common.darkTheme}
      >
        {theme === "dark" ? (
          // солнце
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          // луна
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
