import Image from "next/image";
import { MicrophoneIcon } from "@heroicons/react/24/outline";
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

/** ライブ画面の参加者欄の1行。本物と同じ構造（頭文字・名前・レベルバー）。 */
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

export type Mic = "on" | "off" | "switch";
export type RosterRole = "learner" | "supporter" | "you";
export type RosterRow = { initial: string; role: RosterRole; at?: string; talk?: string; mic?: Mic };

/** 札の文言。ページの言語に合わせて渡す（既定は日本語のメイトページ用）。 */
const ROLE_LABELS: Record<RosterRole, string> = { learner: "ラーナー", supporter: "メイト", you: "You" };

export function MicBadge({ mic }: { mic: Mic }) {
  if (mic === "switch") {
    return (
      <>
        <span className="sc-mic sc-mic--off sc-out-40" aria-hidden>
          <MicrophoneIcon />
        </span>
        <span className="sc-mic sc-mic--on sc-in-40" aria-hidden>
          <MicrophoneIcon />
        </span>
      </>
    );
  }
  return (
    <span className={`sc-mic sc-mic--${mic}`} aria-hidden>
      <MicrophoneIcon />
    </span>
  );
}

/** 参加者の一覧。役割の札と、マイクの状態。 */
export function Roster({
  title,
  rows,
  dotsAt,
  className = "",
  labels,
}: {
  title: string;
  rows: RosterRow[];
  dotsAt?: string[];
  className?: string;
  labels?: Partial<Record<RosterRole, string>>;
}) {
  const names = { ...ROLE_LABELS, ...labels };
  return (
    <div className={`sc-list ${className}`.trim()}>
      <div className="sc-list__head">
        <span>{title}</span>
        <span className="sc-dots" aria-hidden>
          {rows.map((row, index) => (
            <span key={row.initial}>
              <i className={dotsAt?.[index]} />
            </span>
          ))}
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.initial} className={`sc-you sc-you--${row.role} ${row.mic ? "has-mic" : ""}`.trim()}>
          <span className={`sc-you__tag ${row.at ?? ""}`.trim()}>{names[row.role]}</span>
          <SpeakerRow initial={row.initial} className={row.at} talkClass={row.talk} />
          {row.mic ? <MicBadge mic={row.mic} /> : null}
        </div>
      ))}
    </div>
  );
}

export type ChatMessage = { who: string; role: "sup" | "lrn"; text: string; at?: string };

export function Chat({ messages, className = "", title = "チャット" }: { messages: ChatMessage[]; className?: string; title?: string }) {
  return (
    <div className={`sc-schat ${className}`.trim()}>
      <div className="sc-schat__head">
        <span>{title}</span>
      </div>
      <ul className="sc-schat__list">
        {messages.map((message) => (
          <li key={message.text} className={`sc-schat__msg sc-schat__msg--${message.role} ${message.at ?? ""}`.trim()}>
            <span className="sc-schat__who">{message.who}</span>
            <span className="sc-schat__text">{message.text}</span>
          </li>
        ))}
      </ul>
      <div className="sc-schat__foot" aria-hidden>
        <span className="sc-schat__input">
          <span className="sc-bar" />
        </span>
      </div>
    </div>
  );
}
