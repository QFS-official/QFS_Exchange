"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Sun, Moon, Palette, ChevronDown, Check } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n/LangContext";
import { useTheme, type Theme } from "@/lib/theme/ThemeContext";

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

const THEME_OPTIONS: { id: Theme; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "dark", label: "Oscuro", icon: <Moon className="w-3.5 h-3.5" />, color: "bg-[#0B0E11] border-[#2B3139]" },
  { id: "light", label: "Claro", icon: <Sun className="w-3.5 h-3.5" />, color: "bg-[#F8F9FA] border-[#EAECEF]" },
  { id: "blue", label: "Azul", icon: <Palette className="w-3.5 h-3.5" />, color: "bg-[#0A1628] border-[#1E3054]" },
];

export function LangSelector() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const current = LANG_OPTIONS.find((l) => l.code === lang)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[var(--bg-card-hover)] transition text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="text-[11px] font-medium hidden sm:inline">{current.flag} {current.label}</span>
        <span className="text-[11px] font-medium sm:hidden">{current.flag}</span>
        <ChevronDown className={`w-3 h-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-default)] overflow-hidden z-50">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--bg-card-hover)] transition ${
                lang === l.code ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
              }`}
            >
              <span className="text-sm">{l.flag}</span>
              <span className="font-medium">{l.label}</span>
              {lang === l.code && <Check className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const current = THEME_OPTIONS.find((t) => t.id === theme)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[var(--bg-card-hover)] transition text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {current.icon}
        <span className="text-[11px] font-medium hidden sm:inline">{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-default)] overflow-hidden z-50 p-1.5">
          <div className="flex gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-md transition ${
                  theme === t.id ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]" : "hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border ${t.color} flex items-center justify-center text-[var(--text-primary)]`}>
                  {t.icon}
                </div>
                <span className={`text-[9px] font-medium ${theme === t.id ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
