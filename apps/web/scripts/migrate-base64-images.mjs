// DBに base64 データURL のまま残っている画像を R2 に移し、DBの値を公開URLに差し替える一度きりのスクリプト。
// (#118 以降の新規アップロードはR2に直接保存されるため、それ以前のデータが対象)
//
// 使い方(apps/web で実行):
//   node --env-file=.env.migrate scripts/migrate-base64-images.mjs          # 確認のみ(件数とサイズを表示)
//   node --env-file=.env.migrate scripts/migrate-base64-images.mjs --apply  # 実行
//
// .env.migrate に必要な値: DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
// 実行前に必ず DB バックアップ(docs/db-backup.md)を取ること。

import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// 識別子はSQLパラメータにできないため、ここに列挙したものだけを扱う。
const TARGETS = [
  { table: "users", column: "avatar_url", folder: "avatars" },
  { table: "users", column: "header_url", folder: "headers" },
  { table: "stream_sessions", column: "thumbnail", folder: "thumbnails" },
];

const apply = process.argv.includes("--apply");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`環境変数 ${name} が設定されていません`);
    process.exit(1);
  }
  return value;
}

// app/api/uploads/route.ts と同じ判定(申告のMIMEではなく中身で判定する)
function sniffImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  if (bytes.length >= 6 && bytes.subarray(0, 3).toString("ascii") === "GIF") {
    return { mime: "image/gif", ext: "gif" };
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

function decodeDataUrl(value) {
  const match = /^data:[^;,]*;base64,(.*)$/s.exec(value);
  return match ? Buffer.from(match[1], "base64") : null;
}

const sql = neon(requireEnv("DATABASE_URL"));

async function report() {
  let total = 0;
  for (const { table, column } of TARGETS) {
    // 本体は読まずに件数と長さだけを取る(確認だけで転送量を使わないため)
    const [row] = await sql.query(
      `SELECT count(*)::int AS count, coalesce(sum(octet_length(${column})), 0)::bigint AS bytes
       FROM ${table} WHERE ${column} LIKE 'data:%'`,
    );
    const mb = (Number(row.bytes) / 1024 / 1024).toFixed(1);
    console.log(`${table}.${column}: ${row.count}件 / ${mb}MB`);
    total += row.count;
  }
  return total;
}

async function migrate() {
  const bucket = requireEnv("R2_BUCKET");
  const publicBaseUrl = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  let migrated = 0;
  let skipped = 0;
  for (const { table, column, folder } of TARGETS) {
    const ids = await sql.query(`SELECT id FROM ${table} WHERE ${column} LIKE 'data:%'`);
    for (const { id } of ids) {
      // 1件ずつ読む(全件を一度にメモリへ載せない)
      const [row] = await sql.query(`SELECT ${column} AS value FROM ${table} WHERE id = $1`, [id]);
      const value = row?.value;
      if (typeof value !== "string" || !value.startsWith("data:")) continue;

      const bytes = decodeDataUrl(value);
      const sniffed = bytes ? sniffImageType(bytes) : null;
      if (!bytes || !sniffed) {
        console.warn(`skip ${table}.${column} id=${id}: 画像として読めないデータ`);
        skipped += 1;
        continue;
      }

      const key = `${folder}/${randomUUID()}.${sniffed.ext}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: sniffed.mime,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      // 読んでから書くまでの間にユーザーが画像を変えていたら上書きしない
      const md5 = createHash("md5").update(value).digest("hex");
      const updated = await sql.query(
        `UPDATE ${table} SET ${column} = $1 WHERE id = $2 AND md5(${column}) = $3 RETURNING id`,
        [`${publicBaseUrl}/${key}`, id, md5],
      );
      if (updated.length === 0) {
        console.warn(`skip ${table}.${column} id=${id}: 処理中に値が変更された`);
        skipped += 1;
        continue;
      }
      migrated += 1;
      console.log(`ok ${table}.${column} id=${id} → ${key} (${(bytes.length / 1024).toFixed(0)}KB)`);
    }
  }
  console.log(`\n完了: ${migrated}件を移行 / ${skipped}件をスキップ`);
}

const remaining = await report();
if (remaining === 0) {
  console.log("\nbase64の画像は残っていません。移行は不要です。");
} else if (!apply) {
  console.log("\n確認のみ実行しました。移行するには --apply を付けて実行してください。");
} else {
  console.log("\n移行を開始します...");
  await migrate();
  await report();
}
