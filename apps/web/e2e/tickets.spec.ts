import { test, expect, request } from "@playwright/test";
import { signup, createSession, reserve } from "./helpers";

// 参加チケット（支払いスキップ）の権限ゲートとエラー経路を検証する。
// 付与→使用のハッピーパスは ADMIN_USER_IDS（環境変数・動的id）が絡むため別途ライブ検証。
test.describe("participation tickets", () => {
  test("non-admin cannot grant tickets", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    const hostUser = await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    const res = await host.post("/api/admin/tickets", {
      data: { userId: hostUser.id, scope: "session", sessionId: session.sessionId, quantity: 1 },
    });
    expect(res.status()).toBe(403);
    await host.dispose();
  });

  test("redeem requires authentication", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    await host.dispose();

    const anon = await request.newContext({ baseURL });
    const res = await anon.post(
      `/api/stream-sessions/${encodeURIComponent(session.sessionId as string)}/reservations/redeem-ticket`,
    );
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test("redeem without a reservation is rejected", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    await host.dispose();

    const u = await request.newContext({ baseURL });
    await signup(u, { role: "listener" });
    const res = await u.post(
      `/api/stream-sessions/${encodeURIComponent(session.sessionId as string)}/reservations/redeem-ticket`,
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("予約");
    await u.dispose();
  });

  test("redeem with a reservation but no ticket is rejected", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    await host.dispose();

    const u = await request.newContext({ baseURL });
    await signup(u, { role: "listener" });
    const r = await reserve(u, session.sessionId as string, "speaker");
    expect(r.status()).toBe(201);
    const res = await u.post(
      `/api/stream-sessions/${encodeURIComponent(session.sessionId as string)}/reservations/redeem-ticket`,
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("チケット");
    await u.dispose();
  });
});
