"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { StudioProgress } from "../../components/ui/StudioProgress";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { AjlLevelPicker } from "../components/AjlLevelPicker";
import type { SubscriptionPlan } from "../../lib/apiTypes";
import { useI18n } from "../../lib/i18n";
import { createStreamSession } from "../../lib/streamSessions";
import { uploadImageToR2 } from "../../lib/uploadImage";
import { PLACEHOLDER_THUMBNAIL } from "../../lib/thumbnail";
import { useUserSession } from "../../lib/userSession";
import { useRouteTransition } from "../../components/ui/RouteTransition";
import { SPEAKER_FEE_ENABLED } from "@/lib/speakerFee";

type NoticeItem = {
  id: string;
  text: string;
  deletedAt?: string;
};

function localNow30min() {
  const target = new Date(Date.now() + 30 * 60 * 1000);
  const local = new Date(target.getTime() - target.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function StudioPreLivePage() {
  const router = useRouter();
  const { navigate } = useRouteTransition();
  const { tx } = useI18n();
  const { isVtuber, hydrated } = useUserSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [publishMode, setPublishMode] = useState<"scheduled" | "go_live_now">("go_live_now");
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(localNow30min);
  const [startWarnings, setStartWarnings] = useState<string[]>([]);
  // 空のままなら、表示側で aiment のプレースホルダー画像になる（lib/thumbnail.ts）
  const [thumbnail, setThumbnail] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
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

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStartWarnings([tx("画像ファイルを選択してください。", "Please select an image file.")]);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setStartWarnings([tx("画像サイズは4MB以下にしてください。", "Image size must be 4MB or less.")]);
      return;
    }
    setUploadingThumbnail(true);
    setStartWarnings([]);
    try {
      const url = await uploadImageToR2(file, "thumbnails");
      setThumbnail(url);
    } catch {
      setStartWarnings([tx("画像のアップロードに失敗しました。", "Failed to upload image.")]);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const sendNotice = () => {
    const text = chatInput.trim();
    if (!text) return;
    setNotices((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setChatInput("");
  };

  const retractNotice = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((notice) =>
        notice.id === noticeId && !notice.deletedAt
          ? { ...notice, deletedAt: new Date().toISOString() }
          : notice,
      ),
    );
  };

  const startBroadcastFlow = async () => {
    setShowPublishMenu(false);
    const warnings: string[] = [];
    if (uploadingThumbnail) warnings.push(tx("画像のアップロード完了をお待ちください。", "Please wait for the image upload to finish."));
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

      // マイク/カメラはブラウザで使わない（映像も音声も OBS から）ので、渡すのは自動開始の印だけ
      const query = publishMode === "go_live_now" ? "?autostart=1" : "";
      navigate(`/studio/live/${encodeURIComponent(created.sessionId)}${query}`);
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
    // md 以上は画面の高さに収めて各カラムの中だけスクロールする（PC の配信画面）。
    // スマホでは2カラムに収まらないので、ページ全体を縦にスクロールさせる。
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)] md:h-screen md:overflow-hidden">
      <TopNav mode="studio" />

      <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-4 py-3 md:h-[calc(100vh-72px)] md:grid-cols-[1fr_320px] md:overflow-hidden lg:grid-cols-[58px_1fr_360px] lg:px-6">
        <aside className="hidden lg:block">
          <StudioProgress current="prelive" orientation="vertical" />
        </aside>

        <section className="flex min-h-0 flex-col md:overflow-hidden">
          {/* 縦のステップ表示は lg 以上の左レールにしか出ないので、それ未満では横並びで上に出す */}
          <div className="lg:hidden">
            <StudioProgress current="prelive" />
          </div>

          {/* Header + action */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold">Pre-Live Setup</h1>
              <p className="text-xs text-[var(--brand-text-muted)]">{tx("配信前の設定を行ってください。", "Set up your stream before going live.")}</p>
            </div>
            <div className="relative flex items-center">
              <div className="ui-btn-group">
              <button
                onClick={() => void startBroadcastFlow()}
                disabled={creating || uploadingThumbnail}
                className="ui-btn ui-btn-md ui-btn-primary"
              >
                {uploadingThumbnail
                  ? tx("画像アップロード中...", "Uploading image...")
                  : creating
                  ? tx("作成中...", "Creating...")
                  : publishMode === "go_live_now"
                    ? tx("作成して開始", "Create & Start")
                    : tx("予約枠を作成", "Create Scheduled Stream")}
              </button>
              <button
                type="button"
                onClick={() => setShowPublishMenu((v) => !v)}
                className="ui-btn ui-btn-md ui-btn-primary px-3"
                aria-label={tx("配信モードを選択", "Select publish mode")}
              >
                ▾
              </button>
              </div>
              {showPublishMenu && (
                <div className="ui-float absolute right-0 top-[52px] z-20 w-[min(220px,calc(100vw-32px))] rounded-xl bg-[var(--brand-surface)] p-2">
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
            <div className="mb-2 rounded-xl bg-[var(--brand-accent-soft)] p-2.5 text-xs text-[var(--brand-accent-ink)]">
              {startWarnings.map((w) => <p key={w}>{w}</p>)}
            </div>
          )}

          {/* 箱は白い面1枚だけ。以前は 面 > 薄い箱 > 詳細設定の箱 と3段に入れ子になっていた */}
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-[var(--brand-surface)] p-4 md:overflow-hidden md:p-3">
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-[var(--brand-text-muted)]">{tx("配信設定", "Stream Settings")}</h2>
            <div className="min-h-0 flex-1 md:overflow-y-auto md:pr-1">
              <div className="grid auto-rows-max content-start gap-4 pb-1 lg:grid-cols-2">

                {/* サムネイル */}
                <div className="lg:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-[var(--brand-text-muted)]">{tx("サムネイル", "Thumbnail")}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-[90px] w-40 overflow-hidden rounded-lg"
                      aria-label={tx("サムネイルをアップロード", "Upload thumbnail")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnail || PLACEHOLDER_THUMBNAIL} alt="" className="h-full w-full object-cover" />
                    </button>
                    <div className="grid gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingThumbnail}
                        className="ui-btn ui-btn-sm ui-btn-ghost"
                      >
                        {uploadingThumbnail
                          ? tx("アップロード中...", "Uploading...")
                          : thumbnail
                            ? tx("画像を変更", "Change image")
                            : tx("画像をアップロード", "Upload image")}
                      </button>
                      {thumbnail ? (
                        <button
                          type="button"
                          onClick={() => setThumbnail("")}
                          className="text-left text-[11px] font-semibold text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                        >
                          {tx("画像を外す", "Remove image")}
                        </button>
                      ) : (
                        <p className="text-[11px] text-[var(--brand-text-muted)]">
                          {tx("未設定ならaimentの標準画像になります", "Leave empty to use the aiment default")}
                        </p>
                      )}
                    </div>
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
                <label className="grid gap-1 text-sm lg:col-span-2">
                  <span className="text-[var(--brand-text-muted)]">{tx("タイトル", "Title")}</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="ui-input" />
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

                <div className="grid gap-4 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-sm">
                      <span className="text-[var(--brand-text-muted)]">{tx("参加者枠数", "Participant spots")}</span>
                      <div className="flex h-10 items-center gap-2 rounded-[var(--ui-radius-sm)] bg-[var(--brand-bg-900)] px-3">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={participantSlotsTotal}
                          onChange={(e) => setParticipantSlotsTotal(Number(e.target.value))}
                          className="w-full bg-transparent text-[var(--brand-text)] outline-none"
                        />
                        <span className="shrink-0 text-[11px] text-[var(--brand-text-muted)]">{tx("枠", "spots")}</span>
                      </div>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="text-[var(--brand-text-muted)]">{tx("配信予定時間", "Planned duration")}</span>
                      <select
                        value={plannedDurationMin}
                        onChange={(e) => setPlannedDurationMin(Number(e.target.value))}
                        className="ui-select"
                      >
                        {[30, 45, 60, 90, 120].map((min) => (
                          <option key={min} value={min}>
                            {min} {tx("分", "min")}
                            {SPEAKER_FEE_ENABLED ? ` — ₱${min <= 60 ? 200 : 400}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <AjlLevelPicker id="prelive-level-help" value={japaneseLevel} onChange={setJapaneseLevel} />
                </div>

                <label className="grid gap-1 text-sm lg:col-span-2">
                  <span className="text-[var(--brand-text-muted)]">{tx("概要", "Description")}</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="ui-textarea min-h-[120px]"
                  />
                </label>

              </div>
            </div>
          </section>
        </section>

        {/* Chat preview */}
        {/* スマホでは設定の下に置く。配信前は案内を残すだけなので、画面の半分を取らないよう高さを抑える */}
        <aside className="flex min-h-0 flex-col md:overflow-hidden">
          <section className="flex h-[300px] flex-col overflow-hidden rounded-2xl bg-[var(--brand-surface)] md:h-full md:min-h-[220px]">
            <div className="border-b border-[var(--line)] px-3 py-2">
              <p className="text-sm font-semibold">{tx("ライブチャット", "Live Chat")}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {notices.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-[var(--brand-bg-900)] px-6 text-center md:min-h-[240px]">
                  <p className="text-sm font-semibold text-[var(--brand-text)]">{tx("事前連絡を送れます", "You can send pre-live notices")}</p>
                  <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
                    {tx("視聴者からのコメントはまだ届きません。配信前の案内だけここに残せます。", "Viewer messages do not arrive yet. You can leave pre-live announcements here.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notices.map((notice) => (
                    <div key={notice.id} className="ml-6 rounded-lg bg-[var(--brand-primary)]/20 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-[var(--brand-primary)]">host</p>
                        {!notice.deletedAt ? (
                          <button
                            type="button"
                            onClick={() => retractNotice(notice.id)}
                            className="rounded-full bg-[var(--brand-bg-900)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-text-muted)] ring-1 ring-black/5 hover:text-[var(--brand-accent-ink)]"
                          >
                            {tx("取消", "Undo")}
                          </button>
                        ) : null}
                      </div>
                      {notice.deletedAt ? (
                        <p className="text-sm italic text-[var(--brand-text-muted)]">
                          {tx("このコメントは取り消されました。", "This comment was retracted.")}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--brand-text)]">{notice.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-[var(--line)] px-3 py-3">
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
                  className="min-w-0 flex-1 rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]"
                />
                <button onClick={sendNotice} className="ui-btn ui-btn-sm ui-btn-primary">
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
