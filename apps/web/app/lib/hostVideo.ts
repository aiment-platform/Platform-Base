/**
 * 配信者の「映像を止める」マスタースイッチ。
 *
 * 配信の映像はすべて OBS（Ingress）から来る。配信者がこのスイッチを切ると、
 * 配信者自身の LiveKit 参加者属性（attributes）にこの印を立てる。属性は
 * あとから入ってきた視聴者にも届くので、視聴者側はこれを見て OBS 映像の
 * 受信そのものを止め（unsubscribe）、代わりに「映像停止中」の画面を出す。
 *
 * 属性を書き換えられるのは canUpdateOwnMetadata を持つ配信者トークンだけ
 * （packages/livekit/src/tokens.ts）。視聴者・スピーカーは書き換えられない。
 */
export const HOST_VIDEO_HIDDEN_ATTR = "aiment.videoHidden";

export function isHostVideoHidden(attributes: Readonly<Record<string, string>> | undefined) {
  return attributes?.[HOST_VIDEO_HIDDEN_ATTR] === "1";
}

/** OBS（Ingress）が入れる参加者かどうか。identity の頭で見分ける。 */
export function isIngressIdentity(identity: string) {
  return identity.startsWith("obs-") || identity.startsWith("ingress-");
}
