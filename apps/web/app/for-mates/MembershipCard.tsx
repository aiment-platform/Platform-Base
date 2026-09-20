import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/outline";

/**
 * VTuberごとのメイト メンバーシップの1枚。料金は未定なので、その旨を出す。
 * 実データが来たら vtuberName と price を差し替える。
 */
export function MembershipCard({
  vtuberName,
  priceJpy,
  href,
  sample = false,
}: {
  vtuberName: string;
  /** 円／月。未定なら null */
  priceJpy: number | null;
  href: string;
  sample?: boolean;
}) {
  const includes = ["毎月メイト参加券 1回分", "メイト枠のあるセッションへの参加", "メイト向けの募集や案内", "追加参加は別途チケット"];
  return (
    <article className="sp-member">
      <div className="sp-member__head">
        <p className="sp-member__label">メンバーシップ</p>
        <h3>{vtuberName} メイト</h3>
        <p className="sp-member__price">
          {priceJpy === null ? (
            <>
              <span className="sp-member__tbd">料金未定</span>
              <span className="sp-member__per">/ month</span>
            </>
          ) : (
            <>
              <span>¥{priceJpy.toLocaleString("ja-JP")}</span>
              <span className="sp-member__per">/ month</span>
            </>
          )}
        </p>
        {sample ? <span className="sp-slot__sample">サンプル</span> : null}
      </div>
      <ul className="sp-member__list">
        {includes.map((item) => (
          <li key={item}>
            <CheckIcon aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <Link href={href} className="ui-btn ui-btn-lg ui-btn-primary w-full">
        メイトになる
      </Link>
    </article>
  );
}
