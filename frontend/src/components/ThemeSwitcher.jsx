import { Droplets, Moon, Sun } from "lucide-react";
import { useCallback, useMemo } from "react";

import { useTheme } from "../context/ThemeProvider";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "crimson", label: "Crimson", icon: Droplets },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const activeIndex = useMemo(() => MODES.findIndex((m) => m.key === theme), [theme]);

  const handleSelect = useCallback(
    (key) => {
      setTheme(key);
    },
    [setTheme]
  );

  return (
    <div className="theme-switcher-pill">
      <div className="theme-pill-track">
        <div
          className="theme-pill-indicator"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.key === theme;
          return (
            <button
              key={mode.key}
              type="button"
              className={`theme-pill-segment ${isActive ? "theme-pill-segment-active" : ""}`}
              onClick={() => handleSelect(mode.key)}
              aria-label={`${mode.label} mode`}
              title={mode.label}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
