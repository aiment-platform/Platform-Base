"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandProgressBar } from "./BrandProgressBar";
import { BrandTransition } from "./BrandTransition";
import { getInflightFetchCount, subscribeInflightFetches } from "./inflightFetches";

/**
 * ページ遷移の演出を、実際の画面遷移につなぐ係。
 *
 * App Router の usePathname は「遷移が終わってから」変わるので、それだけを見て
 * いると演出を出すのが手遅れになる。そこで
 *   ・リンクのクリック（と戻る/進む）を監視して出す
 *   ・コード側の遷移は useRouteTransition().navigate() から出す
 * という2経路にし、抜けるのは pathname が変わったのを合図にしている。
 * クリックは監視するだけで preventDefault はしないので、遷移そのものには
 * 一切干渉しない。
 *
 * 抜ける合図は次の3つがそろったとき:
 *   1. URL が変わった
 *   2. 飛んでいる fetch が 0 になった（inflightFetches 参照）
 *   3. ページから「待って」（useTransitionHold）が出ていない
 * URL が変わった時点ではページがまだ API から中身を取っている最中のことが
 * 多い。さらに配信画面・ルーム画面は LiveKit への接続（fetch ではなく
 * WebSocket）や映像の到着も待つ必要があるので、そこはページ自身が 3 で
 * 「まだ準備中」と申告する。
 *
 * 演出は2種類:
 *   wipe … 全画面を波で覆う。配信の場に入る／出るときだけ
 *   bar  … 画面下に波を出すだけで覆わない。それ以外のふつうの遷移
 *
 * 出さない場面（ここが一番大事）:
 *   ・ページ内のリンク（#見出しへ飛ぶだけ）。App Router ではこれが popstate も
 *     起こすので、クリックと popstate の両方で「行き先が同じページか」を見る。
 *   ・戻る／進むで同じページに留まるとき
 *   ・動きを減らす設定（prefers-reduced-motion）のとき
 */

export type TransitionVariant = "wipe" | "bar";

const TIMING: Record<TransitionVariant, { enter: number; exit: number; minVisible: number }> = {
  // CSS の btLayerIn / btLayerOut と揃える。滞空は minVisible - enter。
  wipe: { enter: 620, exit: 420, minVisible: 900 },
  // 覆わないので短くてよい。CSS の rbIn / rbOut と揃える。行き先は先読み済みで
  // すぐ描けることが多いので、滞空は短く（入りきって 140ms）。
  bar: { enter: 260, exit: 220, minVisible: 400 },
};

/** 遷移や読み込みが返ってこないときの保険。ここまで来たら必ず抜ける。
    短すぎると、開発サーバの初回コンパイルや遅い回線で「演出だけ先に
    消えて、少し後にページが切り替わる」ずれになる。覆わない bar は、
    リンクが preventDefault だけして遷移しない場合に居座らないよう少し短め。 */
const MAX_VISIBLE_MS: Record<TransitionVariant, number> = { wipe: 10000, bar: 6000 };

/** fetch が 0 になってから抜けるまでの猶予。続けて次の fetch が
    始まる（一覧を取ってから詳細を取る等）ときに、間で抜けないように。 */
const SETTLE_MS = 150;

/**
 * 全画面で覆うのは「配信の場に入る・出る」ときだけ。一覧→詳細やタブの
 * 切り替えまで覆うと、ただの移動が毎回おおごとに見えて重くなる。
 * /studio/live/<id>/post（配信後の画面）や /studio/live（一覧）は場の外。
 */
const IMMERSIVE = [/^\/room\//, /^\/studio\/live\/[^/]+$/];

function isImmersive(pathname: string) {
  return IMMERSIVE.some((pattern) => pattern.test(pathname));
}

function variantFor(from: string, to: string): TransitionVariant {
  return isImmersive(from) !== isImmersive(to) ? "wipe" : "bar";
}

/** 動きを減らす設定なら、演出そのものを出さない。 */
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Phase = "enter" | "hold" | "exit";
/** target は行き先のパス。そこへ着いたのを合図に抜ける。 */
type State = { phase: Phase; variant: TransitionVariant; from: string; target: string };

type ContextValue = {
  /** 演出を出してから遷移する。router.push の代わりに使う。 */
  navigate: (href: string, variant?: TransitionVariant) => void;
  /** 「まだ準備中なので抜けないで」を1件登録し、解除する関数を返す。 */
  hold: () => () => void;
};

const RouteTransitionContext = createContext<ContextValue | null>(null);

/**
 * ページが「まだ準備中」の間、遷移の演出を抜けさせない。
 * active が true の間だけ効く。演出が出ていないときに呼んでも何も起きない。
 * 保険の上限（MAX_VISIBLE_MS）が来たら、待っていても演出は抜ける。
 */
export function useTransitionHold(active: boolean) {
  const context = useContext(RouteTransitionContext);
  const hold = context?.hold;
  useEffect(() => {
    if (!active || !hold) return;
    return hold();
  }, [active, hold]);
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }
  return context;
}

