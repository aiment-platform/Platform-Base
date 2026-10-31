"use client";

import Link from "next/link";
import { TopNav } from "../components/home/TopNav";
import { useI18n } from "../lib/i18n";
import { SiteFooter } from "../components/landing/SiteFooter";

export default function TermsPage() {
  const { tx } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />
      <div className="flex-1">
      {/* スマホでは外の余白（16px）と箱の内側の余白を詰めて、本文の行幅を残す */}
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-10 md:py-12">
        <section className="ui-panel p-5 sm:p-7">
          <h1 className="text-2xl font-black">{tx("利用規約", "Terms of Use")}</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--brand-text-muted)]">
            {tx(
              "本サービスの利用に際して、アカウント情報の適切な管理、他ユーザーへの迷惑行為の禁止、権利侵害コンテンツの投稿禁止、法令順守を求めます。運営は必要に応じてアカウント制限やコンテンツ削除を行う場合があります。",
              "When using this service, you must manage your account information appropriately, avoid behavior that harms other users, avoid posting content that infringes rights, and comply with applicable laws. The operations team may restrict accounts or remove content when necessary.",
            )}
          </p>
          <div className="mt-4">
            <Link href="/auth/signup" className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--brand-primary-ink)] underline-offset-2 hover:underline">
              {tx("サインアップに戻る", "Back to Sign Up")}
            </Link>
          </div>
        </section>
      </main>
      </div>
      <SiteFooter />
    </div>
  );
}
