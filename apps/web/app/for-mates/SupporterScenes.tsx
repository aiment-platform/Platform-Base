import { MicrophoneIcon } from "@heroicons/react/24/outline";

import { SpeakerRow, Stage, VtuberTile } from "../components/landing/scene";

/**
 * メイトページの挿絵。/for-vtubers, /lp と同じく、本物の部品
 * （配信の枠・スピーカー行）を並べてCSSで動かす。
 * 6秒ループ。sc-in-NN は「NN%の時点で現れる」、sc-win-A-B は「A〜B%だけ見える」。
 *
 * マイクの札（.sc-mic）で「話せる／聞くだけ」を見せる。後半から合流の場面では
 * 40% の時点で OFF → ON に切り替わる。
 */

type Mic = "on" | "off" | "switch";
type Row = { initial: string; role: "learner" | "supporter"; at?: string; talk?: string; mic?: Mic };

function MicBadge({ mic }: { mic: Mic }) {
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

/** 参加者の一覧。Learner / メイト の札と、マイクの状態。 */
function Roster({ title, rows, dotsAt, className = "" }: { title: string; rows: Row[]; dotsAt?: string[]; className?: string }) {
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
          <span className={`sc-you__tag ${row.at ?? ""}`.trim()}>{row.role === "learner" ? "学習者" : "メイト"}</span>
          <SpeakerRow initial={row.initial} className={row.at} talkClass={row.talk} />
          {row.mic ? <MicBadge mic={row.mic} /> : null}
        </div>
      ))}
    </div>
  );
}

