"use client";

/**
 * チャンネルページの上の帯。
 * 紫の帯に水玉を散らし、大きなアイコン・名前・紹介文・数字の札を載せる。
 * アイコン・名前・札には、ボタンと同じ「真下に濃い色の厚み」を付けて、0.4 の立体感にそろえる。
 * ヘッダー画像があるときは、帯の上に細長く出す（名前を画像に重ねると読みにくくなるため）。
 */
import { ChannelMenu } from "./ChannelMenu";

type ChannelHeroProps = {
  channelName: string;
  userId: string;
  bio?: string;
  avatarUrl?: string;
  headerUrl?: string;
  liveCount?: number;
  upcomingCount?: number;
  archiveCount?: number;
  /** 配信枠の AJL の幅。名前の上に「AJL 1〜3 が得意」の札を出す */
  levelRange?: { min: number; max: number } | null;
  basePath: string;
  active: "overview" | "schedule";
  labels?: {
    upcoming: string;
    archive: string;
    noBio: string;
    levelTag?: (range: string) => string;
  };
};

/** 帯の水玉。白を薄く、小さく並べる */
const DOTS = "radial-gradient(rgba(255, 255, 255, 0.16) 1.5px, transparent 1.6px) 0 0 / 22px 22px";

export function ChannelHero({
  channelName,
  userId,
  bio,
  avatarUrl,
  headerUrl,
  liveCount,
  upcomingCount,
  archiveCount,
  levelRange,
  basePath,
  active,
  labels,
}: ChannelHeroProps) {
  const displayBio = bio?.trim();

  const stats = [
    { label: "LIVE", value: liveCount, live: true },
    { label: labels?.upcoming ?? "Upcoming", value: upcomingCount, live: false },
    { label: labels?.archive ?? "Archive", value: archiveCount, live: false },
  ];
  const showStats = stats.some((stat) => typeof stat.value === "number");
  const range = levelRange ? (levelRange.min === levelRange.max ? `${levelRange.min}` : `${levelRange.min}〜${levelRange.max}`) : null;

  return (
    <section className="w-full">
      {headerUrl ? (
        <div className="h-28 w-full overflow-hidden bg-[var(--brand-primary-soft)] sm:h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={headerUrl} alt={`${channelName} header`} className="h-full w-full object-cover" />
        </div>
      ) : null}

      {/* 帯の下端に、濃い紫の線を1本引いて「厚み」に見せる */}
      <div className="border-b-[6px] border-[var(--brand-primary-dark)] bg-[var(--brand-primary)] text-white" style={{ background: `${DOTS}, var(--brand-primary)` }}>
        <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 lg:contents">
            {/* アイコン：白い太い縁と、真下の厚み */}
            <div
              className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-[6px] border-white bg-[var(--brand-primary-light)] sm:h-36 sm:w-36 sm:border-8 lg:row-span-2"
              style={{ boxShadow: "0 6px 0 0 var(--brand-primary-dark)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={channelName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-4xl font-black text-white sm:text-5xl">{channelName.slice(0, 1).toUpperCase()}</div>
              )}
            </div>

            <div className="min-w-0">
              {range && labels?.levelTag ? (
                <span
                  className="mb-2 inline-block -rotate-2 rounded-full bg-[var(--lime,#d9ff4a)] px-3 py-1 text-xs font-black text-[var(--brand-text)] sm:text-sm"
                  style={{ boxShadow: "0 3px 0 0 var(--lime-dark, #a8d417)" }}
                >
                  {labels.levelTag(range)}
                </span>
              ) : null}
              {/* 名前は大きく。真下に濃い紫の影を落として、帯から浮かせる */}
              <h1
                className="break-words text-3xl font-black leading-tight sm:text-5xl"
                style={{ textShadow: "0 4px 0 var(--brand-primary-dark)" }}
              >
                {channelName}
              </h1>
              <p className="mt-1 truncate text-xs font-bold text-white/70">@{userId}</p>
            </div>
          </div>

          {/* 紹介文は、PC では名前の下（真ん中の列）、スマホでは名前のブロックの下に全幅で */}
          <p className="max-w-3xl text-sm font-bold leading-relaxed text-white/90 lg:col-start-2 lg:row-start-2 lg:-mt-4">
            {displayBio || labels?.noBio || "No bio yet."}
          </p>

          {showStats ? (
            <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:flex">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-[84px] flex-col-reverse items-center rounded-2xl bg-white px-3 py-3 text-center sm:px-5"
                  style={{ boxShadow: "0 4px 0 0 var(--brand-primary-dark)" }}
                >
                  <dt className="mt-1 text-[11px] font-black text-[var(--brand-text-muted)]">{stat.label}</dt>
                  <dd
                    className="text-2xl font-black leading-none sm:text-3xl"
                    style={{ color: stat.live && (stat.value ?? 0) > 0 ? "var(--brand-accent)" : "var(--brand-primary)" }}
                  >
                    {stat.value ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <ChannelMenu basePath={basePath} active={active} />
      </div>
    </section>
  );
}
