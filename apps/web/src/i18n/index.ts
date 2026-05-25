import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import en from "./en.json";

const storedLanguage = window.localStorage.getItem("language");
const initialLanguage = storedLanguage === "de" || storedLanguage === "en" ? storedLanguage : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de }
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export { i18n };
