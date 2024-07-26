import { Locale } from "expo-localization";

import { en } from "./languages/en";

export type I18NTranslation = typeof en; // TODO: add es

// Return i18n translation based on locale
export const i18n = (locale: Locale | undefined): I18NTranslation => {
  if (locale == null) return en; // default to en
  switch (locale.languageCode) {
    case "en":
    default:
      return en;
  }
};
