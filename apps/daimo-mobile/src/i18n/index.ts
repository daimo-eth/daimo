import { getLocales } from "expo-localization";

import { en } from "./languages/en";

type I18NTranslation = typeof en;

export function getI18NLocale() {
  return getLocales()[0];
}

export const i18n: I18NTranslation = (function () {
  // Get current system locale.
  const { languageCode } = getI18NLocale();

  switch (languageCode) {
    // TODO: handle other languages here
    // case "es":
    default:
      return en;
  }
})();
