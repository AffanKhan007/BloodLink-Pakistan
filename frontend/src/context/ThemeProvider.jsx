import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bloodlink-theme";
const VALID_MODES = ["light", "dark", "system"];
const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function resolveTheme(mode) {
  if (mode === "system") return mq && mq.matches ? "dark" : "light";
  return mode;
}

function getInitialMode() {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_MODES.includes(stored)) return stored;
  return "system";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);
  const [resolved, setResolved] = useState(() => resolveTheme(getInitialMode()));

  const setMode = useCallback((next) => {
    if (!VALID_MODES.includes(next)) return;
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    setResolved(resolveTheme(next));
  }, []);

  /* Apply data-theme attribute to <html> */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  /* Listen for OS scheme changes when mode is "system" */
  useEffect(() => {
    if (!mq || mode !== "system") return;
    const handler = (e) => setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  /* Re-resolve when mode changes from system to light/dark or vice versa */
  useEffect(() => {
    setResolved(resolveTheme(mode));
  }, [mode]);

  const ctx = useMemo(() => ({ theme: resolved, mode, setMode }), [resolved, mode, setMode]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
