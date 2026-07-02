import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bloodlink-theme";
const VALID_THEMES = ["light", "dark", "crimson"];

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_THEMES.includes(stored)) return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((next) => {
    if (!VALID_THEMES.includes(next)) return console.warn("[theme] rejected invalid theme:", next);
    console.log("[theme] setting data-theme =", next);
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  /* sync data-theme attribute whenever state changes */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* listen for OS scheme changes only when user hasn't saved a preference */
  useEffect(() => {
    const hasSavedPref = localStorage.getItem(STORAGE_KEY) !== null;
    if (hasSavedPref) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => {
      setThemeState(event.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const ctx = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
