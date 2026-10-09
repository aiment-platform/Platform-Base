# DBバックアップ運用

本番Neon DBを毎日 `pg_dump` し、Cloudflare R2の**非公開バケット**に保存する。
ワークフロー: `.github/workflows/db-backup.yml`(毎日 03:00 JST + 手動実行可)

## なぜ必要か

- Neon無料プランは過去に巻き戻せる期間が短い。誤削除やバグに気づくのが翌日以降だと戻せない
- Neonと別の場所に世代を持っておけば、Neon側で何かあってもデータは残る

## 初回セットアップ(手作業)

### 1. R2: バックアップ専用バケットを作る

- Cloudflare → R2 → Create bucket(例: `aiment-db-backups`)
- **Public access は絶対に有効にしない**。画像用バケット(公開)とは必ず分ける
  (ダンプにはメールアドレス等の個人情報が入る)
- Settings → Object lifecycle rules → prefix `db-backups/` を **30日後に削除**
- R2 → Manage API tokens → **このバケットだけ**に Object Read & Write 権限のトークンを発行

### 2. Neon: 接続文字列を用意する

- Neon コンソール → Connect → **Pooled connection をオフ**にした接続文字列(ホスト名に `-pooler` が付かない方)
  - pg_dump はプーラー経由だと失敗することがある
- (推奨)読み取り専用ロールを作って使う。SQL Editor で:
  ```sql
  CREATE ROLE backup_reader WITH LOGIN PASSWORD '<十分長いランダム文字列>';
  GRANT pg_read_all_data TO backup_reader;
  ```

### 3. GitHub: Secrets を登録する

`aiment-platform/Platform-Base` → Settings → Secrets and variables → Actions

| Secret | 値 |
|---|---|
| `BACKUP_DATABASE_URL` | 手順2の接続文字列 |
| `R2_BACKUP_ACCOUNT_ID` | CloudflareのアカウントID |
| `R2_BACKUP_ACCESS_KEY_ID` | 手順1のトークンの Access Key ID |
| `R2_BACKUP_SECRET_ACCESS_KEY` | 手順1のトークンの Secret Access Key |
| `R2_BACKUP_BUCKET` | `aiment-db-backups` |

### 4. 動作確認

Actions → DB Backup → Run workflow で手動実行し、R2の `db-backups/` にファイルができることを確認する。

## 転送量について

pg_dump の読み出しもNeonの転送量(無料枠 月5GB)に計上される。
DBサイズ × 30日 が毎月かかるため、ワークフローはDBが `MAX_DB_MB`(200MB)を超えていたら失敗して止まる。
止まった場合は、まず画像のbase64がDBに残っていないか確認する(`apps/web/scripts/migrate-base64-images.mjs`)。

## リストア手順

**いきなり本番に戻さない。** まず新しいNeonブランチに戻して中身を確認する。

1. R2から対象日のダンプをダウンロード
2. Neon コンソール → Branches → 空のブランチを作成し、その接続文字列を取得
3. 復元:
   ```bash
   docker run --rm -v "$PWD:/in" postgres:18 \
     pg_restore --no-owner --no-privileges --dbname "<復元先の接続文字列>" /in/<ファイル名>.dump
   ```
4. 中身を確認してから、必要なデータだけ本番に戻す / 本番の接続先を切り替える

## 開発環境と本番DBの分離

- ローカルの `apps/web/.env.local` やVercelの Preview 環境に**本番の `DATABASE_URL` を入れない**
- 開発用には Neon の「ブランチ」機能で本番のコピーを作り、その接続文字列を使う
- `DATABASE_URL` 未設定ならローカルはファイルストア(`apps/web/data`)で動く
