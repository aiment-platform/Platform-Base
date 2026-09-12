import type { CSSProperties } from "react";

import { AJL_LEVELS } from "../../lib/ajl";

/**
 * 「レベル」の横に置く「?」と、押したときに出る日本語レベル（AJL）の一覧。
 *
 * 開閉はブラウザ標準の Popover API（button の popoverTarget と div の popover）
 * に任せているので JS はない。外側を押すか Esc で閉じ、画面の最前面
 * （top layer）に中央表示される。
 *
 * ボタンと一覧は別の部品にしてある。ボタンは文中（<p> の中）に置くが、
 * 一覧は <div> や <ul> を含むので <p> の中には置けない（HTMLの決まりで、
 * 置くとサーバーとブラウザで組み立て結果が食い違う）。一覧は同じ id で
 * つながるので、段落の外のどこに置いてもよい。
 *
 * レベルの定義は ajl.ts のものをそのまま出す（配信作成画面と同じ表記）。
 */
export function LevelHelpButton({ id, lang = "ja" }: { id: string; lang?: "ja" | "en" }) {
  const t = lang === "ja" ? JA : EN;
  return (
    <button type="button" popoverTarget={id} className="landing-help" aria-label={t.open}>
      ?
    </button>
  );
}

export function LevelHelpPanel({ id, lang = "ja" }: { id: string; lang?: "ja" | "en" }) {
  const t = lang === "ja" ? JA : EN;
  return (
    <div id={id} popover="auto" className="landing-help__panel" role="dialog" aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="landing-help__title">
        AJL - aiment Japanese Level
      </p>
      <p className="landing-help__lead">{t.lead}</p>
      <ul className="landing-help__list">
        {AJL_LEVELS.map((level) => (
          <li key={level.level}>
            <span
              className="landing-help__badge"
              style={{ "--level-face": level.color, "--level-drop": level.dropColor } as CSSProperties}
            >
              {level.level}
            </span>
            <span className="landing-help__name">
              AJL {level.level}
              <span className="landing-help__band">
                JF {level.jfStandard} / {level.label}
              </span>
            </span>
            <span className="landing-help__desc">{level.description}</span>
          </li>
        ))}
      </ul>
      <button type="button" popoverTarget={id} popoverTargetAction="hide" className="ui-btn ui-btn-sm ui-btn-ghost landing-help__close">
        {t.close}
      </button>
    </div>
  );
}

const JA = {
  open: "日本語レベルについて",
  lead: "配信枠ごとに表示される目安レベルです。",
  close: "閉じる",
};

const EN = {
  open: "About Japanese levels",
  lead: "The level shown on each session. A1–C2 follows the JF Standard for Japanese-Language Education.",
  close: "Close",
};