function Chat({ messages, className = "" }: { messages: { who: string; role: "sup" | "lrn"; text: string; at?: string }[]; className?: string }) {
  return (
    <div className={`sc-schat ${className}`.trim()}>
      <div className="sc-schat__head">
        <span>チャット</span>
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

/* --------------------------------------------------------------------------
   Hero：本編中。Learnerが話し、メイトはコメントで参加している。
   -------------------------------------------------------------------------- */
export function SceneHero() {
  return (
    <Stage label="セッション中の画面。VTuberとLearnerが話し、メイトはコメントで参加している" modifier="hero">
      <VtuberTile live />
      <span className="sc-bubble sc-bubble--host sc-hero__host sc-win-30-50">右！右！</span>
      <Roster
        className="sc-hero__roster"
        title="参加者"
        rows={[
          { initial: "A", role: "learner", talk: "sc-win-4-30", mic: "on" },
          { initial: "M", role: "learner", talk: "sc-win-56-76 sc-rm-on", mic: "on" },
          { initial: "S", role: "supporter", mic: "off" },
          { initial: "K", role: "supporter", mic: "off" },
        ]}
      />
      <Chat
        messages={[
          { who: "S", role: "sup", text: "ナイス！", at: "sc-in-8" },
          { who: "A", role: "lrn", text: "むずかしい…！", at: "sc-in-26" },
          { who: "K", role: "sup", text: "そこ右かも", at: "sc-in-40" },
          { who: "S", role: "sup", text: "マイク少し二重かも", at: "sc-in-60" },
        ]}
      />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   開始5分前：VTuberとメイトが先に集まる。全員マイクON。
   -------------------------------------------------------------------------- */
export function SceneGather() {
  return (
    <Stage label="開始5分前。VTuberとメイトが先に集まっている" modifier="gather">
      <VtuberTile />
      <span className="sc-chip sc-tilechip">17:55</span>
      <span className="sc-bubble sc-bubble--host sc-gather__b1 sc-win-4-30">今日はよろしく〜</span>
      <span className="sc-bubble sc-gather__b2 sc-win-33-60">マイク大丈夫そう？</span>
      <span className="sc-bubble sc-gather__b3 sc-win-63-92 sc-rm-on">聞こえてます！</span>
      <Roster
        title="メイト"
        rows={[
          { initial: "S", role: "supporter", talk: "sc-win-33-60", mic: "on" },
          { initial: "K", role: "supporter", talk: "sc-win-63-92 sc-rm-on", mic: "on" },
          { initial: "R", role: "supporter", mic: "on" },
        ]}
      />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   本編スタート：Learnerが入ってくる。メイトはコメント側へ（マイクOFF）。
   -------------------------------------------------------------------------- */
export function SceneStart() {
  return (
    <Stage label="本編スタート。Learnerが入室し、メイトはコメントで参加" modifier="start">
      <VtuberTile live />
      <span className="sc-chip sc-tilechip">18:00</span>
      <Roster
        title="参加者"
        rows={[
          { initial: "A", role: "learner", at: "sc-in-12", mic: "on" },
          { initial: "M", role: "learner", at: "sc-in-26", mic: "on" },
          { initial: "L", role: "learner", at: "sc-in-40", mic: "on" },
          { initial: "S", role: "supporter", mic: "off" },
          { initial: "K", role: "supporter", mic: "off" },
          { initial: "R", role: "supporter", mic: "off" },
        ]}
        dotsAt={["sc-in-12", "sc-in-26", "sc-in-40", "", "", ""]}
      />
      <span className="sc-bubble sc-bubble--host sc-start__hello sc-win-56-76 sc-rm-on">みんなよろしく！</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   Learner中心：コメントしながら見る。気づいたら知らせる。
   -------------------------------------------------------------------------- */
export function SceneWatch() {
  return (
    <Stage label="Learner中心の時間。メイトはコメントしながら見ている" modifier="watch">
      <VtuberTile live />
      <span className="sc-chip sc-tilechip">18:00〜18:40</span>
      <span className="sc-bubble sc-bubble--host sc-watch__reply sc-win-74-92 sc-rm-on">Aさん、招待送ったよ</span>
      <Roster
        className="sc-watch__roster"
        title="参加者"
        rows={[
          { initial: "A", role: "learner", talk: "sc-win-4-30", mic: "on" },
          { initial: "S", role: "supporter", mic: "off" },
        ]}
      />
      <Chat
        messages={[
          { who: "K", role: "sup", text: "このステージ難しいよね", at: "sc-in-8" },
          { who: "A", role: "lrn", text: "入れない…", at: "sc-in-30" },
          { who: "S", role: "sup", text: "Aさん、招待から入れるかも", at: "sc-in-48" },
        ]}
      />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   後半から合流：後半、メイトのマイクがONになり、みんなで話す。
   -------------------------------------------------------------------------- */
export function SceneNativeMix() {
  return (
    <Stage label="後半から合流。メイトのマイクがONになり、全員で話している" modifier="mix">
      <VtuberTile live />
      <span className="sc-chip sc-tilechip sc-out-40">18:40</span>
      <span className="sc-chip sc-tilechip sc-tilechip--mix sc-in-40">後半から合流</span>
      <span className="sc-bubble sc-bubble--host sc-mix__b1 sc-win-4-30">ここからみんなで！</span>
      <span className="sc-bubble sc-mix__b2 sc-win-56-76">そっち敵いるよ</span>
      <span className="sc-bubble sc-mix__b3 sc-win-74-92 sc-rm-on">Nice!!</span>
      <Roster
        title="参加者"
        rows={[
          { initial: "A", role: "learner", talk: "sc-win-74-92 sc-rm-on", mic: "on" },
          { initial: "M", role: "learner", mic: "on" },
          { initial: "S", role: "supporter", talk: "sc-win-56-76", mic: "switch" },
          { initial: "K", role: "supporter", mic: "switch" },
        ]}
      />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   終了：全員で終わる。
   -------------------------------------------------------------------------- */
export function SceneEnd() {
  return (
    <Stage label="セッション終了" modifier="end">
      <VtuberTile />
      <span className="sc-chip sc-tilechip">19:00</span>
      <span className="sc-bubble sc-bubble--host sc-end__b1 sc-in-8">今日はありがとう！</span>
      <span className="sc-bubble sc-end__b2 sc-in-30">またね〜</span>
      <span className="sc-bubble sc-end__b3 sc-in-52">Thank you!!</span>
      <span className="sc-bubble sc-end__b4 sc-in-68">おつかれさま！</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   バックアップ：気づいたら、少し知らせる。
   -------------------------------------------------------------------------- */
export function SceneBackup() {
  return (
    <Stage label="気づいたことをコメントで知らせている" modifier="backup">
      <VtuberTile live />
      <span className="sc-bubble sc-bubble--host sc-backup__reply sc-win-56-76 sc-rm-on">ほんとだ、直した！</span>
      <Roster
        className="sc-backup__roster"
        title="参加者"
        rows={[
          { initial: "A", role: "learner", mic: "on" },
          { initial: "S", role: "supporter", mic: "off" },
        ]}
      />
      <Chat
        messages={[
          { who: "S", role: "sup", text: "マイク聞こえてないかも", at: "sc-in-12" },
          { who: "K", role: "sup", text: "ゲーム音ちょっと大きめ？", at: "sc-in-36" },
        ]}
      />
    </Stage>
  );
}
