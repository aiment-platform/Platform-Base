import { test, expect, request } from "@playwright/test";
import { signup, createSession } from "./helpers";

// Phase 0 の疎通確認: サーバ起動・ファイルストア・auth・枠作成APIが動くこと。
test.describe("smoke", () => {
  test("home page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });

  test("debug store reports file backend (no DATABASE_URL)", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get("/api/debug/store");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { backend: string };
    // E2E はファイルストアで動くのが前提
    expect(body.backend).toBe("file");
    await api.dispose();
  });

  test("vtuber can sign up and create a session", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const vtuber = await signup(api, { role: "vtuber" });
    expect(vtuber.id).toContain("vtuber-");
    const session = await createSession(api);
    expect(session.sessionId).toBeTruthy();
    await api.dispose();
  });
});
