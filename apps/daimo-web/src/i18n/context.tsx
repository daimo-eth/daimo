"use client";

import { createContext, useContext } from "react";

import { getI18N } from ".";
import { LangDef, en } from "./languages/en";

const I18NContext = createContext<LangDef>(en);

export function I18NProvider({
  lang,
  children,
}: {
  lang: string | null;
  children: React.ReactNode;
}) {
  const i18n = getI18N(lang);
  return <I18NContext.Provider value={i18n}>{children}</I18NContext.Provider>;
}

export function useI18N(): LangDef {
  return useContext(I18NContext);
}
