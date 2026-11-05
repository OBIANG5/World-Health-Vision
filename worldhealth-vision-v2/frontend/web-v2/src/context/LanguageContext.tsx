// WorldHealthVision V2 — LanguageContext
// Contexte React pour le switcher FR / EN. Les données backend restent en français.
// Seuls les labels UI statiques changent de langue.

import { createContext, useContext, useState } from "react";

export type Lang = "fr" | "en";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LanguageContext = createContext<Ctx>({ lang: "fr", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): Lang {
  return useContext(LanguageContext).lang;
}

export function useToggleLang(): () => void {
  const { lang, setLang } = useContext(LanguageContext);
  return () => setLang(lang === "fr" ? "en" : "fr");
}