"use client";

import type { CSSProperties } from "react";
import { getAjlInfo } from "../../lib/ajl";

type StreamSessionCardProps = {
  title: string;
  channelName: string;
  thumbnail: string;
  startsAt: string;
  slotsLeft: number;
  slotsTotal: number;
  japaneseLevel?: number;
  hostAvatarUrl?: string;
  onOpen: () => void;
  onOpenChannel?: () => void;
};

function formatCardStartTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function StreamSessionCard({
  title,
  channelName,
  thumbnail,
  startsAt,
  slotsLeft,
  slotsTotal,
  japaneseLevel,
  hostAvatarUrl,
  onOpen,
  onOpenChannel,
}: StreamSessionCardProps) {
  const ajl = getAjlInfo(japaneseLevel);
  const progress = `${Math.min(100, Math.max(12, ajl.level * 11))}%`;
  const initial = (channelName || title || "A").slice(0, 1).toUpperCase();

  return (
    <div
      className="aiment-session-card group text-left"
      style={{ "--ajl-progress": progress } as CSSProperties & Record<"--ajl-progress", string>}
    >
      <button type="button" onClick={onOpen} className="aiment-session-card__hitbox">
        <span className="aiment-session-card__media-shell">
          <span className="aiment-session-card__frame" aria-hidden />
          <span className="aiment-session-card__level">{ajl.level}</span>
          <span className="aiment-session-card__progress" aria-hidden>
            <span className="aiment-session-card__progress-fill" />
          </span>
          <span className="aiment-session-card__hover-meta">
            <span className="aiment-session-card__ajl-label">{ajl.label}</span>
            <span className="aiment-session-card__spots">{slotsLeft}/{slotsTotal} left</span>
          </span>
          <span className="aiment-session-card__detail">detail</span>
          <span className="aiment-session-card__image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt={title} />
            <span className="aiment-session-card__time">{formatCardStartTime(startsAt)}</span>
          </span>
        </span>
      </button>
      <span className="aiment-session-card__body">
        <button
          type="button"
          onClick={onOpenChannel ?? onOpen}
          className="aiment-session-card__avatar"
          aria-label={`${channelName} channel`}
        >
          {hostAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hostAvatarUrl} alt={channelName} />
          ) : (
            initial
          )}
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <span className="aiment-session-card__title">{title}</span>
          <span className="aiment-session-card__channel">{channelName}</span>
        </button>
      </span>
    </div>
  );
}
