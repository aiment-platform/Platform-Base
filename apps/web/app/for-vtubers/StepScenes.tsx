import Image from "next/image";
import { ChatBubbleLeftRightIcon, MicrophoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

import { LevelPicker, SPEAKERS, SpeakerRow, Stage, VtuberTile } from "../components/landing/scene";
import { AJL_LEVELS } from "../lib/ajl";

/**
 * 3STEPSの挿絵。絵を描いたのではなく、ページで実際に使っている部品
 * （配信カード・ボタン・チップ・レベルバッジ・ロゴ）をそのまま並べて、
 * CSSのキーフレームで動かしている。部品の設計が変われば挿絵も追従する。
 *
 * 動きはJSなし。1シーン6秒のループで、時系列は「何%の時点で出るか」を
 * クラス名で指定する（sc-in-22 なら 22%＝約1.3秒で現れる）。
 * 見出しの動きを苦手とする設定（prefers-reduced-motion）では止めて、
 * 最後のコマだけを見せる。
 *
 * 大きさは cqw（親の幅に対する%）で決めているので、右カラムでも
 * スマホでも同じ構図のまま縮む。
 */

const LEVEL = AJL_LEVELS[2];

/* --------------------------------------------------------------------------
   01 枠を作る
   レベルは 1〜6 が流れて来て 3 で止まる。以後、テーマ → 日時 を選ぶたびに
   右のカードに同じものが乗り、最後に「作成して開始」を押すとカードが完成する。
   -------------------------------------------------------------------------- */
export function SceneCreate() {
  return (
    <Stage label="枠を作る手順のアニメーション" modifier="create">
      <div className="sc-form">
        <div className="sc-form__row">
          <span className="sc-form__label">レベル</span>
          <LevelPicker pick={LEVEL.level} />
        </div>
        <div className="sc-form__row">
          <span className="sc-form__label">テーマ</span>
          <span className="sc-chip sc-chip--on sc-in-36">ゲーム</span>
        </div>
        <div className="sc-form__row">
          <span className="sc-form__label">日時</span>
          <span className="sc-chip sc-chip--on sc-in-48">20:00</span>
        </div>
        <span className="ui-btn ui-btn-sm ui-btn-primary sc-form__submit sc-press-70">作成して開始</span>
      </div>

      {/* 本物の配信カード。ホームで使っているものと同じクラス。 */}
      <div className="aiment-session-card sc-card sc-pop-74">
        <span className="aiment-session-card__media-shell">
          <span className="aiment-session-card__frame" aria-hidden />
          <span
            className="aiment-session-card__level sc-in-28"
            style={{ "--level-face": LEVEL.color, "--level-drop": LEVEL.dropColor } as React.CSSProperties}
          >
            {LEVEL.level}
          </span>
          <span className="aiment-session-card__progress" aria-hidden>
            <span className="aiment-session-card__progress-fill" />
          </span>
          <span className="aiment-session-card__image">
            <span className="sc-thumb sc-slide-60">
              <Image src="/logo/aiment_logo.svg" alt="" width={200} height={200} />
            </span>
            <span className="aiment-session-card__time sc-in-54">20:00</span>
          </span>
        </span>
        <span className="aiment-session-card__body">
          <span className="aiment-session-card__avatar" />
          <span>
            <span className="aiment-session-card__title sc-in-40">ゲーム</span>
            <span className="sc-bar sc-bar--channel" />
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
  const inAt = ["sc-in-12", "sc-in-26", "sc-in-40", "sc-in-54", "sc-in-68"];
  const talkAt = ["sc-win-30-50", "", "sc-win-56-66", "", "sc-win-74-92 sc-rm-on"];
  return (
    <Stage label="スピーカーを迎える手順のアニメーション" modifier="welcome">
      <VtuberTile />

      <span className="sc-bubble sc-win-30-50">はじめまして！</span>

      <div className="sc-list">
        <div className="sc-list__head">
          <span>スピーカー</span>
          <span className="sc-dots" aria-hidden>
            {inAt.map((cls) => (
              <span key={cls}>
                <i className={cls} />
              </span>
            ))}
          </span>
        </div>
        {SPEAKERS.map((initial, index) => (
          <div key={initial} className="sc-slot">
            <span className="sc-slot__empty" aria-hidden />
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

      <span className="sc-chat sc-float-8">ナイス！</span>
      <span className="sc-chat sc-float-36">www</span>
      <span className="sc-chat sc-float-62 sc-rm-on">がんばれ〜</span>

      {/* 本物の操作チップ。ライブ画面のマイク／カメラ／チャットと同じクラス。 */}
      <div className="sc-controls" aria-hidden>
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

      <div className="sc-list">
        <div className="sc-list__head">
          <span>スピーカー</span>
          <span className="sc-dots" aria-hidden>
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
        <SpeakerRow initial="A" talkClass="sc-win-4-30" />
        <SpeakerRow initial="M" talkClass="sc-win-33-60" />
        <SpeakerRow initial="L" talkClass="sc-win-63-92 sc-rm-on" />
      </div>
    </Stage>
  );
}
