"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import { X_URL } from "../landing/primitives";

type SitemapLink = { ja: string; en: string; href: string; external?: boolean };

// フッターのサイトマップ。行き先のページがある項目だけを載せる。
const SITEMAP: { title: { ja: string; en: string }; links: SitemapLink[] }[] = [
 {
 title: { ja: "プラットフォーム", en: "Platform" },
 links: [
 { ja: "配信スケジュール", en: "Schedule", href: "/schedule" },
 { ja: "使い方", en: "How it works", href: "/lp#how-it-works" },
 ],
 },
 {
 title: { ja: "はじめる", en: "Get started" },
 links: [
 { ja: "ラーナーの方へ（English）", en: "For learners", href: "/lp" },
 { ja: "VTuberの方へ", en: "For VTubers", href: "/for-vtubers" },
 { ja: "メイトの方へ", en: "For mates", href: "/for-mates" },
 ],
 },
 {
 title: { ja: "サポート", en: "Support" },
 links: [
 { ja: "メイト規約", en: "Mate Guidelines", href: "/supporter-guidelines" },
 { ja: "お問い合わせ（公式X）", en: "Contact (X)", href: X_URL, external: true },
 ],
 },
];

export function Footer() {
 const { tx } = useI18n();
 return (
 <footer className="mt-20 bg-[var(--brand-bg-900)]">
 <div className="mx-auto max-w-[1400px] px-8 py-12 lg:px-12">
 <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-12">
 <div>
 <div className="mb-4 flex items-center">
 <Image src="/logo/aiment_logotype.svg" alt="aiment" width={150} height={50} className="h-10 w-auto object-contain" />
 </div>
 <p className="text-sm leading-relaxed text-[var(--brand-text-muted)]">Beyond Chat. Unlock Distance.</p>
 </div>
 {SITEMAP.map((group) => (
 <div key={group.title.en}>
 <h3 className="mb-4 text-sm font-medium text-[var(--brand-text)]">{tx(group.title.ja, group.title.en)}</h3>
 <ul className="space-y-2 text-sm text-[var(--brand-text-muted)]">
 {group.links.map((link) => (
 <li key={link.href}>
 {link.external ? (
 <a href={link.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-[var(--brand-text)]">
 {tx(link.ja, link.en)}
 </a>
 ) : (
 <Link href={link.href} className="transition hover:text-[var(--brand-text)]">
 {tx(link.ja, link.en)}
 </Link>
 )}
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 <div className="flex flex-col gap-4 pt-8 text-sm text-[var(--brand-text-muted)] sm:flex-row sm:items-center sm:justify-between">
 <p>© 2026 aiment. All rights reserved.</p>
 <div className="flex items-center gap-6">
 <Link href="/privacy" className="transition hover:text-[var(--brand-text)]">{tx("プライバシーポリシー", "Privacy Policy")}</Link>
 <Link href="/terms" className="transition hover:text-[var(--brand-text)]">{tx("利用規約", "Terms of Use")}</Link>
 </div>
 </div>
 </div>
 </footer>
 );
}
