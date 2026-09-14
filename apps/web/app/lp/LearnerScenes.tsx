import Image from "next/image";
import type { CSSProperties } from "react";

import { LevelPicker, SpeakerRow, Stage, VtuberTile } from "../components/landing/scene";
import { AJL_LEVELS } from "../lib/ajl";

/**
 * 学習者向けLPの3STEPSの挿絵。作り方は /for-vtubers の StepScenes と同じで、
 * 配信カード・ボタン・ライブ画面の部品をそのまま並べてCSSで動かす。
 * ここで見せる操作は、実際の参加フロー（ホームでカードを選ぶ → 参加ページで
 * スピーカー枠を予約する → 入室して話す）に対応している。
 */

const BEGINNER = AJL_LEVELS[1];
const UPPER = AJL_LEVELS[3];

function levelStyle(level: (typeof AJL_LEVELS)[number]) {
  return { "--level-face": level.color, "--level-drop": level.dropColor } as CSSProperties;
}

/** ホームに並ぶ配信カード。挿絵用なので押せない。 */
function SessionCard({
  level,
  title,
  tint,
  className = "",
}: {
  level: (typeof AJL_LEVELS)[number];
  title: string;
  tint: "a" | "b";
  className?: string;
}) {
  return (
    <div className={`aiment-session-card sc-card ${className}`.trim()}>
      <span className="aiment-session-card__media-shell">
        <span className="aiment-session-card__frame" aria-hidden />
        <span className="aiment-session-card__level" style={levelStyle(level)}>
          {level.level}
        </span>
        <span className="aiment-session-card__progress" aria-hidden>
          <span className="aiment-session-card__progress-fill" style={{ "--slot-progress": "60%" } as CSSProperties} />
        </span>
        <span className="aiment-session-card__detail" aria-hidden>
          <span className="aiment-session-card__detail-label">detail</span>
        </span>
        <span className="aiment-session-card__image">
          <span className={`sc-thumb sc-thumb--${tint}`}>
            <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} />
          </span>
        </span>
      </span>
      <span className="aiment-session-card__body">
        <span className="aiment-session-card__avatar" />
        <span>
          <span className="aiment-session-card__title">{title}</span>
          <span className="sc-bar sc-bar--channel" />
        </span>
      </span>
    </div>
  );
}

/** マウスカーソル。SVGの矢印。 */
function Cursor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`sc-cursor ${className}`.trim()} aria-hidden focusable="false">
      <path
        d="M5 3l14 8.5-6.2 1.4-3.3 5.6z"
        fill="#ffffff"
        stroke="var(--brand-text)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   01 Find a session
   ホームのカード一覧。レベル・テーマで選び、1枚をクリックする。
   -------------------------------------------------------------------------- */
export function SceneFind() {
  return (
    <Stage label="Choosing a session on the home page" modifier="find">
      <div className="sc-topbar">
        <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} />
        <span className="sc-bar sc-bar--nav" />
        <span className="sc-chip">Live</span>
      </div>

      <div className="sc-cards">
        <SessionCard level={BEGINNER} title="ゲーム" tint="a" className="sc-pick-58" />
        <SessionCard level={UPPER} title="雑談" tint="b" />
      </div>

      <Cursor className="sc-cursor-26" />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   02 Reserve a speaker slot
   参加ページ。開始時刻・レベル・スピーカー枠を確認して、予約ボタンを押す。
   文言は実際の参加ページのもの。
   -------------------------------------------------------------------------- */
export function SceneReserve() {
  return (
    <Stage label="Reserving a speaker slot on the session page" modifier="reserve">
      <div className="sc-form">
        <div className="sc-form__row">
          <span className="sc-form__label">Starts</span>
          <span className="sc-chip sc-chip--on">20:00</span>
        </div>
        <div className="sc-form__row">
          <span className="sc-form__label">Level</span>
          <LevelPicker pick={BEGINNER.level} />
        </div>
        <div className="sc-form__row">
          <span className="sc-form__label">Speaker spots</span>
          <span className="sc-spots">
            <span className="sc-out-60">3</span>
            <span className="sc-in-60">2</span>
            <span>/5</span>
          </span>
        </div>
        <span className="ui-btn ui-btn-sm ui-btn-primary sc-form__submit sc-press-52">Reserve a speaker slot (free)</span>
        <span className="sc-note sc-in-60">Payment is due within 24h before the stream.</span>
      </div>

      <SessionCard level={BEGINNER} title="ゲーム" tint="a" className="sc-card--aside" />
      <span className="sc-check sc-in-60" aria-hidden>
        ✓
      </span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   03 Say hello and talk
   入室後。自分の行がスピーカー欄に現れ、自己紹介から会話が始まる。
   -------------------------------------------------------------------------- */
export function SceneTalk() {
  return (
    <Stage label="Talking with the VTuber as a speaker" modifier="talk">
      <VtuberTile live />

      <span className="sc-bubble sc-bubble--you sc-win-30-50">はじめまして！</span>
      <span className="sc-bubble sc-bubble--host sc-win-56-66">よろしくね！</span>

      <div className="sc-list">
        <div className="sc-list__head">
          <span>Speakers</span>
          <span className="sc-dots" aria-hidden>
            <span>
              <i />
            </span>
            <span>
              <i />
            </span>
            <span>
              <i className="sc-in-12" />
            </span>
          </span>
        </div>
        <SpeakerRow initial="A" talkClass="sc-win-74-92 sc-rm-on" />
        <SpeakerRow initial="M" />
        <div className="sc-you">
          <span className="sc-you__tag sc-in-12">You</span>
          <SpeakerRow initial="Y" className="sc-in-12" talkClass="sc-win-30-50" />
        </div>
      </div>
    </Stage>
  );
}
