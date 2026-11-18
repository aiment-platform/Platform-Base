import type { NextConfig } from "next";

// Stripe Elements + Google Pay に必要な CSP ディレクティブ
// https://docs.stripe.com/security/guide#content-security-policy
const stripeCsp = [
  "https://js.stripe.com",
  "https://m.stripe.network",
  "https://m.stripe.com",
].join(" ");

// R2 の公開画像配信元を img-src に許可する。
// R2_PUBLIC_BASE_URL の origin を厳密に使い、未設定時のみ r2.dev を広く許可する。
function resolveR2ImgSrc() {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base) {
    try {
      return new URL(base).origin;
    } catch {
      // 不正な値が入っていた場合はフォールバックする
    }
  }
  return "https://*.r2.dev";
}

const r2ImgSrc = resolveR2ImgSrc();

// Google ログインのユーザーはアイコンが Google のプロフィール画像(lh3.googleusercontent.com)になる。
const googleAvatarOrigin = "https://lh3.googleusercontent.com";

// next/image で外部画像を最適化できるホスト。ここに無いホストは /_next/image が 400 を返す。
const remoteImagePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: new URL(googleAvatarOrigin).hostname },
  // 未設定時のフォールバック "https://*.r2.dev" は next/image では "**.r2.dev" と書く
  r2ImgSrc === "https://*.r2.dev"
    ? { protocol: "https", hostname: "**.r2.dev" }
    : {
        protocol: new URL(r2ImgSrc).protocol === "http:" ? "http" : "https",
        hostname: new URL(r2ImgSrc).hostname,
      },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remoteImagePatterns,
  },
  // 画面側(OptimizedImage)で「最適化に回してよい画像か」を同じ条件で判定するために渡す。
  env: {
    NEXT_PUBLIC_REMOTE_IMAGE_PATTERNS: JSON.stringify(remoteImagePatterns),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${stripeCsp} https://pay.google.com https://accounts.google.com`,
              `frame-src 'self' ${stripeCsp} https://pay.google.com`,
              `connect-src 'self' ${stripeCsp} https://api.stripe.com https://api.frankfurter.app https://*.livekit.cloud wss://*.livekit.cloud`,
              `img-src 'self' data: blob: https://*.stripe.com ${r2ImgSrc} ${googleAvatarOrigin}`,
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
