import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import bn from "./bn.json";

let initialized = false;

export function initI18n(lang: "en" | "bn" = "en") {
  if (initialized) {
    i18n.changeLanguage(lang);
    return i18n;
  }
  initialized = true;
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    lng: lang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return i18n;
}

export default i18n;
