import { LanguageDefinition, en } from "./languages/en";
import { es } from "./languages/es";

export function getI18N(lang: string | null): LanguageDefinition {
  const langCode = (lang || "en").slice(0, 2);
  switch (langCode) {
    case "es":
      return es;
    case "en":
      return en;
    default:
      return en;
  }
}

export const i18n = en;
