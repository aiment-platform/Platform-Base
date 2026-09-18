import { LockClosedIcon, MicrophoneIcon } from "@heroicons/react/24/outline";

import { SpeakerRow, Stage, VtuberTile } from "../components/landing/scene";

/**
 * Supporterページの挿絵。/for-vtubers, /lp と同じく、本物の部品
 * （配信の枠・スピーカー行・操作チップ）を並べてCSSで動かす。
 */

const SUPPORTERS = ["S", "K", "R", "M"];

/* --------------------------------------------------------------------------
   Supporter Lounge（セッション前）
   VTuberとSupporterだけの作戦会議。話題の吹き出しが順に出て、
   Supporter同士が交互に話す。
   -------------------------------------------------------------------------- */
export function SceneLounge() {
  const talkAt = ["sc-win-4-30", "sc-win-33-60", "", "sc-win-63-92 sc-rm-on"];
  return (
    <Stage label="セッション前のSupporter Loungeの様子" modifier="lounge">
      <VtuberTile />
      <span className="sc-chip sc-tilechip">開始前 · Lounge</span>

      <span className="sc-bubble sc-lounge__topic sc-in-12">今日は協力ゲームでいこう</span>
      <span className="sc-bubble sc-lounge__topic sc-lounge__topic--2 sc-in-40">人数足りなかったら入るね</span>

      <div className="sc-list">
        <div className="sc-list__head">
          <span>Supporter</span>
          <span className="sc-dots" aria-hidden>
            {SUPPORTERS.map((initial) => (
              <span key={initial}>
                <i />
              </span>
            ))}
          </span>
        </div>
        {SUPPORTERS.map((initial, index) => (
          <SpeakerRow key={initial} initial={initial} talkClass={talkAt[index]} />
        ))}
      </div>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   Supporter Chat（セッション中）
   左は本番のセッション（海外のファンが話している）。右はSupporterだけの
   チャット。普通のチャットと同じで、コメントは書いたらそのまま流れる。
   VTuberが1つ拾って返す。マイクは基本ミュート。
   -------------------------------------------------------------------------- */
const MESSAGES = [
  { who: "K", text: "今のプレイうますぎる", at: "sc-in-12" },
  { who: "S", text: "Aさん、まだ入れてなさそう", at: "sc-in-36" },
  { who: "R", text: "次このゲームもやってほしい！", at: "sc-in-60" },
];

export function SceneChat() {
  return (
    <Stage label="セッション中のSupporter Chatの様子" modifier="chat">
      <VtuberTile live />
      <span className="sc-bubble sc-bubble--host sc-chat__reply sc-win-30-50">Aさん待ってるよ〜</span>
      <div className="sc-chat-main">
        <SpeakerRow initial="A" talkClass="sc-win-63-92 sc-rm-on" />
        <span className="sc-chat-main__tag">Learner</span>
      </div>

      <div className="sc-schat">
        <div className="sc-schat__head">
          <span>Supporter Chat</span>
          <span className="sc-schat__lock">
            <LockClosedIcon aria-hidden />
            VTuberのみ
          </span>
        </div>
        <ul className="sc-schat__list">
          {MESSAGES.map((message) => (
            <li key={message.text} className={`sc-schat__msg ${message.at}`}>
              <span className="sc-schat__who">{message.who}</span>
              <span className="sc-schat__text">{message.text}</span>
            </li>
          ))}
        </ul>
        <div className="sc-schat__foot" aria-hidden>
          <span className="sc-schat__input">
            <span className="sc-bar" />
          </span>
          <span className="ui-ctl ui-ctl-sm ui-ctl-icon ui-ctl-neutral">
            <MicrophoneIcon />
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   ゲーム・企画に参加
   人数がいる企画で、VTuberに呼ばれてSupporterがプレイヤーとして入る。
   -------------------------------------------------------------------------- */
export function SceneGame() {
  return (
    <Stage label="Supporterがゲームに参加する様子" modifier="game">
      <VtuberTile live />
      <span className="sc-chip sc-tilechip">チーム戦 3 vs 3</span>
      <span className="sc-bubble sc-bubble--host sc-game__call sc-win-30-50">Sさんも入って！</span>

      <div className="sc-list">
        <div className="sc-list__head">
          <span>プレイヤー</span>
          <span className="sc-dots" aria-hidden>
            <span>
              <i />
            </span>
            <span>
              <i />
            </span>
            <span>
              <i className="sc-in-54" />
            </span>
          </span>
        </div>
        <SpeakerRow initial="A" talkClass="sc-win-4-30" />
        <SpeakerRow initial="M" />
        <div className="sc-you">
          <span className="sc-you__tag sc-in-54">Supporter</span>
          <SpeakerRow initial="S" className="sc-in-54" talkClass="sc-win-63-92 sc-rm-on" />
        </div>
      </div>
    </Stage>
  );
}