/**
 * そのクリックが「このサイト内の別ページへの移動」なら行き先のパスを返す。
 * ページ内リンク（#見出し）や同じページへのリンクは null。
 */
function internalDestination(event: MouseEvent): string | null {
  // defaultPrevented は見ない。Next の <Link> がクライアント遷移のために
  // 必ず preventDefault するので、それを見ると全部はじいてしまう。
  if (event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || anchor.hasAttribute("download")) return null;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;

  // 同じページ（ハッシュだけ違う等）は遷移ではない
  const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
  return samePage ? null : url.pathname;
}

export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const startedAt = useRef(0);
  const startedFrom = useRef(pathname);
  // 行き先のページがまだ API から中身を取っている最中か。
  // 変わるのは true/false が切り替わるときだけなので、fetch のたびには再描画しない。
  // ページから出ている「待って」の数（useTransitionHold）
  const [holdCount, setHoldCount] = useState(0);
  const hold = useCallback(() => {
    setHoldCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setHoldCount((count) => Math.max(0, count - 1));
    };
  }, []);
  const loading = useSyncExternalStore(
    subscribeInflightFetches,
    () => getInflightFetchCount() > 0,
    () => false,
  );

  const start = useCallback((variant: TransitionVariant, target: string) => {
    if (prefersReducedMotion()) return;
    setState((current) => {
      // 抜けている最中の次のクリックは、新しい演出として出し直す
      if (current !== null && current.phase !== "exit") return current;
      startedAt.current = Date.now();
      return { phase: "enter", variant, from: window.location.pathname, target };
    });
  }, []);

  const beginExit = useCallback(() => {
    setState((current) => (current === null || current.phase === "exit" ? current : { ...current, phase: "exit" }));
  }, []);

  const navigate = useCallback(
    (href: string, variant?: TransitionVariant) => {
      let to = href;
      try {
        to = new URL(href, window.location.href).pathname;
      } catch {
        /* 相対でない文字列はそのまま比較に使う */
      }
      start(variant ?? variantFor(window.location.pathname, to), to);
      router.push(href);
    },
    [router, start],
  );

  // リンククリックと 戻る/進む を合図に出す
  useEffect(() => {
    // いちばん外側（window の bubble）で聞く。配信中の離脱確認のように、
    // クリックを途中で止める仕掛け（stopPropagation）があれば、ここまで届かない
    // ので演出も出ない。Next の <Link> は preventDefault するだけで止めないので、
    // ふつうのページ移動はちゃんと届く。
    const onClick = (event: MouseEvent) => {
      const to = internalDestination(event);
      if (to) start(variantFor(window.location.pathname, to), to);
    };

    // popstate はページ内リンク（#見出し）でも飛んでくる。行き先が同じページ
    // なら出さない。戻る／進むは待ち時間が短いので、覆わない帯だけにする。
    const onPopState = () => {
      const to = window.location.pathname;
      if (to === startedFrom.current) return;
      start("bar", to);
    };

    window.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
    };
  }, [start]);

  // 演出を出していない間は「いまどのページにいるか」を控えておく。
  // 戻る／進むのときに、ページが本当に変わったのかを見分けるのに使う。
  useEffect(() => {
    if (state === null) startedFrom.current = pathname;
  }, [pathname, state]);

  // 入りきったら滞空へ
  useEffect(() => {
    if (state?.phase !== "enter") return;
    const timer = window.setTimeout(
      () => setState((current) => (current?.phase === "enter" ? { ...current, phase: "hold" } : current)),
      TIMING[state.variant].enter,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  // 行き先が描けて、中身の読み込みも終わったら抜ける。返ってこなければ保険で抜ける。
  useEffect(() => {
    if (state === null || state.phase === "exit") return;

    const elapsed = Date.now() - startedAt.current;
    // どこかに着いたら抜ける。行き先そのものでなくてもよい（未ログインで
    // /auth に飛ばされる等）。戻る／進むは start の時点でもう着いている。
    const arrived = pathname === state.target || pathname !== state.from;
    const wait = arrived && !loading && holdCount === 0
      ? Math.max(SETTLE_MS, TIMING[state.variant].minVisible - elapsed)
      : Math.max(0, MAX_VISIBLE_MS[state.variant] - elapsed);

    const timer = window.setTimeout(beginExit, wait);
    return () => window.clearTimeout(timer);
  }, [pathname, state, loading, holdCount, beginExit]);

  // 抜けきったら片付ける
  useEffect(() => {
    if (state?.phase !== "exit") return;
    const timer = window.setTimeout(() => setState(null), TIMING[state.variant].exit);
    return () => window.clearTimeout(timer);
  }, [state]);

  const value = useMemo<ContextValue>(() => ({ navigate, hold }), [navigate, hold]);

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {state?.variant === "wipe" ? <BrandTransition phase={state.phase} /> : null}
      {state?.variant === "bar" ? <BrandProgressBar phase={state.phase} /> : null}
    </RouteTransitionContext.Provider>
  );
}
