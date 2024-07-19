import { getAccountManager } from "./accountManager";
import { useI18nContext } from "../i18n/i18n-react";
import { i18nObject } from "../i18n/i18n-util";

export function useI18n() {
  // const manager = getAccountManager();
  // const locale = manager.getLocale();
  const locale = "en"; // TODO
  return i18nObject(locale);
}
