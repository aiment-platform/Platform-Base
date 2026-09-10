"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandProgressBar } from "./BrandProgressBar";
import { BrandTransition } from "./BrandTransition";

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
 * 演出は2種類:
 *   wipe … 全画面を波で覆う。行き先が別の文脈になる遷移向け
 *   bar  … 画面下に波を出すだけで覆わない。一覧から詳細へ、のように
 *          元の画面が見えていた方が親切な遷移向け
 */

export type TransitionVariant = "wipe" | "bar";

const TIMING: Record<TransitionVariant, { enter: number; exit: number; minVisible: number }> = {
  // CSS の btLayerIn / btLayerOut と揃える。滞空は minVisible - enter。
  wipe: { enter: 880, exit: 590, minVisible: 1450 },
  // 覆わないので短くてよい。CSS の rbIn / rbOut と揃える。
  bar: { enter: 320, exit: 260, minVisible: 700 },
};

/** 遷移が返ってこないときの保険。ここまで来たら必ず抜ける。 */
const MAX_VISIBLE_MS = 8000;

type Phase = "enter" | "hold" | "exit";
type State = { phase: Phase; variant: TransitionVariant };

type ContextValue = {
  /** 演出を出してから遷移する。router.push の代わりに使う。 */
  navigate: (href: string, variant?: TransitionVariant) => void;
};

const RouteTransitionContext = createContext<ContextValue | null>(null);

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }
  return context;
}

/** そのクリックが「このサイト内の別ページへの移動」なら true。 */
function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || anchor.hasAttribute("download")) return false;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  // 同じページ（ハッシュだけ違う等）は遷移ではない
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const startedAt = useRef(0);
  const startedFrom = useRef(pathname);

  const start = useCallback((variant: TransitionVariant) => {
    setState((current) => {
      if (current !== null) return current;
      startedAt.current = Date.now();
      startedFrom.current = window.location.pathname;
      return { phase: "enter", variant };
    });
  }, []);

  const beginExit = useCallback(() => {
    setState((current) => (current === null || current.phase === "exit" ? current : { ...current, phase: "exit" }));
  }, []);

  const navigate = useCallback(
    (href: string, variant: TransitionVariant = "wipe") => {
      start(variant);
      router.push(href);
    },
    [router, start],
  );

  // リンククリックと 戻る/進む を合図に出す（こちらは常に全画面ワイプ）
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) start("wipe");
    };
    const onPopState = () => start("wipe");

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [start]);

  // 入りきったら滞空へ
  useEffect(() => {
    if (state?.phase !== "enter") return;
    const timer = window.setTimeout(
      () => setState((current) => (current?.phase === "enter" ? { ...current, phase: "hold" } : current)),
      TIMING[state.variant].enter,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  // 遷移先が描けたら（＝pathnameが変わったら）抜ける。返ってこなければ保険で抜ける。
  useEffect(() => {
    if (state === null || state.phase === "exit") return;

    const arrived = pathname !== startedFrom.current;
    const elapsed = Date.now() - startedAt.current;
    const wait = arrived
      ? Math.max(0, TIMING[state.variant].minVisible - elapsed)
      : Math.max(0, MAX_VISIBLE_MS - elapsed);

    const timer = window.setTimeout(beginExit, wait);
    return () => window.clearTimeout(timer);
  }, [pathname, state, beginExit]);

  // 抜けきったら片付ける
  useEffect(() => {
    if (state?.phase !== "exit") return;
    const timer = window.setTimeout(() => setState(null), TIMING[state.variant].exit);
    return () => window.clearTimeout(timer);
  }, [state]);

  const value = useMemo<ContextValue>(() => ({ navigate }), [navigate]);

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {state?.variant === "wipe" ? <BrandTransition phase={state.phase} /> : null}
      {state?.variant === "bar" ? <BrandProgressBar phase={state.phase} /> : null}
    </RouteTransitionContext.Provider>
  );
}
