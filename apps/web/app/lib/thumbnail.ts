/**
 * 配信枠のサムネイルの表示用URLを決める。
 *
 * サムネをアップロードしていない枠（空文字）や、以前のサンプル画像
 * （/image/thumbnail/thumbnail_1〜5.png、もう配っていない）を指している枠は、
 * aiment のプレースホルダー画像に差し替える。データの出口（aimentStore）で
 * 一度だけ通すので、表示側の各コンポーネントは thumbnail をそのまま使える。
 */
export const PLACEHOLDER_THUMBNAIL = "/image/thumbnail/placeholder.svg";

const RETIRED_SAMPLE_THUMBNAIL = /^\/image\/thumbnail\/thumbnail_\d+\.png$/;

export function resolveThumbnail(thumbnail: string | null | undefined) {
  const value = (thumbnail ?? "").trim();
  if (!value || RETIRED_SAMPLE_THUMBNAIL.test(value)) return PLACEHOLDER_THUMBNAIL;
  return value;
}

/** アップロードされた画像かどうか（プレースホルダーは「未設定」扱い）。 */
export function hasCustomThumbnail(thumbnail: string | null | undefined) {
  return resolveThumbnail(thumbnail) !== PLACEHOLDER_THUMBNAIL;
}
