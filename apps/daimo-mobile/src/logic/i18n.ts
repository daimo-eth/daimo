import { useEffect, useState } from "react";
import {
  BaseTranslation,
  i18n,
  i18nObject as initI18nObject,
} from "typesafe-i18n";

import { getAccountManager } from "./accountManager";
import en from "../i18n/en";
import { Locales, Translation, Translations } from "../i18n/i18n-types";
import { loadedLocales } from "../i18n/i18n-util";
import { loadLocaleAsync } from "../i18n/i18n-util.async";
import { loadLocale } from "../i18n/i18n-util.sync";

const defaultLocale = "en"; // TODO

const localeTranslations = {
  en,
};

export function useI18n() {
  const locale = "en";
  console.log(
    `[I18N] example: ${localeTranslations[locale].createBackup.default.header}`
  );
  // loadLocale(locale);
  useEffect(() => {
    async function load() {
      await loadLocaleAsync(locale);
    }
    load();
  }, []);

  return initI18nObject(locale, localeTranslations[locale]);
}

// export function useI18n() {
//   // const i18nManager = getI18nManager();
//   // const LL = i18nManager.getI18nObject();
//   // return LL;
//   const context = useI18nContext().LL;

//   console.log(`[I18N] example: ${context.amountInput.dollarsAvailable}`);
//   return useI18nContext().LL;
//   // return i18nObject(locale, loadedLocales[locale]);
// }

export function useLocale(): Locales {
  const i18nManager = getI18nManager();
  return i18nManager.locale;
}

let i18nManager = null as null | I18nManager;

function getI18nManager() {
  if (i18nManager == null) {
    i18nManager = new I18nManager();
  }
  return i18nManager;
}

class I18nManager {
  locale: Locales;
  translator: Translation;

  constructor() {
    this.locale = defaultLocale;
    this.translator = localeTranslations[this.locale] as Translation;
    console.log(`[I18N] created i18nManager`);
  }

  // getI18nObject() {
  //   return i18nObject(this.locale, [this.translator], {});
  // }
}
//
