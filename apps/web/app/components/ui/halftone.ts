/**
 * ハーフトーン（水玉グラデ）の粒の大きさ。ワイプと下部バーで共通。
 *
 * 一番大きい粒は間隔(step)の 0.72 倍。正方格子なので、これだけあると
 * 斜めの隙間がほぼ塞がってべた塗りに見え、小さくなるにつれて隙間が
 * 菱形（4方向の星形）に開き、やがて粒が分離する。
 * 指数を1より小さくしているのは、半径が step の 0.707倍（隙間が閉じる）
 * から 0.5倍（粒が離れる）の間に数列ぶん残して、その菱形を見せるため。
 */
export function halftoneRadius(offset: number, step: number, reach: number) {
  const t = 1 - offset / reach;
  if (t <= 0.05) return 0;
  return Math.pow(t, 0.7) * step * 0.72;
}
