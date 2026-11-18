import Image, { type ImageProps } from "next/image";

type RemotePattern = { protocol?: string; hostname: string };

// next.config.ts の images.remotePatterns と同じ値（ビルド時に埋め込まれる）。
function readRemotePatterns(): RemotePattern[] {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_REMOTE_IMAGE_PATTERNS ?? "[]") as RemotePattern[];
  } catch {
    return [];
  }
}

const REMOTE_PATTERNS = readRemotePatterns();

function matchesHostname(pattern: string, hostname: string) {
  // "**.r2.dev" はサブドメイン任意（next/image の書き方に合わせる）
  if (pattern.startsWith("**.")) return hostname.endsWith(pattern.slice(2));
  return pattern === hostname;
}

/**
 * /_next/image で縮小・変換してよい画像か。
 * 許可していないホストを渡すと /_next/image が 400 を返して画像が壊れるので、
 * そういう画像（data:/blob: や想定外のホスト、SVG）は元の URL のまま表示する。
 */
export function canOptimizeImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return !src.toLowerCase().split("?")[0].endsWith(".svg");
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return REMOTE_PATTERNS.some(
    (p) => (!p.protocol || `${p.protocol}:` === url.protocol) && matchesHostname(p.hostname, url.hostname),
  );
}

type OptimizedImageProps = Omit<ImageProps, "src" | "alt"> & { src: string; alt: string };

/**
 * サムネイルやアイコン用の画像。元画像が数 MB あっても表示サイズに合わせて縮小して配信する。
 * width/height は表示サイズの目安（実際の大きさは className / CSS で決める）。
 */
export function OptimizedImage({ src, alt, unoptimized, ...props }: OptimizedImageProps) {
  return <Image src={src} alt={alt} unoptimized={unoptimized ?? !canOptimizeImage(src)} {...props} />;
}
