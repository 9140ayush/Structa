"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Theme, DEFAULT_THEME, THEME_COOKIE_NAME, ThemeSchema } from "@/lib/theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getCookieTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  try {
    const match = document.cookie.match(new RegExp(`(^|; )${THEME_COOKIE_NAME}=([^;]+)`));
    if (match) {
      const parsed = ThemeSchema.safeParse(decodeURIComponent(match[2]));
      if (parsed.success) return parsed.data;
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_THEME;
}

function setCookieTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const isSecure = window.location.protocol === "https:";
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(
    theme,
  )}; path=/; max-age=31536000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    // Sync state with DOM/cookie once mounted on client
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setThemeState(current);
  }, []);

  const applyTheme = useCallback((newTheme: Theme) => {
    // Suppress CSS transitions temporarily to prevent transition fireworks
    document.documentElement.classList.add("disable-transitions");

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    setCookieTheme(newTheme);
    setThemeState(newTheme);

    // Update <meta name="theme-color">
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colorHex = newTheme === "dark" ? "#0A0C10" : "#F7F8FA";
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", colorHex);
    } else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = colorHex;
      document.head.appendChild(meta);
    }

    // Re-enable transitions after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("disable-transitions");
      });
    });
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      applyTheme(newTheme);
    },
    [applyTheme],
  );

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

