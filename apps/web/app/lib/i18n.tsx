"use client";

/**
 * 表示言語。画面の文は tx("日本語", "English", { tw: "繁體中文", ko: "한국어" }) の形で書く。
 *
 *   jp / en … いつも両方書く
 *   tw / ko … 3つ目の引数で任意に足す。書いていない文は英語で出す
 *            （訳が追いついていない画面も、壊れずに英語で読める）
 *
 * 選んだ言語はこのブラウザに保存する。保存がない最初の訪問では、ブラウザの言語が
 * 繁体字・韓国語のときだけそれを選ぶ（ほかは今までどおり英語）。
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const LOCALES = [
  { id: "jp", label: "日本語", htmlLang: "ja", intl: "ja-JP" },
  { id: "en", label: "English", htmlLang: "en", intl: "en-US" },
  { id: "tw", label: "繁體中文", htmlLang: "zh-TW", intl: "zh-TW" },
  { id: "ko", label: "한국어", htmlLang: "ko", intl: "ko-KR" },
] as const;

export type Locale = (typeof LOCALES)[number]["id"];

/** jp / en 以外の訳。足りない言語は英語で出す */
export type TxMore = Partial<Record<Exclude<Locale, "jp" | "en">, string>>;

export type Translate = (jp: string, en: string, more?: TxMore) => string;

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  tx: Translate;
  /** Intl.DateTimeFormat などに渡す言語（"ja-JP" など） */
  intlLocale: string;
};

const STORAGE_KEY = "aiment.locale.v1";

const I18nContext = createContext<I18nContextValue | null>(null);

function localeInfo(locale: Locale) {
  return LOCALES.find((entry) => entry.id === locale) ?? LOCALES[1];
}

function isLocale(value: string | null): value is Locale {
  return LOCALES.some((entry) => entry.id === value);
}

/** ブラウザの言語から、新しく足した言語（繁体字・韓国語）だけを拾う */
function detectFromBrowser(): Locale | null {
  for (const raw of window.navigator.languages ?? [window.navigator.language]) {
    const tag = raw.toLowerCase();
    if (tag.startsWith("ko")) return "ko";
    // 台湾・香港の中国語と、繁体字の指定（zh-Hant）。簡体字（zh-CN など）は拾わない
    if (tag === "zh-tw" || tag === "zh-hk" || tag === "zh-mo" || tag.startsWith("zh-hant")) return "tw";
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial = isLocale(saved) ? saved : detectFromBrowser();
    if (initial) {
      const timer = window.setTimeout(() => {
        setLocaleState(initial);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeInfo(locale).htmlLang;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = localeInfo(next).htmlLang;
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      tx: (jp, en, more) => {
        if (locale === "jp") return jp;
        if (locale === "en") return en;
        return more?.[locale] ?? en;
      },
      intlLocale: localeInfo(locale).intl,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
}
