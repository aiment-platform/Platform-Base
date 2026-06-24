"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueueListIcon, TicketIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { MySessionsManager } from "../components/channel/MySessionsManager";
import { TopNav } from "../components/home/TopNav";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FieldLabel, TextArea, TextInput } from "../components/ui/Field";
import type { ParticipationTicket } from "../lib/apiTypes";
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
};

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
  const [draft, setDraft] = useState<ProfileDraft>({ name: "", channelName: "", bio: "", avatarUrl: "", headerUrl: "" });
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
    setDraft({
      name: user.name ?? "",
      channelName: user.channelName ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
      headerUrl: user.headerUrl ?? "",
    });
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
        }),
      });
      updateUser({
        name: draft.name,
        channelName: draft.channelName || undefined,
        bio: draft.bio || undefined,
        avatarUrl: draft.avatarUrl || undefined,
        headerUrl: draft.headerUrl || undefined,
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
    setDraft({
      name: user?.name ?? "",
      channelName: user?.channelName ?? "",
      bio: user?.bio ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      headerUrl: user?.headerUrl ?? "",
    });
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
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav />

      <main className="min-h-[calc(100vh-72px)] lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="bg-[var(--brand-surface)] p-3 shadow-[var(--ui-shadow-1)] lg:min-h-[calc(100vh-72px)] lg:rounded-none lg:border-r lg:border-black/20">
          <div className="lg:sticky lg:top-[84px]">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--brand-text-muted)]">
              {tx("チャンネル管理", "Channel")}
            </p>
            <div className="space-y-1">
              {availableTabs.map(({ key, labelJa, labelEn, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchView(key)}
                  className={`flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold transition ${
                    activeView === key
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-[var(--brand-surface)] text-[var(--brand-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {tx(labelJa, labelEn)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            {activeView === "profile" ? (
              <div>
                <h1 className="text-2xl font-bold">{tx("プロフィール管理", "Profile Settings")}</h1>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  {isVtuber
                    ? tx("チャンネルの公開情報と配信枠を管理できます。", "Manage your public channel profile and stream sessions.")
                    : tx("公開プロフィールと所持チケットを管理できます。", "Manage your public profile and tickets.")}
                </p>

                <form onSubmit={saveProfile} className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="space-y-4">
                    <Card tone="subtle" className="p-4">
                      <label className="block">
                        <FieldLabel>{tx("表示名", "Display Name")}</FieldLabel>
                        <TextInput
                          value={draft.name}
                          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </label>

                      <label className="mt-4 block">
                        <FieldLabel>{tx("チャンネル名", "Channel Name")}</FieldLabel>
                        <TextInput
                          value={draft.channelName}
                          onChange={(e) => setDraft((prev) => ({ ...prev, channelName: e.target.value }))}
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
                    </Card>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" disabled={saving || uploadingImage} variant="primary" size="md">
                        {uploadingImage ? tx("画像アップロード中...", "Uploading image...") : saving ? tx("保存中...", "Saving...") : tx("保存", "Save")}
                      </Button>
                      <Button type="button" onClick={resetProfile} variant="ghost" size="md">
                        {tx("リセット", "Reset")}
                      </Button>
                    </div>

                    {message ? <p className="text-sm text-[var(--brand-secondary)]">{message}</p> : null}
                    {error ? <p className="text-sm text-[var(--brand-accent)]">{error}</p> : null}
                  </div>

                  <div className="space-y-4">
                    <Card tone="subtle" className="p-0 overflow-hidden">
                      <div className="relative">
                        {draft.headerUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={draft.headerUrl} alt={tx("ヘッダー画像", "Header Image")} className="h-40 w-full object-cover" />
                        ) : (
                          <div className="grid h-40 w-full place-items-center bg-[var(--brand-surface)] text-sm font-semibold text-[var(--brand-text-muted)]">
                            {tx("ヘッダー画像なし", "No header image")}
                          </div>
                        )}
                        <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--brand-surface-soft)] bg-[var(--brand-surface)]">
                          {draft.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={draft.avatarUrl} alt={tx("チャンネルアイコン", "Channel Icon")} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-lg font-bold text-[var(--brand-primary)]">
                              {(draft.channelName || draft.name || "A").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 pt-10">
                        <p className="text-base font-semibold text-[var(--brand-text)]">{draft.channelName || tx("チャンネル名未設定", "No channel name")}</p>
                        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{draft.name || tx("表示名未設定", "No display name")}</p>
                        <p className="mt-3 text-xs leading-5 text-[var(--brand-text-muted)]">
                          {draft.bio || tx("紹介文が未設定です。", "No introduction yet.")}
                        </p>
                      </div>
                    </Card>

                    <Card tone="subtle" className="p-4">
                      <FieldLabel>{tx("ヘッダー画像", "Header Image")}</FieldLabel>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="ui-btn ui-btn-sm ui-btn-ghost cursor-pointer">
                          {tx("画像をアップロード", "Upload image")}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleHeaderFileChange(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((prev) => ({ ...prev, headerUrl: "" }))}>
                          {tx("削除", "Remove")}
                        </Button>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--brand-text-muted)]">{tx("推奨: 16:5以上の横長画像 / 4MB以下", "Recommended: wide image (16:5+), up to 4MB")}</p>
                    </Card>

                    <Card tone="subtle" className="p-4">
                      <FieldLabel>{tx("プロフィール画像", "Profile Image")}</FieldLabel>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="ui-btn ui-btn-sm ui-btn-ghost cursor-pointer">
                          {tx("画像をアップロード", "Upload image")}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleAvatarFileChange(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((prev) => ({ ...prev, avatarUrl: "" }))}>
                          {tx("削除", "Remove")}
                        </Button>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--brand-text-muted)]">{tx("PNG/JPG/WebP・2MB以下", "PNG/JPG/WebP, up to 2MB")}</p>
                    </Card>
                  </div>
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

                <div className="mt-5 rounded-2xl bg-[var(--brand-surface)] p-4 shadow-[var(--ui-shadow-1)]">
                  {ticketsLoading ? (
                    <p className="rounded-xl bg-[var(--brand-bg-900)] px-4 py-6 text-sm text-[var(--brand-text-muted)]">
                      {tx("チケットを読み込み中...", "Loading tickets...")}
                    </p>
                  ) : ticketsError ? (
                    <p className="rounded-xl bg-[var(--brand-accent)]/15 px-4 py-3 text-sm text-[var(--brand-accent)]">
                      {ticketsError}
                    </p>
                  ) : tickets.length === 0 ? (
                    <p className="rounded-xl bg-[var(--brand-bg-900)] px-4 py-6 text-sm text-[var(--brand-text-muted)]">
                      {tx("現在所持している参加チケットはありません。", "You do not currently have participation tickets.")}
                    </p>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {tickets.map((ticket) => {
                        const active = ticket.status === "active";
                        return (
                          <div key={ticket.ticketId} className="rounded-xl bg-[var(--brand-bg-900)] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-[var(--brand-text)]">
                                  {ticket.scope === "all"
                                    ? tx("全配信用チケット", "All-session ticket")
                                    : tx("特定配信用チケット", "Session-specific ticket")}
                                </p>
                                <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
                                  ID: {ticket.ticketId}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                active
                                  ? "bg-[var(--brand-secondary)]/18 text-[var(--brand-secondary)]"
                                  : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)]"
                              }`}>
                                {active ? tx("使用可能", "Active") : tx("使用済み", "Used")}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 text-xs text-[var(--brand-text-muted)] sm:grid-cols-2">
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
