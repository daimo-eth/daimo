import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";

import { SkinContextType, skins } from "./skins";

const THEME_STORAGE_KEY = "@daimo_app_theme";

type ThemeContextType = {
  theme: SkinContextType;
  setTheme: (theme: SkinContextType) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: skins.usdt,
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

// Load saved theme from AsyncStorage
export async function loadSavedTheme(): Promise<SkinContextType> {
  try {
    const savedThemeName = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    const savedTheme =
      skins[savedThemeName as keyof typeof skins] || skins.usdt;
    await saveTheme(savedTheme);
    return savedTheme;
  } catch (error) {
    console.error("Failed to load theme", error);
    return skins.usdc;
  }
}

// Save theme to AsyncStorage
export async function saveTheme(skin: SkinContextType) {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, skin.name);
}
