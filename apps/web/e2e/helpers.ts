import { type APIRequestContext, type BrowserContext, expect } from "@playwright/test";

// app 側のモジュールは Playwright の TS 解決と衝突するため import しない。
type UserRole = "vtuber" | "listener";

// セッションCookieは userId そのもの（auth.ts SESSION_COOKIE="aiment_dev_session"）。
export const SESSION_COOKIE = "aiment_dev_session";

let counter = 0;
/** 衝突しない一意なメール/名前を生成する（ファイルストアは実行間で永続するため）。 */
export function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export type TestUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** signup APIでユーザーを作成し、id/メール等を返す。レスポンスでセッションCookieが付く。 */
export async function signup(
  api: APIRequestContext,
  opts: { role: UserRole; name?: string; channelName?: string },
): Promise<TestUser> {
  const email = `${unique("e2e")}@example.com`;
  const name = opts.name ?? unique(opts.role);
  const res = await api.post("/api/auth/signup", {
    data: {
      role: opts.role,
      name,
      email,
      password: "test-pass-1234",
      provider: "password",
      channelName: opts.role === "vtuber" ? (opts.channelName ?? name) : undefined,
      termsAccepted: true,
      privacyAccepted: true,
    },
  });
  expect(res.ok(), `signup failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { user: { id: string } };
  return { id: body.user.id, name, email, role: opts.role };
}

/** APIコンテキストのセッションCookieをブラウザコンテキストへ適用する。 */
export async function applySession(
  api: APIRequestContext,
  context: BrowserContext,
  baseURL: string,
) {
  const state = await api.storageState();
  const cookies = state.cookies.filter((c) => c.name === SESSION_COOKIE);
  if (cookies.length === 0) throw new Error("No session cookie found on API context");
  const url = new URL(baseURL);
  await context.addCookies(
    cookies.map((c) => ({ ...c, domain: url.hostname, path: "/" })),
  );
}

/** 配信枠を作成する（vtuberのセッションCookieが必要）。作成した session を返す。 */
export async function createSession(
  api: APIRequestContext,
  overrides: Record<string, unknown> = {},
) {
  const res = await api.post("/api/stream-sessions", {
    data: {
      title: unique("枠"),
      description: "e2e test session",
      category: "雑談",
      slotsTotal: 5,
      speakerSlotsTotal: 3,
      startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      ...overrides,
    },
  });
  expect(res.ok(), `createSession failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { session: Record<string, unknown> };
  return body.session;
}

/** 予約を作成する（speaker/listener）。レスポンス（status/body）をそのまま返す。 */
export async function reserve(
  api: APIRequestContext,
  sessionId: string,
  type: "speaker" | "listener",
) {
  return api.post(`/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations`, {
    data: { type },
  });
}

/** 配信を開始する（vtuberホスト）。 */
export async function startSession(api: APIRequestContext, sessionId: string) {
  return api.post(`/api/stream-sessions/${encodeURIComponent(sessionId)}/start`);
}

/** LiveKitトークンをリクエストする。 */
export async function requestToken(
  api: APIRequestContext,
  sessionId: string,
  role: "vtuber" | "speaker" | "listener",
) {
  return api.post("/api/livekit/token", { data: { sessionId, role } });
}
