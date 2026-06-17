"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { TopNav } from "../../../../components/home/TopNav";
import { AJL_LEVELS, getAjlInfo } from "../../../../lib/ajl";
import type { Reservation, SubscriptionPlan } from "../../../../lib/apiTypes";
import { useI18n } from "../../../../lib/i18n";
import { useUserSession } from "../../../../lib/userSession";
import { uploadImageToR2 } from "../../../../lib/uploadImage";
import {
  deleteStreamSession,
  getStreamSession,
  updateStreamSession,
  type StreamSession,
} from "../../../../lib/streamSessions";

const CATEGORY_OPTIONS = ["雑談", "ゲーム", "歌枠", "英語"] as const;

type Tab = "settings" | "reservations";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ISO文字列を datetime-local 入力用のローカル時刻文字列(YYYY-MM-DDTHH:mm)に変換する。
function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SessionEditPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = decodeURIComponent(params.sessionId ?? "");
  const { tx } = useI18n();
  const { isVtuber, hydrated } = useUserSession();

  const [tab, setTab] = useState<Tab>("settings");
  const [session, setSession] = useState<StreamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>("雑談");
  const [slotsTotal, setSlotsTotal] = useState(5);
  const [speakerSlotsTotal, setSpeakerSlotsTotal] = useState(5);
  const [japaneseLevel, setJapaneseLevel] = useState(3);
  const [speakerRequiredPlan, setSpeakerRequiredPlan] = useState<SubscriptionPlan>("free");
  const [requiredPlan, setRequiredPlan] = useState<SubscriptionPlan>("free");
  const [reservationRequired, setReservationRequired] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resLoading, setResLoading] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getStreamSession(sessionId);
    if (!data) {
      setError(tx("枠が見つかりませんでした。", "Session not found."));
      setLoading(false);
      return;
    }
    if (data.status === "live") {
      setError(tx("配信中の枠は編集できません。", "Cannot edit a live session."));
      setLoading(false);
      return;
    }
    setSession(data);
    setTitle(data.title);
    setDescription(data.description ?? "");
    setThumbnail(data.thumbnail ?? "");
    setStartsAt(toLocalInput(data.startsAt ?? ""));
    setCategory(data.category ?? "雑談");
    setSlotsTotal(data.slotsTotal);
    setSpeakerSlotsTotal(data.speakerSlotsTotal);
    setJapaneseLevel(data.japaneseLevel ?? 3);
    setSpeakerRequiredPlan(data.speakerRequiredPlan ?? "free");
    setRequiredPlan(data.requiredPlan ?? "free");
    setReservationRequired(data.reservationRequired ?? false);
    setLoading(false);
  }

  async function loadReservations() {
    setResLoading(true);
    try {
      const res = await fetch(
        `/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations?asHost=1`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { reservations?: Reservation[] };
      setReservations(data.reservations ?? []);
    } catch {
      // keep existing
    } finally {
      setResLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated) return;
    if (!isVtuber) {
      router.replace("/");
      return;
    }
    void load();
  }, [hydrated, isVtuber, sessionId]);

  useEffect(() => {
    if (tab === "reservations" && session) void loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, session]);

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(tx("画像ファイルを選択してください。", "Please select an image file."));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError(tx("画像サイズは4MB以下にしてください。", "Image size must be 4MB or less."));
      return;
    }
    setUploadingThumbnail(true);
    setError(null);
    try {
      const url = await uploadImageToR2(file, "thumbnails");
      setThumbnail(url);
    } catch {
      setError(tx("画像のアップロードに失敗しました。", "Failed to upload image."));
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleDelete() {
    if (!session) return;
    if (!window.confirm(tx("この配信枠を削除しますか？この操作は取り消せません。", "Delete this session? This cannot be undone."))) {
      return;
    }
    setDeleting(true);
    setError(null);
    const ok = await deleteStreamSession(sessionId);
    if (!ok) {
      setDeleting(false);
      setError(tx("削除に失敗しました。", "Failed to delete."));
      return;
    }
    router.replace("/studio/sessions");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setError(null);
    setSuccess(false);

    if (title.trim().length < 2) {
      setError(tx("タイトルを入力してください。", "Please enter a title."));
      return;
    }
    if (uploadingThumbnail) {
      setError(tx("画像のアップロード完了をお待ちください。", "Please wait for the image upload to finish."));
      return;
    }

    setSaving(true);
    const updated = await updateStreamSession(sessionId, {
      title: title.trim(),
      description: description.trim(),
      thumbnail,
      startsAt: startsAt ? new Date(startsAt).toISOString() : session.startsAt,
      category,
      slotsTotal,
      speakerSlotsTotal,
      japaneseLevel,
      speakerRequiredPlan,
      requiredPlan,
      reservationRequired,
    });
    setSaving(false);

    if (!updated) {
      setError(tx("保存に失敗しました。", "Failed to save."));
      return;
    }

    setSession(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!hydrated || !isVtuber) return null;

  const speakerRes = reservations.filter((r) => r.type === "speaker" && r.status === "reserved");
  const listenerRes = reservations.filter((r) => r.type === "listener" && r.status === "reserved");

  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav mode="studio" />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/studio/sessions"
            className="inline-flex items-center gap-1 text-sm text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            <span>{tx("枠一覧", "My Sessions")}</span>
          </Link>
        </div>

        <h1 className="mb-4 text-2xl font-bold">{tx("配信枠を編集", "Edit Session")}</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-[var(--brand-surface)] p-1">
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === "settings" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"}`}
          >
            {tx("設定", "Settings")}
          </button>
          <button
            type="button"
            onClick={() => setTab("reservations")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === "reservations" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"}`}
          >
            {tx("予約者", "Reservations")}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--brand-text-muted)]">{tx("読み込み中...", "Loading...")}</div>
        ) : error && !session ? (
          <div className="rounded-xl bg-[var(--brand-accent)]/15 px-4 py-4 text-sm text-[var(--brand-accent)]">{error}</div>
        ) : tab === "settings" ? (
          <form onSubmit={handleSave} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-[var(--brand-accent)]/15 px-4 py-3 text-sm text-[var(--brand-accent)]">{error}</div>
            )}
            {success && (
              <div className="rounded-xl bg-green-500/15 px-4 py-3 text-sm text-green-400">{tx("保存しました。", "Saved.")}</div>
            )}

            <div className="grid gap-1.5 text-sm">
              <span className="text-[var(--brand-text-muted)]">{tx("サムネイル", "Thumbnail")}</span>
              <div className="flex items-center gap-4">
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-surface)]">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--brand-text-muted)]">
                      {tx("画像なし", "No image")}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                  className="rounded-xl bg-[var(--brand-surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {uploadingThumbnail ? tx("アップロード中...", "Uploading...") : tx("画像を変更", "Change image")}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void handleThumbnailUpload(e)}
                />
              </div>
            </div>

            <label className="grid gap-1.5 text-sm">
              <span className="text-[var(--brand-text-muted)]">{tx("タイトル", "Title")}</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="text-[var(--brand-text-muted)]">{tx("配信予定日時", "Scheduled time")}</span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="text-[var(--brand-text-muted)]">{tx("カテゴリ", "Category")}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="text-[var(--brand-text-muted)]">{tx("概要", "Description")}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--brand-text-muted)]">{tx("参加者枠数", "Participant spots")}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={slotsTotal}
                  onChange={(e) => setSlotsTotal(Math.max(1, Number(e.target.value)))}
                  className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--brand-text-muted)]">{tx("必要プラン", "Required Plan")}</span>
                <select
                  value={requiredPlan}
                  onChange={(e) => setRequiredPlan(e.target.value as SubscriptionPlan)}
                  className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                >
                  <option value="free">{tx("なし", "None (free)")}</option>
                  <option value="aimer">Aimer</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--brand-text-muted)]">{tx("スピーカー枠数", "Speaker spots")}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={speakerSlotsTotal}
                  onChange={(e) => setSpeakerSlotsTotal(Math.max(1, Number(e.target.value)))}
                  className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--brand-text-muted)]">{tx("スピーカー必要プラン", "Speaker Plan")}</span>
                <select
                  value={speakerRequiredPlan}
                  onChange={(e) => setSpeakerRequiredPlan(e.target.value as SubscriptionPlan)}
                  className="rounded-xl bg-[var(--brand-surface)] px-4 py-2.5 text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                >
                  <option value="free">{tx("なし", "None (free)")}</option>
                  <option value="aimer">Aimer</option>
                </select>
              </label>
            </div>

            <div className="grid gap-2 rounded-xl bg-[var(--brand-surface)] p-4 text-sm">
              <div>
                <p className="text-[var(--brand-text-muted)]">AJL - aiment Japanese Level</p>
                <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{getAjlInfo(japaneseLevel).description}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {AJL_LEVELS.map((level) => (
                  <button
                    key={level.level}
                    type="button"
                    onClick={() => setJapaneseLevel(level.level)}
                    className={`rounded-lg px-3 py-2 text-left transition-colors ${
                      japaneseLevel === level.level
                        ? "bg-[var(--brand-primary)] text-white"
                        : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                    }`}
                  >
                    <span className="block text-xs font-black">AJL {level.level}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold">JF {level.jfStandard} / {level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--brand-surface)] px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={reservationRequired}
                onChange={(e) => setReservationRequired(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              <span>{tx("事前予約必須", "Require prior reservation")}</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/studio/sessions"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
              >
                {tx("キャンセル", "Cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving || uploadingThumbnail}
                className="rounded-xl bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(124,106,230,0.4)] transition-all hover:brightness-110 disabled:opacity-50"
              >
                {saving ? tx("保存中...", "Saving...") : tx("保存する", "Save")}
              </button>
            </div>

            <div className="mt-8 border-t border-[var(--brand-surface)] pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">
                {tx("危険な操作", "Danger zone")}
              </p>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-xl border border-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-accent)] transition-colors hover:bg-[var(--brand-accent)]/10 disabled:opacity-50"
              >
                {deleting ? tx("削除中...", "Deleting...") : tx("この配信枠を削除", "Delete this session")}
              </button>
            </div>
          </form>
        ) : (
          /* Reservations tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--brand-text-muted)]">
                {tx("スピーカー", "Speakers")}: {speakerRes.length} / {tx("リスナー", "Listeners")}: {listenerRes.length}
              </p>
              <button
                type="button"
                onClick={() => void loadReservations()}
                disabled={resLoading}
                className="text-xs text-[var(--brand-primary)] hover:brightness-110 disabled:opacity-50"
              >
                {resLoading ? tx("更新中...", "Refreshing...") : tx("更新", "Refresh")}
              </button>
            </div>

            {resLoading && reservations.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--brand-text-muted)]">{tx("読み込み中...", "Loading...")}</div>
            ) : reservations.length === 0 ? (
              <div className="rounded-xl bg-[var(--brand-surface)] px-4 py-8 text-center text-sm text-[var(--brand-text-muted)]">
                {tx("予約者はまだいません。", "No reservations yet.")}
              </div>
            ) : (
              <div className="space-y-2">
                {speakerRes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">
                      {tx("スピーカー", "Speakers")}
                    </p>
                    <div className="space-y-1.5">
                      {speakerRes.map((r) => (
                        <ReservationRow key={r.reservationId} r={r} formatDate={formatDate} />
                      ))}
                    </div>
                  </div>
                )}
                {listenerRes.length > 0 && (
                  <div>
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">
                      {tx("リスナー", "Listeners")}
                    </p>
                    <div className="space-y-1.5">
                      {listenerRes.map((r) => (
                        <ReservationRow key={r.reservationId} r={r} formatDate={formatDate} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ReservationRow({ r, formatDate }: { r: Reservation; formatDate: (s: string) => string }) {
  const isPaid = Boolean(r.paymentIntentId);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--brand-surface)] px-4 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/20 text-sm font-bold text-[var(--brand-primary)]">
        {r.userName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{r.userName}</p>
        <p className="text-xs text-[var(--brand-text-muted)]">{formatDate(r.createdAt)}</p>
      </div>
      {r.type === "speaker" && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isPaid ? "bg-green-500/20 text-green-400" : "bg-[var(--brand-text-muted)]/15 text-[var(--brand-text-muted)]"}`}>
          {isPaid ? "支払済" : "未払い"}
        </span>
      )}
    </div>
  );
}
