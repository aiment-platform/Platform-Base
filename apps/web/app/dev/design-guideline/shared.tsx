"use client";

/**
 * ガイドラインの各バージョンで共通に使う見本部品。
 * 色見本の表、ルールの箇条書き、配信枠カード・遷移演出の実物見本など。
 */
import { useEffect, useState } from "react";
import { StreamSessionCard } from "../../components/home/StreamSessionCard";
import { BrandTransition } from "../../components/ui/BrandTransition";
import { Button } from "../../components/ui/Button";

export type Swatch = {
  name: string;
  hex: string;
  token: string;
  use: string;
  ink?: string;
};

export type SwatchGroup = {
  title: string;
  items: Swatch[];
};


export const CARD_SAMPLE = {
  title: "タイトルタイトルタイトルタイトル",
  channelName: "チャンネル名",
  thumbnail: "/image/thumbnail/placeholder.svg",
  startsAt: "2026-06-14T16:00:00+09:00",
  slotsLeft: 2,
  slotsTotal: 5,
  japaneseLevel: 3,
};

export function SwatchTable({ groups }: { groups: SwatchGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">{group.title}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <div key={item.token + item.hex} className="ui-card-subtle flex items-center gap-3 p-2.5">
                <span
                  className="h-11 w-11 shrink-0 rounded-[var(--ui-radius-sm)] ring-1 ring-black/5"
                  style={{ background: item.hex }}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold">{item.name}</span>
                    <span className="font-mono text-xs text-[var(--brand-text-muted)]">{item.hex}</span>
                  </span>
                  <span className="block truncate text-[11px] text-[var(--brand-text-muted)]">{item.token}</span>
                  <span className="block truncate text-[11px] text-[var(--brand-text-muted)]">{item.use}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionNote({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3 rounded-[var(--ui-radius-sm)] bg-[var(--brand-bg-900)] p-3 text-xs leading-6 text-[var(--brand-text-muted)]">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function FullscreenTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    // demo は 入り→滞空→抜け でちょうど1周。抜けきってから畳む。
    const timer = window.setTimeout(onDone, 5600);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden" onClick={onDone} role="presentation">
      <BrandTransition phase="demo" />
    </div>
  );
}

export function TransitionShowcase() {
  const [replayKey, setReplayKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="h-[340px] overflow-hidden rounded-[var(--ui-radius-lg)]">
        <BrandTransition key={replayKey} inline phase="demo" />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setReplayKey((value) => value + 1)}>
          頭から再生
        </Button>
        <Button variant="primary" onClick={() => setFullscreen(true)}>
          全画面で確認
        </Button>
      </div>
      {fullscreen ? <FullscreenTransition onDone={() => setFullscreen(false)} /> : null}
    </>
  );
}

export function CardShowcase() {
  const noop = () => {};
  return (
    <div className="flex flex-wrap gap-8">
      <div className="w-[280px] shrink-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">default</p>
        <StreamSessionCard {...CARD_SAMPLE} onOpen={noop} onOpenChannel={noop} />
      </div>
      <div className="card-hover-preview w-[280px] shrink-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">hover</p>
        <StreamSessionCard {...CARD_SAMPLE} onOpen={noop} onOpenChannel={noop} />
      </div>
    </div>
  );
}
