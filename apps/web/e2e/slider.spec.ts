import { test, expect, request } from "@playwright/test";
import { signup, createSession, unique } from "./helpers";

// Phase 1: 枠カードのスライダ（バー）が「残り枠数」に対応していることを検証する。
// 修正前はバー幅が日本語レベル(AJL)由来だった。満枠の新規枠なら残り=100%になり、
// AJL由来(レベル1なら約11%)とは明確に区別できる。
test("session card slider reflects remaining slots, not AJL level", async ({ page, baseURL }) => {
  const api = await request.newContext({ baseURL });
  await signup(api, { role: "vtuber" });
  const title = unique("スライダ枠");
  await createSession(api, {
    title,
    speakerSlotsTotal: 4,
    japaneseLevel: 1, // 旧実装ならバーは約11%になるはず
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  await api.dispose();

  await page.goto("/");
  const card = page.locator(".aiment-session-card", { hasText: title }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  // 満枠（残り4/4）なのでスライダは100%。CSS変数 --slot-progress で確認。
  const style = await card.getAttribute("style");
  expect(style).toContain("--slot-progress: 100%");
});
