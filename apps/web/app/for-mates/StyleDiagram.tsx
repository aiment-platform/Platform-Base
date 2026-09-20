import { MicrophoneIcon } from "@heroicons/react/24/outline";

import type { SupporterStyle } from "./slots";

/**
 * 参加スタイルの図。60分を1本の帯にして、メイトのマイクが開く時間を紫で塗る。
 *   後半から合流   … 後半だけ
 *   最初から合流   … 最初から最後まで
 *   呼ばれたら合流 … 呼ばれたところだけ、点で
 */
export function StyleDiagram({ style }: { style: SupporterStyle }) {
  return (
    <div className={`sp-style-bar sp-style-bar--${style}`} aria-hidden>
      <div className="sp-style-bar__track">
        {style === "native-mix" ? (
          <>
            <span className="sp-style-bar__seg is-listen" style={{ flex: 2 }}>
              学習者中心
            </span>
            <span className="sp-style-bar__seg is-open" style={{ flex: 1 }}>
              <MicrophoneIcon />
              みんなで
            </span>
          </>
        ) : null}
        {style === "open-mix" ? (
          <span className="sp-style-bar__seg is-open" style={{ flex: 1 }}>
            <MicrophoneIcon />
            みんなで
          </span>
        ) : null}
        {style === "call-in" ? (
          <>
            <span className="sp-style-bar__seg is-listen" style={{ flex: 1 }} />
            <span className="sp-style-bar__dot">
              <MicrophoneIcon />
            </span>
            <span className="sp-style-bar__seg is-listen" style={{ flex: 1.4 }} />
            <span className="sp-style-bar__dot">
              <MicrophoneIcon />
            </span>
            <span className="sp-style-bar__seg is-listen" style={{ flex: 0.8 }} />
          </>
        ) : null}
      </div>
      <div className="sp-style-bar__ticks">
        <span>開始</span>
        <span>終了</span>
      </div>
    </div>
  );
}
