"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn, focusRing } from "../primitives/cn";
import { MonitorIcon, MoonIcon, SunIcon } from "../icons";

export type ThemeChoice = "midnight" | "daybreak" | "auto";
type Resolved = "dark" | "light";

const STORAGE_KEY = "cf-theme";

interface ThemeContextValue {
  theme: ThemeChoice;
  resolved: Resolved;
  setTheme: (theme: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: ThemeChoice): Resolved {
  if (theme === "midnight") return "dark";
  if (theme === "daybreak") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("auto");
  const [resolved, setResolved] = useState<Resolved>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the stored choice (the no-flash script already set data-theme for first paint).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "midnight" || stored === "daybreak" || stored === "auto") setThemeState(stored);
    setHydrated(true);
  }, []);

  // Apply data-theme and follow the system preference when on "auto". Gated on `hydrated` so we
  // don't briefly apply the default "auto" before the stored choice loads (no theme flash).
  useEffect(() => {
    if (!hydrated) return;
    const apply = () => {
      const next = resolveTheme(theme);
      setResolved(next);
      document.documentElement.dataset.theme = next;
    };
    apply();
    if (theme !== "auto") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme, hydrated]);

  const setTheme = useCallback((next: ThemeChoice) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}

const CHOICES = [
  { value: "midnight", label: "Midnight", Icon: MoonIcon },
  { value: "daybreak", label: "Daybreak", Icon: SunIcon },
  { value: "auto", label: "Auto", Icon: MonitorIcon },
] as const;

/** Segmented control for Midnight / Daybreak / Auto (aria-pressed toggle buttons). */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-md border border-subtle bg-elevated p-0.5"
    >
      {CHOICES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
            focusRing,
            theme === value ? "bg-aurora-cta text-accent-contrast" : "text-muted hover:text-fg",
          )}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
