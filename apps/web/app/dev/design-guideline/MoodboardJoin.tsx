"use client";

/**
 * join ページの上半分（チケット）の記録。部品は本物（app/join/[sessionId]/JoinHero.tsx）。
 * 上の切り替えで、状態・枠の数を変えて見た目を確かめられる。
 */
import { useState } from "react";
import { JoinHero, type StartState } from "../../join/[sessionId]/JoinHero";
import { getAjlInfo } from "../../lib/ajl";
import { useI18n } from "../../lib/i18n";

const SAMPLES: { id: string; label: string; start: StartState; left: number; total: number; level: number }[] = [
  { id: "plenty", label: "残り 3/5・あと2日", start: { kind: "upcoming", days: 2, hours: 3, minutes: 0 }, left: 3, total: 5, level: 3 },
  { id: "few", label: "残り 1/5・あと40分", start: { kind: "upcoming", days: 0, hours: 0, minutes: 40 }, left: 1, total: 5, level: 5 },
  { id: "many", label: "残り 12/20（バーになる）", start: { kind: "upcoming", days: 0, hours: 5, minutes: 10 }, left: 12, total: 20, level: 1 },
  { id: "full", label: "満席", start: { kind: "upcoming", days: 1, hours: 1, minutes: 0 }, left: 0, total: 4, level: 4 },
  { id: "live", label: "配信中", start: { kind: "live" }, left: 2, total: 4, level: 2 },
  { id: "ended", label: "終了", start: { kind: "ended" }, left: 0, total: 5, level: 6 },
];

const DECISIONS = [
  { topic: "形", decision: "チケット。左の半券に日時、ミシン目の右に残り枠・レベル・長さ", why: "「枠を予約するもの」だと形で伝わる。日時がいちばん強い色の面に載るので、まず目に入る" },
  { topic: "半券の色", decision: "これから＝紫 / 配信中＝アクセント / 終了＝灰色", why: "日時の次に知りたい「今どういう状態か」を、色でも伝える" },
  { topic: "狭いとき", decision: "置かれた場所の幅が 520px 未満なら、半券を上に置き、ミシン目を横に通す（縦のチケット）", why: "横並びのままでは狭すぎる。画面の幅ではなく置かれた場所の幅で決めるので、スマホでもこの見本の枠でも同じになる" },
  { topic: "自分の席", decision: "予約すると、席のゲージの左端が赤い「自分の席」になり、半券に予約済みのスタンプ", why: "赤は自分の席専用。残りが少ないことは、空席の色ではなく「残り」の数字を赤くして伝える" },
  { topic: "残り枠", decision: "10枠までは席を1つずつ、11枠以上はバー。残りが少ないとアクセントの色", why: "数が少ないうちは、本数で数えられるほうが早い" },
];

export function JoinHeroBoard() {
  const { tx } = useI18n();
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const sample = SAMPLES.find((item) => item.id === sampleId) ?? SAMPLES[0];

  return (
    <div className="grid gap-8">
      <div className="ui-panel grid gap-3 p-6 text-sm leading-relaxed">
        <h3 className="text-lg font-black">join ページ：チケット</h3>
        <p>枠の情報（いつ・残り枠・レベル・長さ）は、チケットの形で見せる。下の見本は本物の部品。</p>
        <div className="ui-segment mt-1 w-fit flex-wrap" role="group" aria-label="見本のデータ">
          {SAMPLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSampleId(item.id)}
              aria-pressed={item.id === sampleId}
              className="ui-segment__option px-3 text-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="ui-panel grid gap-5 p-6">
        {/* ページの左の列と同じくらいの幅と、スマホの幅で並べる */}
        <div className="flex flex-wrap items-start gap-6">
          {[
            { label: "PC（左の列の幅）", width: "max-w-[920px] flex-1 basis-[600px]" },
            { label: "スマホ", width: "w-[360px]" },
          ].map((frame) => (
            <div key={frame.label} className={`grid gap-2 ${frame.width}`}>
              <p className="text-xs font-black text-[var(--brand-text-muted)]">{frame.label}</p>
              <div className="rounded-2xl bg-[var(--bg)] p-3 [container-type:inline-size]">
                <JoinHero
                  title="夏祭りの思い出を話そう"
                  description={"浴衣・花火・屋台など、夏祭りの思い出を日本語で話しましょう。\nゆっくり話すので、はじめての人も大丈夫です。"}
                  thumbnail="/image/thumbnail/samples/thumbnail_3.jpg"
                  host={{ name: "Sample", onOpen: () => {} }}
                  ajl={getAjlInfo(sample.level)}
                  start={sample.start}
                  startsAtLabel="11/01 21:00 JST"
                  startsAtHostLabel={null}
                  durationLabel={tx("約60分", "About 60 min")}
                  slotsLeft={sample.left}
                  slotsTotal={sample.total}
                  participationType={tx("先着順", "First-come")}
                  tx={tx}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ui-panel grid gap-3 p-6">
        <h4 className="text-xl font-black">決めたこと</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm leading-relaxed">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs font-black text-[var(--brand-text-muted)]">
                <th className="py-2 pr-4">項目</th>
                <th className="py-2 pr-4">決めたこと</th>
                <th className="py-2">理由</th>
              </tr>
            </thead>
            <tbody>
              {DECISIONS.map((row) => (
                <tr key={row.topic} className="border-b border-[var(--line)] align-top">
                  <td className="py-2 pr-4 font-black">{row.topic}</td>
                  <td className="py-2 pr-4">{row.decision}</td>
                  <td className="py-2">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
