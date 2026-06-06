interface IpApiResponse {
  status: string;
  countryCode: string;
  proxy: boolean;
  hosting: boolean;
}

export type JapaneseCheckResult =
  | { ok: true }
  | { ok: false; reason: "vpn" | "overseas" | "lookup_failed" };

const cache = new Map<string, { result: JapaneseCheckResult; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const PRIVATE_PREFIXES = ["127.", "::1", "192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.3"];

function isPrivateIp(ip: string) {
  return PRIVATE_PREFIXES.some((p) => ip.startsWith(p));
}

export async function checkJapaneseIP(ip: string): Promise<JapaneseCheckResult> {
  if (isPrivateIp(ip)) return { ok: true };

  const hit = cache.get(ip);
  if (hit && hit.expiresAt > Date.now()) return hit.result;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,proxy,hosting`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data: IpApiResponse = await res.json();

    let result: JapaneseCheckResult;
    if (data.status !== "success") {
      result = { ok: false, reason: "lookup_failed" };
    } else if (data.proxy || data.hosting) {
      result = { ok: false, reason: "vpn" };
    } else if (data.countryCode !== "JP") {
      result = { ok: false, reason: "overseas" };
    } else {
      result = { ok: true };
    }

    cache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return { ok: false, reason: "lookup_failed" };
  }
}

export function getClientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export const JP_CHECK_MESSAGES: Record<"vpn" | "overseas" | "lookup_failed", string> = {
  vpn: "VPNを切ってから再度お試しください。",
  overseas: "日本からのアクセスのみ申請できます。",
  lookup_failed: "ネットワーク確認後、再度お試しください。",
};
