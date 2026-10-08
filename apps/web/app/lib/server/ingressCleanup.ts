import { deleteRtmpIngress } from "@repo/livekit";
import type { StreamSession } from "../apiTypes";
import { clearSessionIngress } from "./aimentStore";

/**
 * 配信枠に紐づくOBS用のLiveKit Ingressを削除し、DBの配信キーを消す。
 * 管理者が強制終了・削除したときに、OBSが送り続けてLiveKitの枠を消費しないようにするため。
 * Ingressが既に無い・LiveKit未設定でも、終了/削除自体は止めない(残留は /admin/ingresses で掃除できる)。
 */
export async function releaseSessionIngress(session: StreamSession) {
  if (!session.ingressId) return;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (apiKey && apiSecret && host) {
    try {
      await deleteRtmpIngress({ apiKey, apiSecret, host, ingressId: session.ingressId });
    } catch (err) {
      console.error("[admin] failed to delete ingress:", session.ingressId, err);
    }
  }
  await clearSessionIngress(session.sessionId);
}
