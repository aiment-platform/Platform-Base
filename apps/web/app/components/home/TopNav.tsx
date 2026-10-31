"use client";

import { ComponentType, SVGProps, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, HomeIcon, RectangleStackIcon, TicketIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { AuthProfileControl } from "../auth/AuthProfileControl";
import { useI18n } from "../../lib/i18n";
import { useUserSession } from "../../lib/userSession";
import { buttonClassName } from "../ui/Button";
import { LocaleSwitch } from "../ui/LocaleSwitch";
import { useRouteTransition } from "../ui/RouteTransition";
import { HomeSearchInput } from "./HomeSearchInput";

type NavItem = {
  labelJp: string;
  labelEn: string;
  href?: string;
  shortLabelEn?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { labelJp: "ライブ", labelEn: "Live", href: "/", shortLabelEn: "Live", icon: HomeIcon },
  { labelJp: "スケジュール", labelEn: "Schedule", href: "/schedule", shortLabelEn: "Schedule", icon: CalendarDaysIcon },
];

type TopNavProps = {
  mode?: "default" | "studio";
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
};

export function TopNav({ mode = "default", searchQuery, onSearchChange }: TopNavProps) {
  const { navigate } = useRouteTransition();

  const pathname = usePathname();
  const { locale, tx } = useI18n();
  const { isAuthenticated, isVtuber } = useUserSession();
  const isStudioMode = mode === "studio";
  // 下固定のナビがある間は印を付けておく。読み込みの帯（.route-bar）が
  // ナビの上に出るように、CSS 側で位置をずらすのに使う。
  useEffect(() => {
    if (isStudioMode) return;
    document.documentElement.setAttribute("data-bottom-nav", "");
    return () => document.documentElement.removeAttribute("data-bottom-nav");
  }, [isStudioMode]);
  const showSearch = !isStudioMode && searchQuery !== undefined && onSearchChange !== undefined;
  const navItems: NavItem[] = isAuthenticated
    ? [
        ...BASE_NAV_ITEMS,
        // 予約した枠の一覧（マイチケット）。予約はログインしている人だけができるので、ログイン中だけ出す
        { labelJp: "チケット", labelEn: "Tickets", href: "/tickets", shortLabelEn: "Tickets", icon: TicketIcon },
        { labelJp: "チャンネル", labelEn: "Channel", href: "/channel", shortLabelEn: "Channel", icon: RectangleStackIcon },
      ]
    : BASE_NAV_ITEMS;

  return (
    <>
      <nav className="ui-topnav sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--brand-surface)]/95 backdrop-blur">
        {/* 横幅いっぱいに広げる。max-w で中央に寄せると、広い画面でロゴが左端から離れていく。 */}
        <div className="px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* ロゴは縮ませない（狭い画面で右のボタンに押されて潰れていた）。代わりにスマホでは一回り小さく置く */}
            <Link href="/" className="flex shrink-0 items-center rounded-lg px-1 py-1.5 sm:px-2">
              <Image
                src="/logo/aiment_logotype.svg"
                alt="aiment"
                width={150}
                height={50}
                className="h-8 w-auto object-contain sm:h-10"
                priority
              />
            </Link>

            {!isStudioMode && (
            // ヘッダー内のナビは PC 幅（lg 以上）だけ。タブレット幅（768〜1023px）では、4項目のナビと
            // 言語切替・「配信を作成」が並びきらず重なるので、スマホと同じ下固定ナビにまかせる
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-bg-900)] p-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href ? pathname === item.href : false;
                  if (!item.href) {
                    return (
                      <span key={item.labelJp} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-[15px] text-[var(--brand-text-muted)]/80">
                        <Icon className="h-4 w-4" aria-hidden />
                        {tx(item.labelJp, item.labelEn)}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-active={isActive || undefined}
                      className={`ui-topnav__item inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors ${
                        isActive
                          ? "bg-[var(--brand-primary)] text-white"
                          : "text-[var(--brand-text-muted)] hover:bg-[var(--brand-surface)] hover:text-[var(--brand-text)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {tx(item.labelJp, item.labelEn)}
                    </Link>
                  );
                })}
              </div>
              {showSearch && (
                <HomeSearchInput
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  className="w-full max-w-[360px]"
                />
              )}
            </div>
            )}

            <div className="flex items-center gap-2">
              <LocaleSwitch />
                {isStudioMode && isVtuber && (
                <Link
                  href="/studio/sessions"
                  className={`hidden sm:inline-flex ${buttonClassName({ variant: "ghost", size: "md" })}`}
                >
                  {tx("枠管理", "My Sessions")}
                </Link>
              )}
              {!isStudioMode && isVtuber && (
                <button
                  type="button"
                  onClick={() => {
                    navigate("/studio/pre-live");
                  }}
                  className={`hidden sm:inline-flex ${buttonClassName({ variant: "primary", size: "md" })}`}
                >
                  <VideoCameraIcon className="h-5 w-5" aria-hidden />
                  <span>{tx("配信を作成", "Create Stream")}</span>
                </button>
              )}
              <div>
                <AuthProfileControl />
              </div>
            </div>
          </div>
          {showSearch && (
            <HomeSearchInput
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              className="mt-2 lg:hidden"
            />
          )}
        </div>
      </nav>

      {!isStudioMode && (
      // スマホの下固定ナビ。高さは 52px（＋ iPhone の下の余白）に固定する。
      // join ページの参加ボタンの帯や読み込みの帯（.route-bar）が、この 52px を前提に上へ積んでいるため。
      // ログイン中は4つ並ぶので、アイコンの横に文字を置くと「スケジュール」などが2行に折れる。
      // アイコンを上・文字を下に積む、スマホのタブバーでおなじみの形にする
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[var(--brand-surface)]/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden">
        <div className="flex h-[51px] items-stretch gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;
            const label = locale === "jp" ? item.labelJp : item.shortLabelEn ?? item.labelEn;
            const itemClass = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-bold leading-tight";
            if (!item.href) {
              return (
                <span key={item.labelJp} className={`${itemClass} text-[var(--brand-text-muted)]/70`}>
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="max-w-full truncate">{label}</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive || undefined}
                aria-current={isActive ? "page" : undefined}
                // ui-topnav__item を付けて、上のナビと同じ「今いるページ」の見た目（0.4 ではライムの札）にそろえる
                className={`ui-topnav__item ${itemClass} transition-colors ${
                  isActive
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--brand-text-muted)] hover:bg-[var(--brand-bg-900)] hover:text-[var(--brand-text)]"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </>
  );
}
