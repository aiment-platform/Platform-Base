import Image from "next/image";
import Link from "next/link";
import { X_HANDLE, X_URL, XMark } from "./primitives";

/**
 * サイト共通のフッター。閲覧用のページ（トップ・スケジュール・LP・規約など）は
 * すべてこれ1つを使う。配信画面・ルーム・管理画面など、画面いっぱいを使う
 * 作業用の画面には置かない。
 *
 * 親は `flex min-h-screen flex-col` にしておく。mt-auto で、中身が短い
 * ページでもフッターは画面の下端に着く。スマホの下固定ナビ（TopNav）が
 * あるページでは、その裏に隠れないよう globals.css の .site-footer で
 * 下余白を足している。
 */
export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto bg-[var(--brand-primary-dark)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between lg:px-10">
        <Link href="/" aria-label="aiment home">
          <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} className="h-7 w-auto" />
        </Link>
        {/* スマホでは行が折り返すので、各リンクの上下に余白を足して指で押せる高さ（約 36px）にする */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 text-[13px] font-bold text-white/85 [&>*]:py-2.5 sm:gap-y-2 sm:[&>*]:py-0" aria-label="Footer">
          <Link href="/lp" className="hover:underline">
            For Learners
          </Link>
          <Link href="/for-vtubers" className="hover:underline">
            For VTubers
          </Link>
          <Link href="/for-mates" className="hover:underline">
            For Mates
          </Link>
          <Link href="/supporter-guidelines" className="hover:underline">
            Guidelines
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <a href={X_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
            <XMark className="h-[13px] w-[13px]" />
            {X_HANDLE}
          </a>
        </nav>
      </div>
    </footer>
  );
}
