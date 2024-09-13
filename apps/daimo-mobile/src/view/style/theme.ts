import { createContext, useContext } from "react";

import { SkinContextType, skins } from "./skins";

type ThemeContextType = {
  theme: SkinContextType;
  setTheme: (theme: SkinContextType) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: skins.usdc,
  setTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return {
    color: context.theme.color,
    touchHighlightUnderlay: context.theme.touchHighlightUnderlay,
    ss: context.theme.ss,
    theme: context.theme,
    setTheme: context.setTheme,
  };
}
