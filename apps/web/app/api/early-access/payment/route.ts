// SOLID: S（アーリーアクセス決済は廃止済み。導線を完全に無効化する）
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// アーリーアクセスの支払いは終了したため、PaymentIntent は一切生成しない。
// 直接APIを叩かれても決済が始まらないよう 410 Gone を返す。
export async function POST() {
  return NextResponse.json(
    { error: "アーリーアクセスのお支払いは終了しました。" },
    { status: 410 },
  );
}
