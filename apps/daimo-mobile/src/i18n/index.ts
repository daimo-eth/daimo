import { getLocales } from "expo-localization";

import { en } from "./languages/en";
import { es } from "./languages/es";

type I18NTranslation = typeof en;

export const i18NLocale = getLocales()[0];

export const i18n: I18NTranslation = (function () {
  // Get current system locale.
  const { languageCode } = i18NLocale;

  switch (languageCode) {
    // TODO: handle other languages here
    case "es":
      return es;
    case "en":
    default:
      return en;
  }
})();
