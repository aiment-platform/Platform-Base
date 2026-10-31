import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Nunito } from "next/font/google";
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
const roundedLatin = Nunito({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
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
    // data-ui="0.4" で app/styles/v04.css が効く（UI ver0.4 が既定）
    <html
      lang="ja"
      data-theme="light"
      data-ui="0.4"
      style={{ colorScheme: "light" }}
      className={`${roundedJp.variable} ${roundedLatin.variable}`}
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
