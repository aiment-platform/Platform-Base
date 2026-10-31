"use client";

/**
 * /dev/design-guideline — デザインルールの見本帳。
 *
 *   GuidelineV031.tsx   … 現行（ver0.31）。新しい画面はこれに従う
 *   GuidelineLegacy.tsx … 旧版（ver0.3 / ver0.2）。参考として残しているだけ
 *   Moodboard.tsx       … ブランドの方向性を比べるムードボード（未決定の案）
 *   shared.tsx          … 両方で使う見本部品
 *
 * どのタブを開いているかは URL のハッシュ（#ver0.31 など）に持たせる。
 * そのまま共有・ブックマークできる。
 */
import { useSyncExternalStore } from "react";
import { TopNav } from "../../components/home/TopNav";
import { GuidelineV02Legacy, GuidelineV03Legacy } from "./GuidelineLegacy";
import { GuidelineV031 } from "./GuidelineV031";
import { Moodboard } from "./Moodboard";

const VERSIONS = [
  { id: "0.31", label: "ver0.31（現行）" },
  { id: "0.3", label: "ver0.3（旧）" },
  { id: "0.2", label: "ver0.2（旧）" },
  { id: "mood", label: "ムードボード" },
] as const;

type UiVersion = (typeof VERSIONS)[number]["id"];

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readVersionFromHash(): UiVersion {
  const hash = window.location.hash.replace("#ver", "");
  return VERSIONS.find((version) => version.id === hash)?.id ?? "0.31";
}

function serverVersion(): UiVersion {
  return "0.31";
}

export default function DesignGuidelinePage() {
  const version = useSyncExternalStore(subscribeToHash, readVersionFromHash, serverVersion);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />

      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-bold text-[var(--brand-text-muted)]">Developer Page</p>
          <h1 className="mt-1 text-2xl font-bold">Design Guideline</h1>
          <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-[var(--brand-text-muted)]">
            色・文字・角丸・ボタン・面・配信枠カードのルールと実物の見本。新しい画面は現行（ver0.31）に従う。
          </p>

          <div className="ui-segment mt-5" role="group" aria-label="バージョン">
            {VERSIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                // assign() で hashchange を起こし、useSyncExternalStore に読み直させる
                onClick={() => window.location.assign(`#ver${item.id}`)}
                aria-pressed={item.id === version}
                className="ui-segment__option px-4 text-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {version === "0.31" ? <GuidelineV031 /> : null}
        {version === "0.3" ? <GuidelineV03Legacy /> : null}
        {version === "0.2" ? <GuidelineV02Legacy /> : null}
        {version === "mood" ? <Moodboard /> : null}
      </main>
    </div>
  );
}
