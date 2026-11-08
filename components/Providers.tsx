"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, Dict, Lang } from "@/lib/i18n";

type Theme = "dark" | "light";

type AppContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: Dict;
};

const Ctx = createContext<AppContext | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [theme, setTheme] = useState<Theme>("dark");

  // читаем сохранённые настройки после загрузки страницы
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("xl-lang") as Lang | null;
      if (savedLang && dictionaries[savedLang]) setLangState(savedLang);
      const savedTheme = localStorage.getItem("xl-theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {
      // localStorage может быть недоступен — просто остаёмся на дефолтах
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem("xl-lang", l);
    } catch {}
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("xl-theme", next);
    } catch {}
  }

  return (
    <Ctx.Provider value={{ lang, setLang, theme, toggleTheme, t: dictionaries[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}
