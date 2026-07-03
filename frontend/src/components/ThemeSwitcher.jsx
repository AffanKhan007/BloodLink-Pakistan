import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useRef } from "react";
import { LayoutGroup, MotionConfig, motion } from "framer-motion";

import { useTheme } from "../context/ThemeProvider";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const containerRef = useRef(null);

  const activeIndex = MODES.findIndex((m) => m.key === mode);

  const handleSelect = useCallback(
    (key) => {
      setMode(key);
    },
    [setMode]
  );

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <LayoutGroup id="theme-switcher">
        <div className="theme-switcher-pill" ref={containerRef}>
          <div className="theme-pill-track">
            {MODES.map((m) => {
              const isActive = m.key === mode;
              return (
                <button
                  key={m.key}
                  type="button"
                  className={`theme-pill-segment ${isActive ? "theme-pill-segment-active" : ""}`}
                  onClick={() => handleSelect(m.key)}
                  aria-label={`${m.label} mode`}
                  title={m.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="theme-indicator"
                      className="theme-pill-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="theme-pill-icon">
                    <m.icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
