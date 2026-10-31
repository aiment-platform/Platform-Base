"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRightOnRectangleIcon, Cog6ToothIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { useI18n } from "../../lib/i18n";
import { useUserSession } from "../../lib/userSession";
import { Card } from "../ui/Card";

function AuthDropdown({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, logout } = useUserSession();
  const { tx } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleEmailLogin = () => {
    onClose();
    router.push("/auth");
  };

  return (
    <Card
      className={`ui-float absolute right-0 top-full mt-2 z-50 max-w-[calc(100vw-1rem)] ${isAuthenticated ? "w-[220px] p-1.5" : "w-[300px] p-3"}`}
      tone="default"
    >
      {!isAuthenticated ? (
        <div className="space-y-2">
          <p className="px-1 text-xs text-[var(--brand-text-muted)]">{tx("ログインして配信や予約を続ける", "Log in to stream and book sessions")}</p>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="ui-btn ui-btn-md ui-btn-primary w-full"
          >
            {tx("Googleで続行", "Continue with Google")}
          </button>
          <button
            type="button"
            onClick={handleEmailLogin}
            className="ui-btn ui-btn-md ui-btn-ghost w-full"
          >
            {tx("メールで続行", "Continue with email")}
          </button>
        </div>
      ) : (
        <nav className="flex flex-col gap-0.5" aria-label={tx("アカウントメニュー", "Account menu")}>
          <Link href="/channel" onClick={onClose} aria-current={pathname.startsWith("/channel") ? "page" : undefined} className="ui-menu-item">
            <RectangleStackIcon className="h-4 w-4" aria-hidden />
            {tx("チャンネル", "Channel")}
          </Link>
          <Link href="/account" onClick={onClose} aria-current={pathname.startsWith("/account") ? "page" : undefined} className="ui-menu-item">
            <Cog6ToothIcon className="h-4 w-4" aria-hidden />
            {tx("アカウント設定", "Account settings")}
          </Link>
          <button
            type="button"
            onClick={() => {
              void logout().then(onClose);
            }}
            className="ui-menu-item"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />
            {tx("ログアウト", "Log out")}
          </button>
        </nav>
      )}
    </Card>
  );
}

export function AuthProfileControl() {
  const { user, isAuthenticated, hydrated } = useUserSession();
  // 見出しのボタンも、選んでいる言語に合わせる（前は英語を選んでも「ログイン」のままだった）
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {!isAuthenticated ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="ui-btn ui-btn-md ui-btn-primary h-10 whitespace-nowrap"
        >
          {hydrated ? tx("ログイン", "Log in") : "..."}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={user?.name ? tx(`${user.name} のメニュー`, `${user.name}'s menu`) : tx("アカウントメニュー", "Account menu")}
          className="ui-btn ui-btn-md ui-btn-ghost group h-10 px-2.5"
        >
          <span className="relative block h-7 w-7 overflow-hidden rounded-full bg-[var(--brand-bg-800)]">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[11px] font-bold text-[var(--brand-primary)]">
                {(user?.name || "A").slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          {/* スマホではロゴ・言語切替と並ぶと幅が足りず、ロゴが縮んでしまうので、名前は出さずアイコンだけにする */}
          <span className="hidden max-w-[110px] truncate text-sm text-[var(--brand-text)] sm:inline">{hydrated ? user?.name : "..."}</span>
        </button>
      )}

      {open && <AuthDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
