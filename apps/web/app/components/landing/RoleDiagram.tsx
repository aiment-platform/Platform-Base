/**
 * VTuber・学習者・メイト・リスナーの関係図。
 *
 * セッションを「声の輪」「コメントの輪」「見る」の3層で描く。
 *   声で参加   … VTuber と学習者。メイトは回のスタイルによって後半や呼ばれたときに入る
 *   コメント   … メイトはここが基本の場所。リスナーもコメントできる
 *   見る       … リスナー
 * メイトから内側へ伸びる矢印が、このページでいちばん伝えたいこと。
 * 色は globals.css のトークン。影は使わない。
 */

const AVATARS = {
  learners: [
    { x: 248, y: 262 },
    { x: 320, y: 276 },
    { x: 392, y: 262 },
  ],
  mates: [
    { x: 128, y: 232 },
    { x: 512, y: 232 },
  ],
  listeners: [
    { x: 92, y: 384 },
    { x: 146, y: 400 },
    { x: 200, y: 386 },
    { x: 440, y: 386 },
    { x: 494, y: 400 },
    { x: 548, y: 384 },
  ],
};

export function RoleDiagram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 440"
      className={`role-diagram ${className}`.trim()}
      role="img"
      aria-label="関係図。声で参加するのはVTuberと学習者、メイトはコメントで参加し、必要なときや後半は声の輪に入る。リスナーは配信を見てコメントする。"
    >
      <defs>
        <marker id="rd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="rd-arrowhead" />
        </marker>
      </defs>

      {/* 3つの層 */}
      <rect x="20" y="20" width="600" height="400" rx="44" className="rd-layer rd-layer--outer" />
      <rect x="86" y="82" width="468" height="290" rx="36" className="rd-layer rd-layer--middle" />
      <rect x="176" y="136" width="288" height="188" rx="28" className="rd-layer rd-layer--inner" />

      <text x="44" y="52" className="rd-layer-label">
        見る
      </text>
      <text x="108" y="112" className="rd-layer-label">
        コメント
      </text>
      <text x="196" y="164" className="rd-layer-label rd-layer-label--inner">
        声で参加
      </text>

      {/* VTuber */}
      <g className="rd-node rd-node--vtuber">
        <circle cx="320" cy="200" r="26" />
        <text x="320" y="204" textAnchor="middle" className="rd-avatar-text">
          V
        </text>
        <text x="320" y="246" textAnchor="middle" className="rd-name">
          VTuber
        </text>
      </g>

      {/* 学習者 */}
      {AVATARS.learners.map((point, index) => (
        <g key={`l-${index}`} className="rd-node rd-node--learner">
          <circle cx={point.x} cy={point.y} r="17" />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className="rd-avatar-text">
            {["A", "M", "L"][index]}
          </text>
        </g>
      ))}
      <text x="320" y="312" textAnchor="middle" className="rd-name">
        学習者
      </text>

      {/* メイト：コメントの輪にいて、必要なときは内側へ */}
      {AVATARS.mates.map((point, index) => (
        <g key={`m-${index}`} className="rd-node rd-node--mate">
          <circle cx={point.x} cy={point.y} r="20" />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className="rd-avatar-text">
            {["S", "K"][index]}
          </text>
          <text x={point.x} y={point.y + 40} textAnchor="middle" className="rd-name">
            メイト
          </text>
        </g>
      ))}
      <path d="M 152 226 C 175 214, 190 210, 214 206" className="rd-arrow" markerEnd="url(#rd-arrow)" />
      <path d="M 488 226 C 465 214, 450 210, 426 206" className="rd-arrow" markerEnd="url(#rd-arrow)" />
      <text x="128" y="296" textAnchor="middle" className="rd-note">
        必要なとき、
      </text>
      <text x="128" y="312" textAnchor="middle" className="rd-note">
        後半は中へ
      </text>
      <text x="512" y="296" textAnchor="middle" className="rd-note">
        回によって
      </text>
      <text x="512" y="312" textAnchor="middle" className="rd-note">
        最初から中へ
      </text>

      {/* リスナー */}
      {AVATARS.listeners.map((point, index) => (
        <circle key={`v-${index}`} cx={point.x} cy={point.y} r="9" className="rd-node--listener" />
      ))}
      <text x="320" y="398" textAnchor="middle" className="rd-name">
        リスナー
      </text>
    </svg>
  );
}
