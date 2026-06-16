import { create } from "zustand";

export type Lang = "en" | "bn";

interface LanguageState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const STORAGE_KEY = "homebee.lang";

function getInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  return stored === "bn" ? "bn" : "en";
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: getInitial(),
  setLang: (lang) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, lang);
    set({ lang });
  },
  toggle: () => get().setLang(get().lang === "en" ? "bn" : "en"),
}));
