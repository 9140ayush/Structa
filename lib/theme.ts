import { z } from "zod";

export const THEME_COOKIE_NAME = "structa-theme";
export const THEME_STORAGE_KEY = "structa-theme";

export const ThemeSchema = z.enum(["dark", "light"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const DEFAULT_THEME: Theme = "dark";

/**
 * Tiny inline script injected directly into <head> to prevent theme flash (FOUC)
 * on static/cached pages. Evaluates synchronously before first paint.
 * Default is dark; only removes the 'dark' class if the cookie is explicitly 'light'.
 */
export const themeInitScript = `(function() {
  try {
    var match = document.cookie.match(new RegExp('(^|; )' + '${THEME_COOKIE_NAME}' + '=([^;]+)'));
    var theme = match ? decodeURIComponent(match[2]) : '${DEFAULT_THEME}';
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;

