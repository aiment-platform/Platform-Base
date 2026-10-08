import { deleteRoom, deleteRtmpIngress } from "@repo/livekit";
import type { StreamSession } from "../apiTypes";
import { clearSessionIngress } from "./aimentStore";

function getLivekitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  return apiKey && apiSecret && host ? { apiKey, apiSecret, host } : null;
}

/**
 * 管理者が配信を強制終了・削除したときの後片付け。
 * - LiveKitのルームを閉じて、ブラウザ配信のホスト・スピーカー・視聴者を全員切断する
 * - OBS用のIngressを削除し、DBの配信キーを消す(OBSが送り続けて枠を消費しないように)
 * どちらも失敗しても終了/削除自体は止めない(残ったIngressは /admin/ingresses で掃除できる)。
 */
export async function releaseSessionMedia(session: StreamSession) {
  const config = getLivekitConfig();
  if (config) {
    try {
      await deleteRoom({ ...config, roomName: session.sessionId });
    } catch (err) {
      console.error("[admin] failed to close LiveKit room:", session.sessionId, err);
    }
  }

  if (!session.ingressId) return;
  if (config) {
    try {
      await deleteRtmpIngress({ ...config, ingressId: session.ingressId });
    } catch (err) {
      console.error("[admin] failed to delete ingress:", session.ingressId, err);
    }
  }
  // 処理中に回線切替で新しいIngressに替わっていたら、そちらの情報は消さない
  await clearSessionIngress(session.sessionId, session.ingressId);
}
