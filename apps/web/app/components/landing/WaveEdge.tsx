/**
 * 紫の面と本文の境目に置く「波」。/for-vtubers と /lp で共用する。
 */

/* ==========================================================================
   紫の面のふち（波）
   --------------------------------------------------------------------------
   モックの波をそのまま写し取っている。濃い紫の波の裏に、それより少しだけ
   振幅が大きく・山が右にずれた淡い紫の波が隠れていて、そのずれの分だけ
   下からチラ見えする。だから覗く幅が場所によって太くなったり細くなったりする。

   数字は VTuber用CTA.png の実測値。横1440pxを48px刻みで拾った波の高さで、
   画像の y=900 を 0 とした座標系（＝このSVGのviewBox座標）。
   ========================================================================== */
const EDGE_W = 1440;
const EDGE_H = 152;

/** 手前の濃い紫の波。 */
const EDGE_FRONT = [
  10, 26, 43, 58, 73, 86, 97, 106, 113, 117, 118, 117, 113, 107, 99, 90,
  82, 74, 66, 61, 57, 57, 59, 63, 69, 76, 85, 96, 108, 120, 132,
];

/** 裏の淡い紫の波。手前より下にあり、山と谷の位置も少しずれている。 */
const EDGE_BACK = [
  33, 45, 57, 70, 83, 96, 109, 121, 131, 138, 142, 143, 141, 136, 129, 119,
  108, 98, 90, 83, 78, 74, 72, 73, 79, 86, 95, 105, 116, 130, 147,
];

/**
 * 等間隔に並んだ高さの列を「なめらかな1本の波」に変え、その上を全部塗る形にする。
 *
 * 点を直線でつなぐとカクカクした折れ線になってしまう。そこで Catmull-Rom
 * （前後の点を結んだ向きを、その点での曲線の傾きとして使うやり方）で
 * 3次ベジェ曲線の制御点を作り、全部の点をきれいに通る曲線にしている。
 * 両端は前後の点がないので、自分自身で代用する。
 */
function fillAbove(ys: number[]) {
  const step = EDGE_W / (ys.length - 1);
  const at = (i: number) => ys[Math.min(ys.length - 1, Math.max(0, i))];

  let d = `M 0 ${at(0)}`;
  for (let i = 0; i < ys.length - 1; i++) {
    const x = i * step;
    const c1 = at(i) + (at(i + 1) - at(i - 1)) / 6;
    const c2 = at(i + 1) - (at(i + 2) - at(i)) / 6;
    d += ` C ${(x + step / 3).toFixed(1)} ${c1.toFixed(2)}`;
    d += ` ${(x + (step * 2) / 3).toFixed(1)} ${c2.toFixed(2)}`;
    d += ` ${(x + step).toFixed(1)} ${at(i + 1)}`;
  }
  // 波の上を、SVGの外まではみ出させて塗る。継ぎ目に隙間が出ないようにするため。
  return `${d} L ${EDGE_W} -40 L 0 -40 Z`;
}

const EDGE_FRONT_PATH = fillAbove(EDGE_FRONT);
const EDGE_BACK_PATH = fillAbove(EDGE_BACK);

/**
 * flip = true で上下反転。クリーム→紫の向きになるので、ページ末尾側に使う。
 *
 * 幅100% + 高さautoにして viewBox の比率をそのまま保つ。画面幅が変わっても
 * 波が切り取られたり、縦に潰れて別の形になったりしない。
 */
export function WaveEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${EDGE_W} ${EDGE_H}`}
      className={`block w-full ${flip ? "-mb-px -scale-y-100" : "-mt-px"}`}
      aria-hidden
      focusable="false"
    >
      <path fill="var(--brand-primary-light)" d={EDGE_BACK_PATH} />
      <path fill="var(--brand-primary)" d={EDGE_FRONT_PATH} />
    </svg>
  );
}
