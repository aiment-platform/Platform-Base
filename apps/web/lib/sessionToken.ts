// セッションCookieの値を署名付きトークンにする。
// 以前は userId をそのまま入れていたため、Cookieを書き換えるだけで他人になりすませた。
// proxy.ts(ミドルウェア)とサーバー側の両方から使うため Web Crypto のみで実装する。
//
// 形式: v1.<base64url(userId)>.<有効期限(UNIX秒)>.<base64url(HMAC-SHA256)>

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const VERSION = "v1";
// 開発・E2E専用。本番で SESSION_SECRET が未設定なら署名も検証もしない(全員未ログイン扱い)。
const DEV_FALLBACK_SECRET = "aiment-dev-only-session-secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  return process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_SECRET;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function importKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSessionToken(userId: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${VERSION}.${toBase64Url(encoder.encode(userId))}.${expiresAt}`;
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** 署名と有効期限が正しければ userId を返す。改ざん・期限切れ・旧形式は null。 */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  const [, encodedUserId, expiresAtRaw, encodedSignature] = parts;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;

  const signature = fromBase64Url(encodedSignature);
  const userIdBytes = fromBase64Url(encodedUserId);
  if (!signature || !userIdBytes) return null;

  // subtle.verify は定数時間で比較する
  const valid = await crypto.subtle.verify(
    "HMAC",
    await importKey(secret),
    signature,
    encoder.encode(`${VERSION}.${encodedUserId}.${expiresAtRaw}`),
  );
  if (!valid) return null;

  const userId = decoder.decode(userIdBytes);
  return userId || null;
}
