"use client";

import type { CSSProperties } from "react";
import { AJL_LEVELS, getAjlInfo } from "../../lib/ajl";
import { LevelHelpButton, LevelHelpPanel } from "../../components/landing/LevelHelp";
import { useI18n } from "../../lib/i18n";

// 配信枠の作成（Pre-Live）と編集で同じ AJL の選び方にそろえるための部品。
// 以前は編集画面だけ 6 行のリストで、作成画面と見た目も操作も違っていた。
export function AjlLevelPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (level: number) => void;
}) {
  const { locale } = useI18n();
  const lang = locale === "jp" ? "ja" : "en";
  const current = getAjlInfo(value);

  return (
    <div className="grid gap-2 text-sm">
      <span className="flex items-center text-[var(--brand-text-muted)]">
        AJL - aiment Japanese Level
        <LevelHelpButton id={id} lang={lang} />
      </span>
      {/* スマホでは指で押しやすいよう札を少し大きくする（40px ≒ 押せる面の目安 44px に近づける） */}
      <div className="flex flex-wrap gap-3 p-1.5" role="radiogroup" aria-label="AJL">
        {AJL_LEVELS.map((level) => (
          <button
            key={level.level}
            type="button"
            role="radio"
            aria-checked={value === level.level}
            aria-label={`AJL ${level.level} (JF ${level.jfStandard} / ${level.label})`}
            title={`AJL ${level.level} — JF ${level.jfStandard} / ${level.label}`}
            onClick={() => onChange(level.level)}
            className="ui-level-badge [--level-size:40px] md:[--level-size:36px]"
            style={{ "--level-face": level.color, "--level-drop": level.dropColor } as CSSProperties}
          >
            {level.level}
          </button>
        ))}
      </div>
      {/* 札は数字だけなので、選んだレベルの中身を一行で添える */}
      <p className="text-xs text-[var(--brand-text-muted)]">
        <span className="font-semibold text-[var(--brand-text)]">
          AJL {current.level} · JF {current.jfStandard} / {current.label}
        </span>
        {current.description ? ` — ${current.description}` : ""}
      </p>
      <LevelHelpPanel id={id} lang={lang} />
    </div>
  );
}
