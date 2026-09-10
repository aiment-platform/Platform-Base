import type { CSSProperties } from "react";

import { halftoneRadius } from "./halftone";

/**
 * 画面遷移のワイプ。ver0.3のモチーフである「波」と「水玉（ハーフトーン）」で
 * 画面を覆い、中央に白抜きのaimentシンボルとLoading表示を置く。
 *
 * 動きは 入り → 滞空 → 抜け の3段。四角い板をスライドさせるのではなく、
 * パーツ（地・帯・水玉）を1枚ずつ、少しずつ時間をずらして横に流している。
 * そのため入り抜きのふちは波の形になり、パーツ同士がばらけて動く。
 *
 *   BASE  … 地。左右どちらのふちも波形で、外側に水玉のほつれが付く。
 *           静止位置では両ふちとも画面の外にあるので、覆っている間は
 *           べた塗りに見え、動いている間だけ波のふちが横切っていく。
 *   DECOR … 帯と水玉。
 *
 * 水玉は1周でちょうど1マスぶん送られるベルトコンベア方式。奥の粒が縮んで
 * 消え、ふち側から新しい粒が湧いて補充されるので、模様は止まったまま粒だけ
 * が延々と流れていくように見える（詳しくは halftone のコメント）。
 * 乱数は使わないのでサーバとクライアントで必ず同じ図形になる。
 */

const VB_W = 1200;
const VB_H = 800;

type Edge = { base: number; amp: number; phase: number };
type Dot = { cx: number; cy: number; r: number; dx: number; to: number };

function waveX(y: number, edge: Edge) {
  return edge.base + edge.amp * Math.sin((y / VB_H) * Math.PI * 1.5 + edge.phase);
}

function shift(edge: Edge, by: number): Edge {
  return { ...edge, base: edge.base + by };
}

/** 2本の波にはさまれた面。 */
function slabPath(left: Edge, right: Edge) {
  const lead: string[] = [];
  const trail: string[] = [];
  for (let y = -160; y <= VB_H + 160; y += 16) {
    lead.push(`${waveX(y, left).toFixed(1)} ${y}`);
    trail.unshift(`${waveX(y, right).toFixed(1)} ${y}`);
  }
  return `M ${lead.join(" L ")} L ${trail.join(" L ")} Z`;
}

/**
 * 波のふちから dir 方向へ、粒が小さくなっていく水玉。
 * dir = -1 で左へ、+1 で右へほつれていく。
 *
 * 格子の起点は帯の「内側」に inset だけ入れてある。いちばん大きい粒は
 * そこに収まって帯と同化するので外にはみ出さず、外に出てくる粒は
 * すでに育ちきった状態で帯の裏から現れる（小さく湧く段階を見せない）。
 *
 * 動きはベルトコンベア方式。1周で粒がちょうど1マスぶん隣へ動き、同時に
 * 大きさを「隣のマスの大きさ」まで変える。1周し終えた絵は始まりの絵と
 * 完全に一致するので、粒だけが延々と流れていくように見える。
 *   ・一番奥（reach の手前）の粒は次のマスの大きさが 0 なので消える
 *   ・巻き戻りで空くのは起点のマスだけで、そこは帯の裏なので見えない
 */
function halftone(edge: Edge, step: number, reach: number, inset: number, dir: -1 | 1 = -1): Dot[] {
  const dots: Dot[] = [];
  const dx = +(dir * step).toFixed(1);
  for (let row = -3; row * step - 90 <= VB_H + 120; row++) {
    const cy = row * step - 90;
    const origin = waveX(cy, edge) - dir * inset;
    for (let col = 0; col < 14; col++) {
      const offset = col * step;
      const here = halftoneRadius(offset, step, reach);
      if (here <= 0) continue;
      const next = halftoneRadius(offset + step, step, reach);
      dots.push({
        cx: +(origin + dir * offset).toFixed(1),
        cy,
        r: +here.toFixed(2),
        dx,
        to: +(next / here).toFixed(3),
      });
    }
  }
  return dots;
}

