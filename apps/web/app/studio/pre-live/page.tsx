"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { StudioProgress } from "../../components/ui/StudioProgress";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { AJL_LEVELS, getAjlInfo } from "../../lib/ajl";
import type { SubscriptionPlan } from "../../lib/apiTypes";
import { useI18n } from "../../lib/i18n";
import { createStreamSession } from "../../lib/streamSessions";
import { useUserSession } from "../../lib/userSession";

const PRESET_THUMBNAILS = [1, 2, 3, 4, 5].map((n) => `/image/thumbnail/thumbnail_${n}.png`);
const DEFAULT_THUMBNAIL = PRESET_THUMBNAILS[4];

type NoticeItem = {
  id: string;
  text: string;
};

function localNow30min() {
  const target = new Date(Date.now() + 30 * 60 * 1000);
  const local = new Date(target.getTime() - target.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function StudioPreLivePage() {
  const router = useRouter();
  const { tx } = useI18n();
  const { isVtuber, hydrated } = useUserSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [publishMode, setPublishMode] = useState<"scheduled" | "go_live_now">("go_live_now");
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(localNow30min);
  const [startWarnings, setStartWarnings] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState(DEFAULT_THUMBNAIL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [participantSlotsTotal, setParticipantSlotsTotal] = useState(5);
  const [speakerRequiredPlan] = useState<SubscriptionPlan>("free");
  const [plannedDurationMin, setPlannedDurationMin] = useState(60);
  const [japaneseLevel, setJapaneseLevel] = useState(3);
  const [chatInput, setChatInput] = useState("");
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isVtuber) router.replace("/");
  }, [hydrated, isVtuber, router]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStartWarnings([tx("画像ファイルを選択してください。", "Please select an image file.")]);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setStartWarnings([tx("画像サイズは4MB以下にしてください。", "Image size must be 4MB or less.")]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) setThumbnail(result);
    };
    reader.onerror = () => {
      setStartWarnings([tx("画像の読み込みに失敗しました。", "Failed to load image.")]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendNotice = () => {
    const text = chatInput.trim();
    if (!text) return;
    setNotices((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setChatInput("");
  };

  const startBroadcastFlow = async () => {
    setShowPublishMenu(false);
    const warnings: string[] = [];
    if (title.trim().length < 2) warnings.push(tx("タイトルを入力してください。", "Please enter a title."));
    if (publishMode === "scheduled") {
      const parsed = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(parsed.getTime())) {
        warnings.push(tx("予約開始時刻を指定してください。", "Set a scheduled start time."));
      } else if (parsed.getTime() <= Date.now() + 60 * 1000) {
        warnings.push(tx("予約時刻は1分以上先を指定してください。", "Scheduled time must be at least 1 minute in the future."));
      }
    }

    setStartWarnings(warnings);
    if (warnings.length > 0 || creating) return;

    setCreating(true);

    const startsAt =
      publishMode === "scheduled" && scheduledAt
        ? new Date(scheduledAt).toISOString()
        : new Date().toISOString();

    const plannedDuration = Number.isNaN(plannedDurationMin) || plannedDurationMin < 1 ? 60 : plannedDurationMin;
    const participantSlots = Number.isNaN(participantSlotsTotal) || participantSlotsTotal < 1 ? 5 : Math.floor(participantSlotsTotal);

    try {
      const created = await createStreamSession({
        title: title.trim(),
        category: "英語",
        description: description.trim(),
        thumbnail,
        startsAt,
        participationType: "First-come",
        slotsTotal: participantSlots,
        speakerSlotsTotal: participantSlots,
        speakerRequiredPlan,
        plannedDurationMin: plannedDuration,
        japaneseLevel,
      });

      if (publishMode === "go_live_now") {
        router.push(`/studio/live/${encodeURIComponent(created.sessionId)}?autostart=1`);
        return;
      }
      router.push(`/studio/live/${encodeURIComponent(created.sessionId)}`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "";
      if (message.includes("VTuber registration requires verified phone")) {
        setStartWarnings([
          tx(
            "電話番号認証が未完了です。アカウント設定で電話番号を認証してから配信枠を作成してください。",
            "Phone verification is required. Verify your phone in account settings before creating a stream.",
          ),
        ]);
      } else {
        setStartWarnings([tx("配信枠の作成に失敗しました。時間をおいて再試行してください。", "Failed to create stream session. Please retry.")]);
      }
      setCreating(false);
    }
  };

  if (!hydrated || !isVtuber) return null;

  return (
    <div className="h-screen overflow-hidden bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav mode="studio" />

      <main className="mx-auto grid h-[calc(100vh-72px)] max-w-[1440px] grid-cols-[1fr_320px] gap-4 overflow-hidden px-4 py-3 lg:grid-cols-[58px_1fr_360px] lg:px-6">
        <aside className="hidden lg:block">
          <StudioProgress current="prelive" orientation="vertical" />
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden">
          {/* Header + action */}
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Pre-Live Setup</h1>
              <p className="text-xs text-[var(--brand-text-muted)]">{tx("配信前の設定を行ってください。", "Set up your stream before going live.")}</p>
            </div>
            <div className="relative flex items-center">
              <button
                onClick={() => void startBroadcastFlow()}
                disabled={creating}
                className="rounded-l-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(124,106,230,0.45)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? tx("作成中...", "Creating...")
                  : publishMode === "go_live_now"
                    ? tx("作成して開始", "Create & Start")
                    : tx("予約枠を作成", "Create Scheduled Stream")}
              </button>
              <button
                type="button"
                onClick={() => setShowPublishMenu((v) => !v)}
                className="rounded-r-xl border-l border-black/20 bg-[var(--brand-primary)] px-3 py-2.5 text-sm font-black text-white shadow-[0_10px_26px_rgba(124,106,230,0.45)]"
                aria-label={tx("配信モードを選択", "Select publish mode")}
              >
                ▾
              </button>
              {showPublishMenu && (
                <div className="absolute right-0 top-[44px] z-20 w-[220px] rounded-xl bg-[var(--brand-surface)] p-2 shadow-xl shadow-black/40">
                  <button
                    type="button"
                    onClick={() => { setPublishMode("go_live_now"); setShowPublishMenu(false); }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${publishMode === "go_live_now" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-text)] hover:bg-[var(--brand-bg-900)]"}`}
                  >
                    {tx("今すぐ開始", "Start now")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPublishMode("scheduled"); setShowPublishMenu(false); }}
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-sm ${publishMode === "scheduled" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-text)] hover:bg-[var(--brand-bg-900)]"}`}
                  >
                    {tx("予約配信", "Schedule stream")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {startWarnings.length > 0 && (
            <div className="mb-2 rounded-xl bg-[var(--brand-accent)]/15 p-2.5 text-xs text-[var(--brand-accent)]">
              {startWarnings.map((w) => <p key={w}>{w}</p>)}
            </div>
          )}

          <section className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-[var(--brand-surface)] p-3 shadow-lg shadow-black/25">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-[var(--brand-text-muted)]">{tx("配信設定", "Stream Settings")}</h2>
            <div className="h-full overflow-y-auto pr-1">
              <div className="rounded-xl bg-[var(--brand-bg-900)]/28 p-3">
                <div className="grid auto-rows-max content-start gap-3 pb-3 lg:grid-cols-2">

                  {/* サムネイル */}
                  <div className="lg:col-span-2">
                    <p className="mb-2 text-xs font-semibold text-[var(--brand-text-muted)]">{tx("サムネイル", "Thumbnail")}</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_THUMBNAILS.map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setThumbnail(src)}
                          className={`relative h-16 w-28 overflow-hidden rounded-lg border-2 transition ${
                            thumbnail === src ? "border-[var(--brand-primary)]" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative h-16 w-28 overflow-hidden rounded-lg border-2 transition ${
                          !PRESET_THUMBNAILS.includes(thumbnail) ? "border-[var(--brand-primary)]" : "border-dashed border-[var(--brand-surface-soft)] hover:border-[var(--brand-primary)]"
                        }`}
                      >
                        {!PRESET_THUMBNAILS.includes(thumbnail) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--brand-text-muted)]">
                            <span className="text-xl">+</span>
                            <span className="text-[10px]">{tx("アップロード", "Upload")}</span>
                          </span>
                        )}
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void handleThumbnailUpload(e)}
                    />
                  </div>

                  {/* タイトル */}
                  <label className="grid gap-1 text-sm">
                    <span className="text-[var(--brand-text-muted)]">{tx("タイトル", "Title")}</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-[var(--brand-text)] outline-none" />
                  </label>

                  {/* 開始日時（予約のときのみ） */}
                  {publishMode === "scheduled" && (
                    <div className="grid gap-1 text-sm lg:col-span-2">
                      <span className="text-[var(--brand-text-muted)]">{tx("開始日時", "Scheduled start")}</span>
                      <DateTimePicker
                        value={scheduledAt}
                        onChange={setScheduledAt}
                        minDate={new Date()}
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 lg:col-span-2">
                    <p className="mb-2 text-[11px] font-semibold text-[var(--brand-text-muted)]">{tx("配信詳細設定", "Session Details")}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs">
                        <span className="text-[var(--brand-text-muted)]">{tx("参加者枠数", "Participant spots")}</span>
                        <div className="flex items-center gap-2 rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={participantSlotsTotal}
                            onChange={(e) => setParticipantSlotsTotal(Number(e.target.value))}
                            className="w-full bg-transparent text-[var(--brand-text)] outline-none"
                          />
                          <span className="shrink-0 text-[10px] text-[var(--brand-text-muted)]">{tx("枠", "spots")}</span>
                        </div>
                      </label>
                      <label className="grid gap-1 text-xs">
                        <span className="text-[var(--brand-text-muted)]">{tx("配信予定時間", "Planned duration")}</span>
                        <select
                          value={plannedDurationMin}
                          onChange={(e) => setPlannedDurationMin(Number(e.target.value))}
                          className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5 text-[var(--brand-text)] outline-none"
                        >
                          <option value={30}>30 {tx("分", "min")} — ₱200</option>
                          <option value={45}>45 {tx("分", "min")} — ₱200</option>
                          <option value={60}>60 {tx("分", "min")} — ₱200</option>
                          <option value={90}>90 {tx("分", "min")} — ₱400</option>
                          <option value={120}>120 {tx("分", "min")} — ₱400</option>
                        </select>
                      </label>
                      <div className="grid gap-1 text-xs sm:col-span-2">
                        <span className="text-[var(--brand-text-muted)]">AJL - aiment Japanese Level</span>
                        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                          {AJL_LEVELS.map((level) => (
                            <button
                              key={level.level}
                              type="button"
                              onClick={() => setJapaneseLevel(level.level)}
                              className={`rounded-lg px-2 py-2 text-left transition-colors ${
                                japaneseLevel === level.level
                                  ? "bg-[var(--brand-primary)] text-white"
                                  : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                              }`}
                            >
                              <span className="block text-xs font-black">AJL {level.level}</span>
                              <span className="mt-0.5 block text-[10px] font-semibold">JF {level.jfStandard} / {level.label}</span>
                            </button>
                          ))}
                        </div>
                        <p className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5 text-[10px] leading-relaxed text-[var(--brand-text-muted)]">
                          {getAjlInfo(japaneseLevel).description}
                        </p>
                      </div>
                    </div>
                  </div>


                  <label className="grid gap-1 text-sm lg:col-span-2">
                    <span className="text-[var(--brand-text-muted)]">{tx("概要", "Description")}</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="min-h-[120px] resize-none rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-[var(--brand-text)] outline-none"
                    />
                  </label>

                </div>
              </div>
            </div>
          </section>
        </section>

        {/* Chat preview */}
        <aside className="flex min-h-0 flex-col overflow-hidden">
          <section className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl bg-[var(--brand-surface)] shadow-lg shadow-black/25">
            <div className="border-b border-black/20 px-3 py-2">
              <p className="text-sm font-semibold">{tx("ライブチャット", "Live Chat")}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {notices.length === 0 ? (
                <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center rounded-xl bg-[var(--brand-bg-900)] px-6 text-center">
                  <p className="text-sm font-semibold text-[var(--brand-text)]">{tx("事前連絡を送れます", "You can send pre-live notices")}</p>
                  <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
                    {tx("視聴者からのコメントはまだ届きません。配信前の案内だけここに残せます。", "Viewer messages do not arrive yet. You can leave pre-live announcements here.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notices.map((notice) => (
                    <div key={notice.id} className="ml-6 rounded-lg bg-[var(--brand-primary)]/20 px-3 py-2">
                      <p className="mb-1 text-[11px] font-semibold text-[var(--brand-primary)]">host</p>
                      <p className="text-sm text-[var(--brand-text)]">{notice.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-black/20 px-3 py-3">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
                    e.preventDefault();
                    sendNotice();
                  }}
                  placeholder={tx("事前連絡を入力", "Type a pre-live notice")}
                  className="flex-1 rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]"
                />
                <button onClick={sendNotice} className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">
                  {tx("送信", "Send")}
                </button>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
