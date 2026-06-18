"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useI18n } from "../../lib/i18n";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "aiment-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const { tx } = useI18n();
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? MoonIcon : SunIcon;

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-text)]"
      aria-label={tx("テーマを切り替え", "Toggle theme")}
      title={tx("テーマを切り替え", "Toggle theme")}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