/* --- 地：静止位置では両ふちとも画面の外にある --------------------------- */
const BASE_LEFT: Edge = { base: -120, amp: 90, phase: 0.35 };
const BASE_RIGHT: Edge = { base: 1620, amp: 80, phase: 1.4 };
const BASE_SLAB = slabPath(BASE_LEFT, BASE_RIGHT);
const BASE_FRINGE_LEFT = halftone(BASE_LEFT, 32, 256, 28, -1);
const BASE_FRINGE_RIGHT = halftone(BASE_RIGHT, 32, 256, 28, 1);

/* --- 装飾：帯と水玉 ------------------------------------------------------- */
const FAR_EDGE: Edge = { base: 220, amp: 70, phase: 0.2 };
const FAR_RIBBON = slabPath(FAR_EDGE, shift(FAR_EDGE, 200));
const FAR_DOTS = halftone(FAR_EDGE, 34, 272, 29, -1);

const MAIN_EDGE: Edge = { base: 820, amp: 92, phase: 1.05 };
const RIBBON_MID = slabPath(MAIN_EDGE, shift(MAIN_EDGE, 132));
const RIBBON_DARK = slabPath(shift(MAIN_EDGE, 132), shift(MAIN_EDGE, 250));
const RIBBON_BACK = slabPath(shift(MAIN_EDGE, 250), shift(MAIN_EDGE, 600));
const MAIN_DOTS = halftone(MAIN_EDGE, 30, 240, 26, -1);

function DotField({ dots, className }: { dots: Dot[]; className: string }) {
  return (
    <>
      {dots.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          className={className}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          style={
            {
              "--bt-dx": `${dot.dx}px`,
              "--bt-to": dot.to,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/**
 * enter … 右外から入ってくる
 * hold  … 静止して待つ
 * exit  … 左外へ抜けていく
 * demo  … enter→hold→exit を繰り返す（確認用）
 */
export type TransitionPhase = "enter" | "hold" | "exit" | "demo";

type BrandTransitionProps = {
  /** ロゴの下に出す文言。既定は "Loading"。 */
  label?: string;
  /** 画面全体を覆わず、親要素の中に収めたいとき（プレビュー用）。 */
  inline?: boolean;
  /** 入り／滞空／抜けのどこにいるか。 */
  phase?: TransitionPhase;
};

const SVG_PROPS = {
  viewBox: `0 0 ${VB_W} ${VB_H}`,
  preserveAspectRatio: "xMidYMid slice" as const,
  "aria-hidden": true,
};

export function BrandTransition({ label = "Loading", inline = false, phase = "hold" }: BrandTransitionProps) {
  const className = [
    "brand-transition",
    `brand-transition--${phase}`,
    inline ? "brand-transition--inline" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite">
      {/* 地。中央を抜かないので、覆っている間は隙間なく塗りつぶす。 */}
      <svg className="brand-transition__base" {...SVG_PROPS}>
        <g className="bt-layer bt-layer--base">
          <path className="bt-fill bt-fill--base" d={BASE_SLAB} />
          <DotField dots={BASE_FRINGE_LEFT} className="bt-dot bt-dot--fringe" />
          <DotField dots={BASE_FRINGE_RIGHT} className="bt-dot bt-dot--fringe" />
        </g>
      </svg>

      {/* 装飾。中央だけ丸く抜いてロゴを読みやすくする。 */}
      <svg className="brand-transition__decor" {...SVG_PROPS}>
        <g className="bt-layer bt-layer--far">
          <path className="bt-fill bt-fill--far" d={FAR_RIBBON} />
          <DotField dots={FAR_DOTS} className="bt-dot bt-dot--far" />
        </g>
        <g className="bt-layer bt-layer--mid">
          <path className="bt-fill bt-fill--mid" d={RIBBON_MID} />
          <DotField dots={MAIN_DOTS} className="bt-dot" />
        </g>
        <g className="bt-layer bt-layer--dark">
          <path className="bt-fill bt-fill--dark" d={RIBBON_DARK} />
        </g>
        <g className="bt-layer bt-layer--back">
          <path className="bt-fill bt-fill--back" d={RIBBON_BACK} />
        </g>
      </svg>

      <div className="brand-transition__center">
        <span className="brand-transition__mark">
          {/* ロゴタイプではなくシンボルだけ。白抜きはCSS側で掛けている。 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/aiment_logo.svg" alt="" width={200} height={200} />
        </span>
        <p className="brand-transition__label">
          {label}
          <span className="brand-transition__ellipsis" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </p>
      </div>
    </div>
  );
}
