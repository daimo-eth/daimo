import { en } from "./languages/en";
import { es } from "./languages/es";

export type I18NTranslation = typeof en;

// Return i18n translation based on locale
export const i18n = (lang: string | undefined): I18NTranslation => {
  switch (lang) {
    case "es":
      return es;
    case "en":
    default:
      return en;
  }
};
