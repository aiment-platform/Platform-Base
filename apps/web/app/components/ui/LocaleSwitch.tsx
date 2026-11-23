"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { LOCALES, useI18n } from "../../lib/i18n";

/** 表示言語の切替。4言語は切替（セグメント）に並びきらないので、ボタン＋小さく浮くメニューで出す。 */
export function LocaleSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale, tx } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = LOCALES.find((entry) => entry.id === locale) ?? LOCALES[1];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tx("表示言語", "Display language", { tw: "顯示語言", ko: "표시 언어" })}
        className="ui-btn ui-btn-md ui-btn-ghost h-10 gap-1.5 px-2.5"
      >
        <LanguageIcon className="h-5 w-5" aria-hidden />
        {/* スマホではロゴ・ログインと並ぶので、言語名は出さずアイコンだけにする */}
        <span className="hidden text-sm sm:inline">{current.label}</span>
      </button>

      {open ? (
        <div role="menu" className="ui-float absolute right-0 top-full z-50 mt-2 w-[168px] p-1.5">
          {LOCALES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={entry.id === locale}
              lang={entry.htmlLang}
              onClick={() => {
                setLocale(entry.id);
                setOpen(false);
              }}
              className="ui-menu-item w-full justify-between"
            >
              {entry.label}
              {entry.id === locale ? <CheckIcon className="h-4 w-4" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
