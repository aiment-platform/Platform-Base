import type { NextConfig } from "next";

// Stripe Elements + Google Pay に必要な CSP ディレクティブ
// https://docs.stripe.com/security/guide#content-security-policy
const stripeCsp = [
  "https://js.stripe.com",
  "https://m.stripe.network",
  "https://m.stripe.com",
].join(" ");

const nextConfig: NextConfig = {
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
              `img-src 'self' data: blob: https://*.stripe.com`,
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
