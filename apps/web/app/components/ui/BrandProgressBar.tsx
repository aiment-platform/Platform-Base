import { halftoneRadius } from "./halftone";

/**
 * 画面下に出す読み込み表示。全画面ワイプと違って画面を覆わないので、
 * 遷移前の一覧を見たまま「いま読み込んでいる」ことだけが伝わる。
 *
 * 紫の帯の上ふちが波で、そこから水玉がほどけて上へ消えていく。
 * 帯ごと横に流し続けることで進行中であることを示す。1周期ぶんだけ動かして
 * 先頭に戻すので継ぎ目は出ない（波の周期＝タイル幅＝移動量）。
 * 乱数は使わないのでサーバとクライアントで必ず同じ図形になる。
 */

const VB_W = 1200;
const VB_H = 120;
const PERIOD = 600;
const TILES = [-PERIOD, 0, PERIOD, PERIOD * 2];

type Wave = { base: number; amp: number; phase: number };
type Dot = { cx: number; cy: number; r: number };

function waveY(x: number, wave: Wave) {
  return wave.base + wave.amp * Math.sin((x / PERIOD) * Math.PI * 2 + wave.phase);
}

/** 波のふちから下を塗りつぶす帯。1周期ぶん。 */
function slabPath(wave: Wave) {
  const points: string[] = [];
  for (let x = -1; x <= PERIOD + 1; x += 10) {
    points.push(`${x} ${waveY(x, wave).toFixed(1)}`);
  }
  return `M ${points.join(" L ")} L ${PERIOD + 1} ${VB_H + 40} L -1 ${VB_H + 40} Z`;
}

/** 波のふちから上へ、粒が小さくなっていく水玉。1周期ぶん。 */
function halftone(wave: Wave, step: number, reach: number, inset: number): Dot[] {
  const dots: Dot[] = [];
  for (let col = 0; col * step < PERIOD; col++) {
    const cx = col * step + step / 2;
    // 起点は帯の内側。一番大きい粒はそこに収まるので外にはみ出さない。
    const origin = waveY(cx, wave) + inset;
    for (let row = 0; ; row++) {
      const r = halftoneRadius(row * step, step, reach);
      if (r <= 0) break;
      dots.push({ cx, cy: +(origin - row * step).toFixed(1), r: +r.toFixed(2) });
    }
  }
  return dots;
}

const BACK_WAVE: Wave = { base: 78, amp: 11, phase: 1.1 };
const FRONT_WAVE: Wave = { base: 94, amp: 9, phase: 0 };

const BACK_SLAB = slabPath(BACK_WAVE);
const BACK_DOTS = halftone(BACK_WAVE, 20, 60, 16);
const FRONT_SLAB = slabPath(FRONT_WAVE);
const FRONT_DOTS = halftone(FRONT_WAVE, 20, 60, 16);

function Tile({ x, slab, dots, fill }: { x: number; slab: string; dots: Dot[]; fill: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path className={fill} d={slab} />
      {dots.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} className={fill} cx={dot.cx} cy={dot.cy} r={dot.r} />
      ))}
    </g>
  );
}

type BrandProgressBarProps = {
  label?: string;
  /** 画面下に固定せず、親要素の中に収めたいとき（プレビュー用）。 */
  inline?: boolean;
  /** 入り／滞空／抜けのどこにいるか。 */
  phase?: "enter" | "hold" | "exit";
};

export function BrandProgressBar({ label = "Loading", inline = false, phase = "hold" }: BrandProgressBarProps) {
  const className = ["route-bar", `route-bar--${phase}`, inline ? "route-bar--inline" : ""].filter(Boolean).join(" ");

  return (
    <div className={className} role="status" aria-live="polite">
      <svg
        className="route-bar__scene"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <g className="rb-marquee rb-marquee--back">
          {TILES.map((x) => (
            <Tile key={x} x={x} slab={BACK_SLAB} dots={BACK_DOTS} fill="rb-fill rb-fill--back" />
          ))}
        </g>
        <g className="rb-marquee rb-marquee--front">
          {TILES.map((x) => (
            <Tile key={x} x={x} slab={FRONT_SLAB} dots={FRONT_DOTS} fill="rb-fill rb-fill--front" />
          ))}
        </g>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
