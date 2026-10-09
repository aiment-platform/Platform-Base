"use client";

import { useI18n, type Locale } from "../../lib/i18n";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "jp", label: "JP" },
  { value: "en", label: "EN" },
];

/** 表示言語の切替。ver0.3のセグメント切替（溝＋厚みのあるつまみ）で出す。 */
export function LocaleSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale, tx } = useI18n();

  return (
    <div className={`ui-segment ${className}`.trim()} role="group" aria-label={tx("表示言語", "Display language")}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          aria-pressed={locale === option.value}
          className="ui-segment__option"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
