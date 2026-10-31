"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueueListIcon, TicketIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { MySessionsManager } from "../components/channel/MySessionsManager";
import { TopNav } from "../components/home/TopNav";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FieldLabel, SelectField, TextArea, TextInput } from "../components/ui/Field";
import type { ParticipationTicket, ProfileItem } from "../lib/apiTypes";
import { PROFILE_PRESETS, isProfilePresetKey } from "../lib/profileItems";
import { useI18n } from "../lib/i18n";
import { uploadImageToR2 } from "../lib/uploadImage";
import { useUserSession } from "../lib/userSession";

type ChannelView = "profile" | "sessions" | "tickets";

type ProfileDraft = {
  name: string;
  channelName: string;
  bio: string;
  avatarUrl: string;
  headerUrl: string;
  profileItems: ProfileItem[];
};

/** プロフィール欄の行数の上限（保存する側 aimentStore の PROFILE_ITEMS_MAX と同じ） */
const PROFILE_ITEMS_MAX = 6;
/** 内容の欄の見本。何を書けばいいかを、空欄の薄い文字で見せる */
const PROFILE_ITEM_EXAMPLES: Array<{ valueJa: string; valueEn: string }> = [
  { valueJa: "3月14日", valueEn: "March 14" },
  { valueJa: "いちご大福・RPG", valueEn: "Strawberry mochi, RPGs" },
  { valueJa: "日本語 / English すこし", valueEn: "Japanese / a little English" },
];

function profileDraftFrom(user: { name?: string; channelName?: string; bio?: string; avatarUrl?: string; headerUrl?: string; profileItems?: ProfileItem[] } | null): ProfileDraft {
  return {
    name: user?.name ?? "",
    channelName: user?.channelName ?? "",
    bio: user?.bio ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    headerUrl: user?.headerUrl ?? "",
    profileItems: user?.profileItems ?? [],
  };
}

const CHANNEL_TABS: Array<{
  key: ChannelView;
  labelJa: string;
  labelEn: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  vtuberOnly?: boolean;
  nonVtuberOnly?: boolean;
}> = [
  { key: "profile", labelJa: "プロフィール", labelEn: "Profile", Icon: UserCircleIcon },
  { key: "sessions", labelJa: "配信枠管理", labelEn: "Session Manager", Icon: QueueListIcon, vtuberOnly: true },
  { key: "tickets", labelJa: "所持チケット", labelEn: "Tickets", Icon: TicketIcon, nonVtuberOnly: true },
];

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Request failed");
}

function formatTicketDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function ChannelPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { tx } = useI18n();
  const { user, hydrated, isAuthenticated, isVtuber, updateUser, refreshSession } = useUserSession();

  const availableTabs = useMemo(() => CHANNEL_TABS.filter((tab) => {
    if (tab.vtuberOnly) return isVtuber;
    if (tab.nonVtuberOnly) return !isVtuber;
    return true;
  }), [isVtuber]);
  const parseTab = useCallback((value: string | null): ChannelView => {
    const requested = value === "sessions" || value === "tickets" ? value : "profile";
    return availableTabs.some((tab) => tab.key === requested) ? requested : "profile";
  }, [availableTabs]);
  const [activeView, setActiveView] = useState<ChannelView>("profile");
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraftFrom(null));
  const [tickets, setTickets] = useState<ParticipationTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.replace("/auth");
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    setDraft(profileDraftFrom(user));
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    const next = parseTab(tab);
    setActiveView((prev) => (prev === next ? prev : next));
  }, [parseTab]);

  useEffect(() => {
    if (!user || isVtuber) return;
    let cancelled = false;
    const loadTickets = async () => {
      setTicketsLoading(true);
      setTicketsError(null);
      try {
        const response = await fetch("/api/account/participation-tickets", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as { tickets?: ParticipationTicket[]; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Failed to load tickets");
        if (!cancelled) setTickets(payload?.tickets ?? []);
      } catch (caught) {
        if (!cancelled) setTicketsError(caught instanceof Error ? caught.message : tx("チケットの取得に失敗しました。", "Failed to load tickets."));
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    };

    void loadTickets();
    return () => {
      cancelled = true;
    };
  }, [isVtuber, tx, user]);

  function switchView(next: ChannelView) {
    setActiveView(next);
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await request("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name,
          channelName: draft.channelName,
          bio: draft.bio,
          avatarUrl: draft.avatarUrl,
          headerUrl: draft.headerUrl,
          profileItems: draft.profileItems,
        }),
      });
      updateUser({
        name: draft.name,
        channelName: draft.channelName || undefined,
        bio: draft.bio || undefined,
        avatarUrl: draft.avatarUrl || undefined,
        headerUrl: draft.headerUrl || undefined,
        profileItems: draft.profileItems.filter((item) => (isProfilePresetKey(item.key) || item.label.trim()) && item.value.trim()),
      });
      await refreshSession();
      setMessage(tx("プロフィールを保存しました。", "Profile saved."));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : tx("保存に失敗しました。", "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  }

  function resetProfile() {
    setDraft(profileDraftFrom(user));
    setMessage(null);
    setError(null);
  }

  if (!hydrated || !isAuthenticated || !user) return null;

  async function handleAvatarFileChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(tx("画像ファイルを選択してください。", "Please choose an image file."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(tx("画像サイズは2MB以下にしてください。", "Please keep image size under 2MB."));
      return;
    }

    setUploadingImage(true);
    setMessage(null);
    setError(null);
    try {
      const url = await uploadImageToR2(file, "avatars");
      setDraft((prev) => ({ ...prev, avatarUrl: url }));
    } catch {
      setError(tx("画像のアップロードに失敗しました。", "Failed to upload image."));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleHeaderFileChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(tx("画像ファイルを選択してください。", "Please choose an image file."));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError(tx("画像サイズは4MB以下にしてください。", "Please keep image size under 4MB."));
      return;
    }

    setUploadingImage(true);
    setMessage(null);
    setError(null);
    try {
      const url = await uploadImageToR2(file, "headers");
      setDraft((prev) => ({ ...prev, headerUrl: url }));
    } catch {
      setError(tx("画像のアップロードに失敗しました。", "Failed to upload image."));
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />

      <main className="min-h-[calc(100vh-72px)] lg:grid lg:grid-cols-[240px_1fr]">
        {/* スマホでは縦積みのメニューが画面の上を大きく占めるので、横並びのタブにする */}
        <aside className="border-b border-[var(--line)] bg-[var(--brand-surface)] p-3 lg:min-h-[calc(100vh-72px)] lg:rounded-none lg:border-b-0 lg:border-r">
          <div className="lg:sticky lg:top-[84px]">
            <p className="mb-2 hidden px-2 text-xs font-bold text-[var(--brand-text-muted)] lg:block">
              {tx("チャンネル管理", "Channel")}
            </p>
            <div className="grid grid-cols-2 gap-1.5 lg:block lg:space-y-1">
              {availableTabs.map(({ key, labelJa, labelEn, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchView(key)}
                  aria-pressed={activeView === key}
                  className={`flex h-11 w-full min-w-0 items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold transition lg:h-10 ${
                    activeView === key
                      ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]"
                      : "text-[var(--brand-text)] hover:bg-[var(--brand-bg-900)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{tx(labelJa, labelEn)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 pb-28 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-[1400px]">
            {activeView === "profile" ? (
              <div>
                <h1 className="text-2xl font-bold">{tx("プロフィール管理", "Profile Settings")}</h1>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  {isVtuber
                    ? tx("チャンネルの公開情報と配信枠を管理できます。", "Manage your public channel profile and stream sessions.")
                    : tx("公開プロフィールと所持チケットを管理できます。", "Manage your public profile and tickets.")}
                </p>

                {/* プレビューと画像の差し替えボタンを1枚のカードにまとめ、変えた結果がその場で見えるようにする。
                    スマホではプレビューを先に出す（どう見えるかを見てから文字を直す流れ） */}
                <form onSubmit={saveProfile} className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <Card className="p-5 xl:order-none order-last">
                    <label className="block">
                      <FieldLabel>{tx("表示名", "Display Name")}</FieldLabel>
                      <TextInput
                        value={draft.name}
                        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                        autoComplete="nickname"
                        className="mt-1"
                      />
                    </label>

                    <label className="mt-4 block">
                      <FieldLabel>{tx("チャンネル名", "Channel Name")}</FieldLabel>
                      <TextInput
                        value={draft.channelName}
                        onChange={(e) => setDraft((prev) => ({ ...prev, channelName: e.target.value }))}
                        autoComplete="off"
                        className="mt-1"
                      />
                    </label>

                    <label className="mt-4 block">
                      <FieldLabel>{tx("紹介文", "Introduction")}</FieldLabel>
                      <TextArea
                        value={draft.bio}
                        onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                        rows={7}
                        className="mt-1"
                      />
                    </label>

                    {/* チャンネルページのプロフィール欄。見出しと内容の組を自由に書く。見出しか内容が空の行は保存しない */}
                    {isVtuber ? (
                      <fieldset className="mt-5">
                        <legend className="text-xs font-semibold text-[var(--brand-text-muted)]">
                          {tx(`プロフィール（${PROFILE_ITEMS_MAX}行まで）`, `Profile (up to ${PROFILE_ITEMS_MAX} rows)`)}
                        </legend>
                        <div className="mt-2 grid gap-2">
                          {draft.profileItems.map((item, index) => {
                            const example = PROFILE_ITEM_EXAMPLES[index % PROFILE_ITEM_EXAMPLES.length];
                            const isCustom = !isProfilePresetKey(item.key);
                            const update = (patch: Partial<ProfileItem>) =>
                              setDraft((prev) => ({
                                ...prev,
                                profileItems: prev.profileItems.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
                              }));
                            return (
                              // スマホでは1行が縦に3段になるので、行ごとを細い枠で囲む（背景を塗ると、同じ色の入力欄が見えなくなる）
                              <div key={index} className="grid gap-2 rounded-xl border border-[var(--line)] p-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-start sm:border-0 sm:p-0">
                                {/* 見出しは、よく使うものから選ぶ（表示の言語に合わせて訳される）。ないものは「その他」で自由に書く */}
                                <div className="grid gap-2">
                                  <SelectField
                                    value={isCustom ? "" : item.key}
                                    onChange={(e) => {
                                      const key = e.target.value;
                                      update(key ? { key, label: "" } : { key: undefined, label: "" });
                                    }}
                                    aria-label={tx(`${index + 1}行目の見出し`, `Row ${index + 1} label`)}
                                  >
                                    {PROFILE_PRESETS.map((preset) => (
                                      <option key={preset.key} value={preset.key}>
                                        {tx(preset.ja, preset.en)}
                                      </option>
                                    ))}
                                    <option value="">{tx("その他（自由に書く）", "Other (write your own)")}</option>
                                  </SelectField>
                                  {isCustom ? (
                                    <TextInput
                                      value={item.label}
                                      maxLength={16}
                                      onChange={(e) => update({ label: e.target.value })}
                                      placeholder={tx("見出し（例：好きな色）", "Label (e.g. Favorite color)")}
                                      aria-label={tx(`${index + 1}行目の見出しを書く`, `Row ${index + 1} custom label`)}
                                    />
                                  ) : null}
                                </div>
                                <div className="flex items-start gap-2 sm:contents">
                                  <TextInput
                                    value={item.value}
                                    maxLength={40}
                                    onChange={(e) => update({ value: e.target.value })}
                                    placeholder={tx(example.valueJa, example.valueEn)}
                                    aria-label={tx(`${index + 1}行目の内容`, `Row ${index + 1} value`)}
                                    className="min-w-0 flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setDraft((prev) => ({ ...prev, profileItems: prev.profileItems.filter((_, rowIndex) => rowIndex !== index) }))}
                                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--brand-text-muted)] hover:bg-[var(--brand-bg-900)] hover:text-[var(--brand-accent-ink)]"
                                    aria-label={tx(`${index + 1}行目を消す`, `Remove row ${index + 1}`)}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {draft.profileItems.length < PROFILE_ITEMS_MAX ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              setDraft((prev) => {
                                // まだ使っていない、よく使う見出しを最初から選んでおく（全部使っていたら「その他」）
                                const unused = PROFILE_PRESETS.find((preset) => !prev.profileItems.some((row) => row.key === preset.key));
                                const row: ProfileItem = unused ? { key: unused.key, label: "", value: "" } : { label: "", value: "" };
                                return { ...prev, profileItems: [...prev.profileItems, row] };
                              })
                            }
                          >
                            {tx("＋ 行を足す", "+ Add a row")}
                          </Button>
                        ) : null}
                      </fieldset>
                    ) : null}

                    {message ? <p className="mt-4 text-sm text-[var(--brand-primary-ink)]">{message}</p> : null}
                    {error ? <p className="mt-4 text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}

                    {/* 保存はフォームのカードの中に置く。スマホでは下のナビの上に貼り付けて、
                        長い紹介文を書いている途中でもすぐ押せるようにする */}
                    <div className="sticky bottom-[calc(52px+env(safe-area-inset-bottom))] -mx-5 -mb-5 mt-5 flex items-center justify-end gap-2 rounded-b-[inherit] border-t border-[var(--line)] bg-[var(--brand-surface)] px-5 py-3 lg:static">
                      <Button type="button" onClick={resetProfile} variant="ghost" size="md">
                        {tx("リセット", "Reset")}
                      </Button>
                      <Button type="submit" disabled={saving || uploadingImage} variant="primary" size="md">
                        {uploadingImage ? tx("画像アップロード中...", "Uploading image...") : saving ? tx("保存中...", "Saving...") : tx("保存", "Save")}
                      </Button>
                    </div>
                  </Card>

                  <Card className="overflow-hidden p-0">
                    <div className="relative">
                      {draft.headerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.headerUrl} alt={tx("ヘッダー画像", "Header Image")} className="aspect-[16/5] w-full object-cover" />
                      ) : (
                        <div className="grid aspect-[16/5] w-full place-items-center bg-[var(--brand-primary-soft)] text-sm font-semibold text-[var(--brand-primary-ink)]">
                          {tx("ヘッダー画像なし", "No header image")}
                        </div>
                      )}
                      <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-[var(--brand-surface)] bg-[var(--brand-surface)]">
                        {draft.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={draft.avatarUrl} alt={tx("チャンネルアイコン", "Channel Icon")} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-lg font-bold text-[var(--brand-primary-ink)]">
                            {(draft.channelName || draft.name || "A").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 pt-10">
                      <p className="break-words text-base font-semibold text-[var(--brand-text)]">{draft.channelName || tx("チャンネル名未設定", "No channel name")}</p>
                      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{draft.name || tx("表示名未設定", "No display name")}</p>
                      <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-xs leading-5 text-[var(--brand-text-muted)]">
                        {draft.bio || tx("紹介文が未設定です。", "No introduction yet.")}
                      </p>
                    </div>

                    <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
                      {[
                        {
                          label: tx("ヘッダー画像", "Header Image"),
                          hint: tx("16:5以上の横長 / 4MB以下", "Wide (16:5+), up to 4MB"),
                          onFile: handleHeaderFileChange,
                          onRemove: () => setDraft((prev) => ({ ...prev, headerUrl: "" })),
                        },
                        {
                          label: tx("プロフィール画像", "Profile Image"),
                          hint: tx("PNG/JPG/WebP・2MB以下", "PNG/JPG/WebP, up to 2MB"),
                          onFile: handleAvatarFileChange,
                          onRemove: () => setDraft((prev) => ({ ...prev, avatarUrl: "" })),
                        },
                      ].map((row) => (
                        <div key={row.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--brand-text)]">{row.label}</p>
                            <p className="text-[11px] text-[var(--brand-text-muted)]">{row.hint}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <label className="ui-btn ui-btn-sm ui-btn-ghost cursor-pointer">
                              {tx("変更", "Change")}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => void row.onFile(e.target.files?.[0] ?? null)}
                              />
                            </label>
                            <Button type="button" variant="ghost" size="sm" onClick={row.onRemove}>
                              {tx("削除", "Remove")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </form>
              </div>
            ) : activeView === "sessions" && isVtuber ? (
              <MySessionsManager
                title={tx("作成済み配信枠", "Your Stream Sessions")}
                description={tx("studio/sessions と同じデータを表示しています。", "Showing the same data source as studio/sessions.")}
                framed={false}
              />
            ) : (
              <div>
                <h1 className="text-2xl font-bold">{tx("所持チケット", "Tickets")}</h1>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  {tx("運営から付与された参加チケットを確認できます。", "View participation tickets granted by the operations team.")}
                </p>

                <div className="mt-5">
                  {ticketsLoading ? (
                    <p className="ui-panel px-4 py-6 text-sm text-[var(--brand-text-muted)]">
                      {tx("チケットを読み込み中...", "Loading tickets...")}
                    </p>
                  ) : ticketsError ? (
                    <p className="rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">
                      {ticketsError}
                    </p>
                  ) : tickets.length === 0 ? (
                    <p className="ui-panel px-4 py-6 text-sm text-[var(--brand-text-muted)]">
                      {tx("現在所持している参加チケットはありません。", "You do not currently have participation tickets.")}
                    </p>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {tickets.map((ticket) => {
                        const active = ticket.status === "active";
                        return (
                          <div key={ticket.ticketId} className="ui-panel p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--brand-text)]">
                                  {ticket.scope === "all"
                                    ? tx("全配信用チケット", "All-session ticket")
                                    : tx("特定配信用チケット", "Session-specific ticket")}
                                </p>
                                <p className="mt-1 break-all text-xs text-[var(--brand-text-muted)]">
                                  ID: {ticket.ticketId}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                active
                                  ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]"
                                  : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]"
                              }`}>
                                {active ? tx("使用可能", "Active") : tx("使用済み", "Used")}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 break-all text-xs text-[var(--brand-text-muted)] sm:grid-cols-2">
                              <p>{tx("付与日", "Granted")}: {formatTicketDate(ticket.createdAt)}</p>
                              <p>{tx("対象", "Scope")}: {ticket.sessionId ?? tx("全配信", "All sessions")}</p>
                              {ticket.usedAt ? <p>{tx("使用日", "Used")}: {formatTicketDate(ticket.usedAt)}</p> : null}
                              {ticket.usedSessionId ? <p>{tx("使用配信", "Used session")}: {ticket.usedSessionId}</p> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
