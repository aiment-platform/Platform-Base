import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Nunito } from "next/font/google";
import "./globals.css";
import { RouteTransitionProvider } from "./components/ui/RouteTransition";
import { UiVersionToggle } from "./components/ui/UiVersionToggle";
import { I18nProvider } from "./lib/i18n";
import { UI_VERSION_BOOT_SCRIPT } from "./lib/uiVersionBoot";
import { UserSessionProvider } from "./lib/userSession";

// UI ver0.4（試作）の丸い書体。CSS 変数として置くだけで、v04.css が使ったときだけ読み込まれる
// （preload: false なので、今の UI のままなら書体ファイルは1つもダウンロードされない）。
const roundedJp = M_PLUS_Rounded_1c({
  weight: ["500", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-rounded-jp",
});
const roundedLatin = Nunito({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-rounded-latin",
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
    // data-ui は描画前のスクリプトが付ける（UI ver0.4 の試作）。サーバーの HTML には無いので、
    // その食い違いの警告だけ止めている（suppressHydrationWarning は html 要素の属性にしか効かない）
    <html
      lang="ja"
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${roundedJp.variable} ${roundedLatin.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: UI_VERSION_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <UserSessionProvider>
          <I18nProvider>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
          </I18nProvider>
        </UserSessionProvider>
        {process.env.NODE_ENV !== "production" ? <UiVersionToggle /> : null}
      </body>
    </html>
  );
}
