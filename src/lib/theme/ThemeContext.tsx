"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Theme = "dark" | "light" | "blue";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<ThemeContextType>({ theme: "dark", setTheme: () => {} });

const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    "--bg-primary": "#0B0E11",
    "--bg-card": "#1E2329",
    "--bg-card-hover": "#2B3139",
    "--bg-input": "#2B3139",
    "--border-default": "#2B3139",
    "--border-input": "#363C45",
    "--text-primary": "#FFFFFF",
    "--text-secondary": "#848E9C",
    "--text-dim": "#5E6673",
    "--accent": "#F0B90B",
    "--accent-hover": "#F8D12F",
    "--green": "#02C076",
    "--red": "#F6465D",
    "--purple": "#8B5CF6",
  },
  light: {
    "--bg-primary": "#F8F9FA",
    "--bg-card": "#FFFFFF",
    "--bg-card-hover": "#F0F1F3",
    "--bg-input": "#F0F1F3",
    "--border-default": "#EAECEF",
    "--border-input": "#D1D5DB",
    "--text-primary": "#0B0E11",
    "--text-secondary": "#5E6673",
    "--text-dim": "#848E9C",
    "--accent": "F0B90B",
    "--accent-hover": "#D4A20A",
    "--green": "#0ECB81",
    "--red": "#F6465D",
    "--purple": "#8B5CF6",
  },
  blue: {
    "--bg-primary": "#0A1628",
    "--bg-card": "#111D35",
    "--bg-card-hover": "#1A2744",
    "--bg-input": "#1A2744",
    "--border-default": "#1E3054",
    "--border-input": "#243A5E",
    "--text-primary": "#E8EDF5",
    "--text-secondary": "#7B8FA8",
    "--text-dim": "#4A5F7A",
    "--accent": "#3B82F6",
    "--accent-hover": "#60A5FA",
    "--green": "#34D399",
    "--red": "#F87171",
    "--purple": "#A78BFA",
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("gcrm_theme") as Theme | null;
    if (saved && ["dark", "light", "blue"].includes(saved)) setThemeState(saved);
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    const vars = THEME_VARS[t];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", t);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("gcrm_theme", t);
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export { THEME_VARS };
