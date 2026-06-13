# Aiment 配信・ストレージ基盤 実装計画

最終更新: 2026-06-12
関連規約: [aiment 開発規約](https://www.notion.so/30309a68050b804fa05aeb66f7929d88)

---

## 1. 背景・課題

Neon DB の **データ転送量(egress)超過 (HTTP 402)** が発生。

```
Server error (HTTP status 402): Your project has exceeded the data transfer quota.
```

### 真因
- 画像(サムネ・アバター・ヘッダー)を **base64 データURLのまま DB に保存**している
  - `apps/web/app/studio/pre-live/page.tsx` ほか `reader.readAsDataURL(file)`
  - 4MB画像 → base64で約5.3MB が `thumbnail TEXT` / `avatar_url TEXT` に格納
- リスト取得が画像本体を**毎回フル返却**している
  - `apps/web/app/lib/server/aimentStore.ts` `LIST_COLUMNS` に `s.thumbnail`, `u.avatar_url`
- ホーム(`app/page.tsx`)はクライアント取得でキャッシュ無し → 訪問の度に再取得

### 試算
| | egress/月 |
|---|---|
| 現状 | 約 75 GB(無料枠5GBの15倍) |
| 対策後 | < 0.2 GB(99.7%減) |

---

## 2. アーキテクチャ選定

| レイヤー | 採用 | 役割 |
|---|---|---|
| リアルタイム層 | LiveKit(現状維持) | 登壇者の通話・画面共有(WebRTC) |
| 配信層 | Cloudflare Stream(新規) | HLSで大人数配信 + 自動録画(VOD) |
| 橋渡し | LiveKit Egress → RTMP | LiveKitルームをStreamへ中継 |
| 画像ストレージ | Cloudflare R2(新規) | サムネ・アバター・ヘッダー。egress無料 |
| 動画アーカイブ | Stream内蔵録画 | 別途ストレージ不要 |
| DB | Neon(現状維持) | メタデータのみ(URL・ID・予約・ユーザー) |

**設計原則**: 重いバイナリ(画像・動画)は専用CDNストレージへ。DBはURLとIDだけを持つ。

### コスト
- R2: 10GB・書込100万・読込1000万/月 無料、**egress無料**
- Stream: $5/1000分保存・$1/1000分配信、取込/エンコード/egressは無料
- Neon: 画像が抜けることで無料枠に大幅な余裕

---

## 3. 課題 → 対処 対応表

| # | 課題 | 対処 | 優先 |
|---|---|---|---|
| A | Neon egress超過(402) | 画像をR2へ移行、DBはURLのみ | ★最優先 |
| B | 既存base64データの残存 | 一度きりの移行スクリプト(decode→R2→URL差替) | ★最優先 |
| C | 大人数配信ができない | Stream Live + LiveKit Egress RTMP中継 | 中 |
| D | アーカイブ視聴の仕組みが無い | Stream自動録画のVOD UIDをDB保持・再生UI | 中 |
| E | コールドスタートが重い(compute) | initSchemaをスキーマバージョン管理で1クエリ化 | 低 |
| F | 10秒DBポーリング | 廃止 or 60秒化 + ホームISR化 | 低 |

> 注: 402(転送量)の主因は A/B。E/F は compute 側の別課題で、転送量超過とは別軸。

---

## 4. 実装ロードマップ

| Phase | 内容 | 対応課題 | 担当 |
|---|---|---|---|
| 0 | Cloudflare: R2バケット作成・カスタムドメイン・APIトークン・Vercel env登録 | A | 手作業 |
| 1 | 署名付きURL発行API + `readAsDataURL`箇所をR2アップロードに置換 | A | 実装 |
| 2 | 既存base64データのR2移行スクリプト | B | 実装 |
| 3 | Stream Live Input発行 + LiveKit Egress RTMP中継 + DB列追加 | C・D | 実装 |
| 4 | アーカイブVOD再生UI | D | 実装 |
| 5(任意) | initSchema 1クエリ化 / ポーリング見直し / ホームISR | E・F | 実装 |

### Phase 0 で必要な環境変数(Vercel)
```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET            # 例: aiment-assets
R2_PUBLIC_BASE_URL   # 例: https://cdn.aiment.xxx
```

### アップロード方式: サーバー経由(確定 2026-06-12)
- ブラウザ → Vercel API(`/api/uploads`)→ R2(S3 SDK PutObject)→ public URL返却
- 理由: 画像は≤4MB制限済でVercel 4.5MB上限内・低頻度・火消し優先・CORS不要
- 将来大ファイルをR2直送する要件が出たら署名付きURLへ差替(API内部のみ変更)
- 動画の大ファイルは R2 ではなく Stream 直接アップロードAPIを使う想定

### 使用ライブラリ(Phase 1)
- `@aws-sdk/client-s3`(R2はS3互換)
- 署名付きURLを採用する場合のみ `@aws-sdk/s3-request-presigner`

---

## 5. ブランチ・進め方(開発規約準拠)

- 作業は必ず `main` から新ブランチ。main直コミット禁止、PR経由のみ
- ブランチ名:
  - Phase 1: `feature/r2-image-storage`
  - Phase 2: `feature/r2-migrate-base64`
  - Phase 3: `feature/cloudflare-stream-live`
- コミット: `feat:` / `fix:` / `refactor:` / `docs:` 形式
- DoD: 動作確認済 / PRレビュー済 / main取込後も動く

---

## 6. 残論点(着手前に確定)

1. 最優先は A(R2火消し)で確定か → 推奨: R2先行
2. アーカイブは Stream内蔵録画方式でよいか(生MP4自前所有なら LiveKit Egress→R2 を追加)
3. LiveKit は自前ホスト or LiveKit Cloud か(Egress設定先が変わる)
