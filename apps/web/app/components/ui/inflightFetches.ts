/**
 * いま飛んでいる fetch の数を数える係。
 *
 * ページ遷移の演出は「URL が変わった」だけでは抜けられない。App Router は
 * 行き先のページを描いた瞬間に URL を変えるが、ほとんどのページはそこから
 * useEffect で API を叩いて中身を取りに行くので、URL が変わった時点では
 * まだ中身が空のことが多い。そこで「飛んでいる fetch が 0 になった」ことも
 * 抜ける合図に使う。Next 自身の RSC 取得も fetch なので一緒に数えられる。
 *
 * window.fetch を一度だけ包み、開始で +1、終了（成功・失敗とも）で -1 する。
 * 挙動（引数・戻り値・例外）は元の fetch のまま変えない。
 */

type Listener = (count: number) => void;

let inflight = 0;
let installed = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(inflight));
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = (...args: Parameters<typeof fetch>) => {
    const init = args[1];
    // ページ離脱時に投げっぱなしにする送信（keepalive）は待たない
    if (init?.keepalive) return original(...args);
    inflight += 1;
    notify();
    return original(...args).finally(() => {
      inflight = Math.max(0, inflight - 1);
      notify();
    });
  };
}

export function getInflightFetchCount() {
  install();
  return inflight;
}

export function subscribeInflightFetches(listener: Listener) {
  install();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
