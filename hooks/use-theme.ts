"use client";

import { useThemeContext } from "@/components/shared/ThemeProvider";
import type { Theme } from "@/lib/theme";

export function useTheme(): {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} {
  const { theme, setTheme, toggleTheme } = useThemeContext();
  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
  };
}

