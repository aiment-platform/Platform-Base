import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_FOLDERS = new Set(["thumbnails", "avatars", "headers"]);

type S3Module = {
  S3Client: new (config: unknown) => { send: (command: unknown) => Promise<unknown> };
  PutObjectCommand: new (input: unknown) => unknown;
};

async function loadS3Module(): Promise<S3Module> {
  try {
    const importer = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<S3Module>;
    return await importer("@aws-sdk/client-s3");
  } catch {
    throw new Error("S3 upload support is not installed. Install @aws-sdk/client-s3 to enable uploads.");
  }
}

// 実体(マジックバイト)から画像種別を判定する。クライアント申告のMIMEは信用しない。
function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  // GIF: "GIF8"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: "image/gif", ext: "gif" };
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

async function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 environment variables are not configured");
  }
  const { S3Client, PutObjectCommand } = await loadS3Module();
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, PutObjectCommand };
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();

    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "4MB以下の画像をアップロードしてください" }, { status: 400 });
    }

    // folder は許可リストで厳格検証(パストラバーサル防止)
    const folder = typeof folderRaw === "string" ? folderRaw : "";
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "保存先の指定が不正です" }, { status: 400 });
    }

    // 実体から種別を判定(クライアント申告のMIME/拡張子は使わない)
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json({ error: "jpeg/png/webp/gif のみアップロードできます" }, { status: 400 });
    }

    const bucket = process.env.R2_BUCKET;
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (!bucket || !publicBaseUrl) {
      return NextResponse.json({ error: "ストレージが設定されていません" }, { status: 500 });
    }

    const key = `${folder}/${crypto.randomUUID()}.${sniffed.ext}`;

    const { client, PutObjectCommand } = await getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: sniffed.mime,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = `${publicBaseUrl}/${key}`;
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "アップロードに失敗しました";
    const isAuthError =
      message === "Authentication required" || message === "No session user is configured";
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}
