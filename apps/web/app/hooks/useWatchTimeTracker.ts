"use client";

import { useCallback, useEffect, useRef } from "react";

interface Props {
  streamSessionId: string;
  hostUserId: string | undefined;
  connected: boolean;
  /** host ロールは計測しない */
  isHost: boolean;
}

/**
 * ルームページに差し込む視聴時間トラッカー。
 * connected になったら開始、切断/アンマウント時に終了。
 * 終了は navigator.sendBeacon（POST）を使うのでタブ閉じでも記録される。
 */
export function useWatchTimeTracker({ streamSessionId, hostUserId, connected, isHost }: Props) {
  const watchSessionIdRef = useRef<string | null>(null);

  const endSession = useCallback(() => {
    const id = watchSessionIdRef.current;
    if (!id) return;
    watchSessionIdRef.current = null;

    const body = JSON.stringify({ action: "end", watchSessionId: id });
    try {
      // sendBeacon はタブ閉じでも確実に送れる
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/watch-session", new Blob([body], { type: "application/json" }));
      } else {
        // フォールバック（keepalive）
        void fetch("/api/watch-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => { /* no-op */ });
      }
    } catch {
      // no-op
    }
  }, []);

  // connected になったら開始
  useEffect(() => {
    if (!connected || !hostUserId || isHost) return;
    if (watchSessionIdRef.current) return; // 既にトラッキング中

    void fetch("/api/watch-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", hostUserId, streamSessionId }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { watchSessionId?: string | null };
        if (data.watchSessionId) watchSessionIdRef.current = data.watchSessionId;
      })
      .catch(() => { /* no-op */ });
  }, [connected, hostUserId, streamSessionId, isHost]);

  // 切断されたら終了
  useEffect(() => {
    if (!connected) endSession();
  }, [connected, endSession]);

  // アンマウント時に終了
  useEffect(() => {
    return () => endSession();
  }, [endSession]);
}
