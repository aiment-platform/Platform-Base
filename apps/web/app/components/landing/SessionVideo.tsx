/**
 * 実際のセッション映像。/lp・/for-mates・/for-vtubers の「実際のセッション」欄で共用する。
 *
 * 自動再生はしない（音が出るので、押した人だけが見る）。preload="metadata" で
 * 最初は長さなどの情報だけ読み、本体は再生したときに読み込む。
 * 素材：aiment公式Xに投稿したセッションの切り抜き（1280x720・約35秒）。
 */
export const SESSION_VIDEO = {
  src: "/media/session-sample.mp4",
  poster: "/media/session-sample.jpg",
};

export function SessionVideo({ label }: { label: string }) {
  return (
    <div className="landing-video landing-video--live mt-[var(--ld-head-gap)]">
      <video controls playsInline preload="metadata" poster={SESSION_VIDEO.poster} aria-label={label}>
        <source src={SESSION_VIDEO.src} type="video/mp4" />
      </video>
    </div>
  );
}
