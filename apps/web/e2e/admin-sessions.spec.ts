import { test, expect, request } from "@playwright/test";
import { signup, createSession, startSession } from "./helpers";

// 管理者用の配信管理API。E2Eでは ADMIN_USER_IDS が未設定なので、
// 「未設定なら誰も管理者として通さない」ことと、ホスト本人でも使えないことを検証する。
test.describe("admin session management", () => {
  test("requires login", async ({ baseURL }) => {
    const anon = await request.newContext({ baseURL });
    expect((await anon.get("/api/admin/sessions?status=live")).status()).toBe(401);
    await anon.dispose();
  });

  test("non-admin (even the host) cannot list, end or delete sessions", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    const sessionId = encodeURIComponent(session.sessionId as string);
    expect((await startSession(host, session.sessionId as string)).ok()).toBeTruthy();

    expect((await host.get("/api/admin/sessions?status=live")).status()).toBe(403);
    expect((await host.post(`/api/admin/sessions/${sessionId}/end`)).status()).toBe(403);
    expect((await host.delete(`/api/admin/sessions/${sessionId}`)).status()).toBe(403);
    await host.dispose();
  });
});
