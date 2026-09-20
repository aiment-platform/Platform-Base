import Link from "next/link";

import { formatSlotDate, formatSlotTime, STYLE_LABEL, type SupporterSlot } from "./slots";

/**
 * メイト枠のあるセッションの1枚。
 * 上：VTuber・ゲーム／企画・日時。中：参加スタイル、メイト人数、集合、後半合流の時間。
 * 下：残席と「参加する」。カードだけ見れば、その回の参加イメージが分かるように。
 */
export function SupporterSlotCard({ slot }: { slot: SupporterSlot }) {
  const soldOut = slot.supporterSeatsLeft <= 0;
  return (
    <article className={`sp-slot sp-slot--${slot.style}`}>
      <div className="sp-slot__head">
        <div className="sp-slot__vtuber">
          <span className="sp-slot__avatar" aria-hidden>
            {slot.vtuber.initial}
          </span>
          <span>{slot.vtuber.name}</span>
        </div>
        <p className="sp-slot__game">{slot.game}</p>
        <p className="sp-slot__when">
          {formatSlotDate(slot.startsAt)} {formatSlotTime(slot.startsAt)}〜{formatSlotTime(slot.endsAt)}
        </p>
        {slot.sample ? <span className="sp-slot__sample">サンプル</span> : null}
      </div>

      <div className="sp-slot__body">
        <div className="sp-slot__style">
          <span className="sp-slot__style-label">参加スタイル</span>
          <span className="sp-slot__style-name">{STYLE_LABEL[slot.style]}</span>
        </div>

        <dl className="sp-slot__facts">
          <div>
            <dt>メイト</dt>
            <dd>{slot.supporterSeats}人</dd>
          </div>
          <div>
            <dt>集合</dt>
            <dd>開始{slot.gatherMinutesBefore}分前</dd>
          </div>
          <div className="is-wide">
            <dt>音声で合流</dt>
            <dd>
              {slot.nativeMix
                ? `${formatSlotTime(slot.nativeMix.from)}〜${formatSlotTime(slot.nativeMix.to)}`
                : slot.style === "open-mix"
                  ? "最初から"
                  : "呼ばれたとき"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="sp-slot__foot">
        <span className={`sp-slot__left ${soldOut ? "is-soldout" : ""}`.trim()}>
          {soldOut ? "満席" : `メイト残り${slot.supporterSeatsLeft}席`}
        </span>
        {soldOut ? (
          <span className="ui-btn ui-btn-md ui-btn-ghost" aria-disabled>
            満席
          </span>
        ) : (
          <Link href={slot.href} className="ui-btn ui-btn-md ui-btn-primary">
            参加する
          </Link>
        )}
      </div>
    </article>
  );
}
