import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Noto_Sans_KR, Noto_Sans_TC } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { RouteTransitionProvider } from "./components/ui/RouteTransition";
import { I18nProvider } from "./lib/i18n";
import { UserSessionProvider } from "./lib/userSession";

// UI ver0.4 の丸い書体。CSS 変数として置き、v04.css の --font-latin / --font-jp から使う。
const roundedJp = M_PLUS_Rounded_1c({
  weight: ["500", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rounded-jp",
});
// Nunito だけはリポジトリに置いたファイルから読む。Google が Nunito を「&」入りの URL で返すことがあり、
// Turbopack がその URL を読めずにビルドが止まるため（next/font/google queries have exactly one entry）。
// ファイルは Google Fonts の Nunito（latin・可変ウェイト）をそのまま保存したもの
const roundedLatin = localFont({
  src: "./fonts/nunito-latin-variable.woff2",
  weight: "200 1000",
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-rounded-latin",
});

// 繁体字・韓国語の書体。M PLUS Rounded 1c にはハングルがなく、漢字も日本の字形なので、
// 表示言語が tw / ko のときだけ v04.css で前に並べる。丸い書体で太さがそろうものがないため、
// 角ゴシックの Noto を使う。preload: false なので、その言語を開いた人だけがダウンロードする
const sansTc = Noto_Sans_TC({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-tc",
});
const sansKr = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-kr",
});

const SITE_URL = "https://aiment.jp";
const DEFAULT_DESCRIPTION =
  "VTuberとリスナーが一対一でつながれるライブ配信プラットフォーム。好きなVTuberと話せる、新しいファン体験。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "aiment",
    template: "%s | aiment",
  },
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: "/logo/aiment_logo_rounded.svg",
  },
  openGraph: {
    type: "website",
    siteName: "aiment",
    locale: "ja_JP",
    url: SITE_URL,
    title: "aiment",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "aiment" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "aiment",
    description: DEFAULT_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // UI ver0.3: dark mode is retired, the app is light only.
    // data-ui="0.4" で app/styles/v04.css が効く（UI ver0.4 が既定）
    <html
      lang="ja"
      data-theme="light"
      data-ui="0.4"
      style={{ colorScheme: "light" }}
      className={`${roundedJp.variable} ${roundedLatin.variable} ${sansTc.variable} ${sansKr.variable}`}
    >
      <body className="antialiased">
        <UserSessionProvider>
          <I18nProvider>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
          </I18nProvider>
        </UserSessionProvider>
      </body>
    </html>
  );
}
