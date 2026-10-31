"use client";

/**
 * AJL（難易度）の色。決まった形の記録。
 *
 * 0.4 の配信枠カードは、タブの左端をレベルの色の正方形にする。数字は触れたときだけ出す（スマホはいつも出す）。
 * カードの形も 0.4 用に作り直した（90°の角は半径 18、斜めの肩は半径 37）。
 * 見た目はすべて v04.css と session_container_v04.svg / session_detail_v04.svg にあり、ここでは本物のカードを並べるだけ。
 */
import { StreamSessionCard } from "../../components/home/StreamSessionCard";
import { AJL_LEVELS } from "../../lib/ajl";

const SAMPLE_TITLES = [
  "はじめての日本語あいさつ",
  "ゆっくり雑談しよう",
  "夏祭りの思い出を話そう",
  "好きなゲームを紹介して",
  "ニュースを読んで意見を言おう",
  "なんでもフリートーク",
];

const DECISIONS = [
  {
    topic: "色の置き場所",
    decision: "タブの左端を、レベルの色の正方形にする（大きさはタブの高さと同じ）",
    why: "タブ全体を塗ると色が多すぎ、白い札だけだと紫のタブに沈む。正方形にしたのは、ほぼ正方形（1.29:1）だと「正方形にし損ねた」ように見えたため",
  },
  {
    topic: "正方形の角",
    decision: "左上だけカードの角に合わせて丸め、ほかの3つは直角",
    why: "タブの上・左・下のふちにぴったり付き、タブを色で切り分けた形に見える。右下だけ丸めると何の形か分からなくなった",
  },
  {
    topic: "数字",
    decision: "PC は触れたとき（キーボードで選んだときも）だけ出す。スマホはいつも出す",
    why: "PC の一覧を静かにするため。触れると数字とレベル名（Beginner など）がいっしょに出る。スマホには触れる（ホバー）がないので出しっぱなし",
  },
  {
    topic: "カードの丸み",
    decision: "90°の角は半径 18、斜めの肩は半径 37（0.31 は全部 24）",
    why: "弧の長さ = 半径 × 曲がる角度。同じ半径だと、90°曲がる左上の弧が、約44°しか曲がらない肩の約2倍になり、左上だけ妙に丸く見えた。肩を約2倍にして弧の長さをそろえた",
  },
];

export function AjlColorBoard() {
  return (
    <div className="grid gap-8">
      <div className="ui-panel grid gap-3 p-6 text-sm leading-relaxed">
        <h3 className="text-lg font-black">AJL の色：タブの左端に、レベルの色の正方形</h3>
        <p>0.4 で決まった形。下のカードは本物（ホームと同じ部品）なので、触れると数字が出る。</p>
        <p className="text-[var(--brand-text-muted)]">
          トレードオフ：PC では普段、色だけでレベルを伝えることになる。色の見分けが苦手な人は、触れないとレベルが分からない（近い色の 2 と 3、4 と 5 は特に）。
        </p>
      </div>

      <section className="ui-panel grid gap-5 p-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
          {AJL_LEVELS.map((level, index) => (
            <StreamSessionCard
              key={level.level}
              title={SAMPLE_TITLES[index]}
              channelName="Sample"
              thumbnail={`/image/thumbnail/samples/thumbnail_${(index % 5) + 1}.jpg`}
              startsAt="2026-10-29T21:00:00+09:00"
              slotsLeft={2}
              slotsTotal={4}
              japaneseLevel={level.level}
              onOpen={() => {}}
            />
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
