import { en } from "./languages/en";
import { es } from "./languages/es";

export type I18NTranslation = typeof en;

export type Locale = { languageCode: string | null };

// Return i18n translation based on locale
export const i18n = (locale: Locale | undefined): I18NTranslation => {
  switch (locale?.languageCode) {
    case "es":
      return es;
    case "en":
    default:
      return en;
  }
};
