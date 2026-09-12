import Image from "next/image";
import type { CSSProperties } from "react";

import { AJL_LEVELS } from "../../lib/ajl";

/**
 * 挿絵シーン（StepScenes / LearnerScenes）で共用する小物。
 * 見た目は globals.css の .sc-* にある。
 */

/* --------------------------------------------------------------------------
   共通の小物
   -------------------------------------------------------------------------- */

export function Stage({ label, modifier, children }: { label: string; modifier: string; children: React.ReactNode }) {
  return (
    <div className={`sc-scene sc-scene--${modifier}`} role="img" aria-label={label}>
      {children}
    </div>
  );
}

/** 配信のメインの枠。VTuberの姿の代わりにブランドの猫を置く。 */
export function VtuberTile({ live = false, className = "" }: { live?: boolean; className?: string }) {
  return (
    <div className={`sc-tile ${className}`.trim()}>
      <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} className="sc-tile__mark" />
      {live ? (
        <span className="sc-live">
          <i />
          LIVE
        </span>
      ) : (
        <span className="sc-chip sc-tile__tag">VTuber</span>
      )}
    </div>
  );
}

export const SPEAKERS = ["A", "M", "L", "K", "S"];

/** ライブ画面のスピーカー欄の1行。本物と同じ構造（頭文字・名前・レベルバー）。 */
export function SpeakerRow({
  initial,
  className = "",
  talkClass = "",
}: {
  initial: string;
  className?: string;
  talkClass?: string;
}) {
  return (
    <div className={`sc-row ${className}`.trim()}>
      <span className="sc-row__avatar">{initial}</span>
      <span className="sc-row__meta">
        <span className="sc-row__name" />
        <span className="sc-row__level">
          <i className={talkClass} />
        </span>
      </span>
      <span className={`sc-talk ${talkClass}`.trim()} aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/**
 * レベルを 1〜6 から選ぶ動き。同じ場所で 1→2→…→6 がポンポンと切り替わり
 * （横には動かない）、少し間を置いて選んだ番号が弾んで現れ、そのまま残る。
 * 7つのバッジを同じマスに重ねて、見せる時間だけをずらしている。
 */
export function LevelPicker({ pick }: { pick: number }) {
  const chosen = AJL_LEVELS.find((level) => level.level === pick) ?? AJL_LEVELS[2];
  return (
    <span className="sc-picker">
      {AJL_LEVELS.map((level, index) => (
        <span
          key={level.level}
          className="sc-level sc-tick"
          style={{ "--i": index, "--level-face": level.color, "--level-drop": level.dropColor } as CSSProperties}
        >
          {level.level}
        </span>
      ))}
      <span
        className="sc-level sc-pickin"
        style={{ "--level-face": chosen.color, "--level-drop": chosen.dropColor } as CSSProperties}
      >
        {chosen.level}
      </span>
    </span>
  );
}
