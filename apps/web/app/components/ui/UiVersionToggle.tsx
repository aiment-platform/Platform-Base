"use client";

import { setUiVersion, useUiVersion, type UiVersion } from "../../lib/uiVersion";

const OPTIONS: { value: UiVersion; label: string }[] = [
  { value: "0.31", label: "今の UI" },
  { value: "0.4", label: "0.4 試作" },
];

/**
 * 画面の右下に出す、UI バージョンの切り替え。開発中だけ表示する（layout.tsx で制御）。
 * どの画面でも、今の見た目と試作をその場で見比べられる。
 */
export function UiVersionToggle() {
  const version = useUiVersion();
  return (
    <div className="ui-segment ui-float fixed bottom-20 right-4 z-[90] md:bottom-4" role="group" aria-label="UI バージョン（開発用）">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setUiVersion(option.value)}
          aria-pressed={version === option.value}
          className="ui-segment__option px-3 text-xs"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
