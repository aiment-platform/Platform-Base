import Image from "next/image";
import { ChatBubbleLeftRightIcon, MicrophoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

import { AJL_LEVELS } from "../lib/ajl";

/**
 * 3STEPSの挿絵。絵を描いたのではなく、ページで実際に使っている部品
 * （配信カード・ボタン・チップ・レベルバッジ・ロゴ）をそのまま並べて、
 * CSSのキーフレームで動かしている。部品の設計が変われば挿絵も追従する。
 *
 * 動きはJSなし。1シーン6秒のループで、時系列は「何%の時点で出るか」を
 * クラス名で指定する（fv-in-22 なら 22%＝約1.3秒で現れる）。
 * 見出しの動きを苦手とする設定（prefers-reduced-motion）では止めて、
 * 最後のコマだけを見せる。
 *
 * 大きさは cqw（親の幅に対する%）で決めているので、右カラムでも
 * スマホでも同じ構図のまま縮む。
 */

const LEVEL = AJL_LEVELS[2];

/* --------------------------------------------------------------------------
   共通の小物
   -------------------------------------------------------------------------- */

function Stage({ label, modifier, children }: { label: string; modifier: string; children: React.ReactNode }) {
  return (
    <div className={`fv-scene fv-scene--${modifier}`} role="img" aria-label={label}>
      {children}
    </div>
  );
}

/** 配信のメインの枠。VTuberの姿の代わりにブランドの猫を置く。 */
function VtuberTile({ live = false, className = "" }: { live?: boolean; className?: string }) {
  return (
    <div className={`fv-tile ${className}`.trim()}>
      <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} className="fv-tile__mark" />
      {live ? (
        <span className="fv-live">
          <i />
          LIVE
        </span>
      ) : (
        <span className="fv-chip fv-tile__tag">VTuber</span>
      )}
    </div>
  );
}

const SPEAKERS = ["A", "M", "L", "K", "S"];

/** ライブ画面のスピーカー欄の1行。本物と同じ構造（頭文字・名前・レベルバー）。 */
function SpeakerRow({
  initial,
  className = "",
  talkClass = "",
}: {
  initial: string;
  className?: string;
  talkClass?: string;
}) {
  return (
    <div className={`fv-row ${className}`.trim()}>
      <span className="fv-row__avatar">{initial}</span>
      <span className="fv-row__meta">
        <span className="fv-row__name" />
        <span className="fv-row__level">
          <i className={talkClass} />
        </span>
      </span>
      <span className={`fv-talk ${talkClass}`.trim()} aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   01 枠を作る
   レベル → テーマ → 日時 を選ぶたびに、右のカードに同じものが乗っていく。
   最後に「作成して開始」を押すとカードが完成する。
   -------------------------------------------------------------------------- */
export function SceneCreate() {
  return (
    <Stage label="枠を作る手順のアニメーション" modifier="create">
      <div className="fv-form">
        <div className="fv-form__row">
          <span className="fv-form__label">レベル</span>
          <span
            className="fv-level fv-in-8"
            style={{ "--level-face": LEVEL.color, "--level-drop": LEVEL.dropColor } as React.CSSProperties}
          >
            {LEVEL.level}
          </span>
        </div>
        <div className="fv-form__row">
          <span className="fv-form__label">テーマ</span>
          <span className="fv-chip fv-chip--on fv-in-22">ゲーム</span>
        </div>
        <div className="fv-form__row">
          <span className="fv-form__label">日時</span>
          <span className="fv-chip fv-chip--on fv-in-36">20:00</span>
        </div>
        <span className="ui-btn ui-btn-sm ui-btn-primary fv-form__submit fv-press-62">作成して開始</span>
      </div>

      {/* 本物の配信カード。ホームで使っているものと同じクラス。 */}
      <div className="aiment-session-card fv-card fv-pop-66">
        <span className="aiment-session-card__media-shell">
          <span className="aiment-session-card__frame" aria-hidden />
          <span
            className="aiment-session-card__level fv-in-12"
            style={{ "--level-face": LEVEL.color, "--level-drop": LEVEL.dropColor } as React.CSSProperties}
          >
            {LEVEL.level}
          </span>
          <span className="aiment-session-card__progress" aria-hidden>
            <span className="aiment-session-card__progress-fill" />
          </span>
          <span className="aiment-session-card__image">
            <span className="fv-thumb fv-slide-48">
              <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} />
            </span>
            <span className="aiment-session-card__time fv-in-40">20:00</span>
          </span>
        </span>
        <span className="aiment-session-card__body">
          <span className="aiment-session-card__avatar" />
          <span>
            <span className="aiment-session-card__title fv-in-26">ゲーム</span>
            <span className="fv-bar fv-bar--channel" />
          </span>
        </span>
      </div>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   02 スピーカーを迎える
   空の5枠に1人ずつ入ってくる。最初の人が「はじめまして！」と話し、
   マイクの波が立つ。
   -------------------------------------------------------------------------- */
export function SceneWelcome() {
  const inAt = ["fv-in-12", "fv-in-26", "fv-in-40", "fv-in-54", "fv-in-68"];
  const talkAt = ["fv-win-30-50", "", "fv-win-56-66", "", "fv-win-74-92 fv-rm-on"];
  return (
    <Stage label="スピーカーを迎える手順のアニメーション" modifier="welcome">
      <VtuberTile />

      <span className="fv-bubble fv-win-30-50">はじめまして！</span>

      <div className="fv-list">
        <div className="fv-list__head">
          <span>スピーカー</span>
          <span className="fv-dots" aria-hidden>
            {inAt.map((cls) => (
              <span key={cls}>
                <i className={cls} />
              </span>
            ))}
          </span>
        </div>
        {SPEAKERS.map((initial, index) => (
          <div key={initial} className="fv-slot">
            <span className="fv-slot__empty" aria-hidden />
            <SpeakerRow initial={initial} className={inAt[index]} talkClass={talkAt[index]} />
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   03 あとは、いつもの配信
   LIVE中。スピーカーの発話が順に回り、チャットが流れる。
   -------------------------------------------------------------------------- */
export function SceneLive() {
  return (
    <Stage label="配信中の様子のアニメーション" modifier="live">
      <VtuberTile live />

      <span className="fv-chat fv-float-8">ナイス！</span>
      <span className="fv-chat fv-float-36">www</span>
      <span className="fv-chat fv-float-62 fv-rm-on">がんばれ〜</span>

      {/* 本物の操作チップ。ライブ画面のマイク／カメラ／チャットと同じクラス。 */}
      <div className="fv-controls" aria-hidden>
        <span className="ui-ctl ui-ctl-sm ui-ctl-icon ui-ctl-primary">
          <MicrophoneIcon />
        </span>
        <span className="ui-ctl ui-ctl-sm ui-ctl-icon ui-ctl-primary">
          <VideoCameraIcon />
        </span>
        <span className="ui-ctl ui-ctl-sm ui-ctl-icon ui-ctl-neutral">
          <ChatBubbleLeftRightIcon />
        </span>
      </div>

      <div className="fv-list">
        <div className="fv-list__head">
          <span>スピーカー</span>
          <span className="fv-dots" aria-hidden>
            <span>
              <i />
            </span>
            <span>
              <i />
            </span>
            <span>
              <i />
            </span>
          </span>
        </div>
        <SpeakerRow initial="A" talkClass="fv-win-4-30" />
        <SpeakerRow initial="M" talkClass="fv-win-33-60" />
        <SpeakerRow initial="L" talkClass="fv-win-63-92 fv-rm-on" />
      </div>
    </Stage>
  );
}
