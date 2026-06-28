import { defineConfig, devices } from "@playwright/test";

// E2E はファイルストアfallback（DATABASE_URL未設定）で決定的に実行する。
// LiveKit 等の実メディアは扱わず、アプリ層のフロー（予約・支払い・権限ゲート・
// 一覧/詳細・スライダ整合）を検証する。
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Next の tsconfig は moduleResolution:"bundler" で Playwright のローダーと衝突するため
  // e2e 専用 tsconfig（node 解決）を使う。
  tsconfig: "./e2e/tsconfig.json",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // DATABASE_URL を空にしてファイルストアで起動（本番DBに触れない）。
    command: `DATABASE_URL= E2E=1 next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "",
      E2E: "1",
      // ダミーのLiveKit設定。token routeの env チェックを通し、入室ゲート(予約/プラン/
      // live判定)を検証できるようにする。JWT署名はローカルのみでネットワーク不要。
      // ingress(ネットワークを伴う)は到達後に失敗するため権限ゲートのみ検証する。
      LIVEKIT_API_KEY: "e2e-dummy-key",
      LIVEKIT_API_SECRET: "e2e-dummy-secret-e2e-dummy-secret",
      NEXT_PUBLIC_LIVEKIT_URL: "wss://127.0.0.1:7880",
    },
  },
});
