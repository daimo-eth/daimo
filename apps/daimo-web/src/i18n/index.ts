import { LangDef, en } from "./languages/en";
import { es } from "./languages/es";

export function getI18N(lang: string | null): LangDef {
  const langCode = (lang || "en").slice(0, 2);

  switch (langCode) {
    case "es":
      return es;
    case "en":
    default:
      return en;
  }
}
