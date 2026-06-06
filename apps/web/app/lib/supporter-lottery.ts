export interface LotteryCandidate {
  userId: string;
  watchTimeHours: number;
  winCount: number;
}

/**
 * 重み = 試聴時間 / (当選回数 + 1) + 1
 * +1 により試聴時間0でも全員に基礎チャンスを保証
 */
function weight(c: LotteryCandidate): number {
  return c.watchTimeHours / (c.winCount + 1) + 1;
}

/**
 * 重み付き抽選。同一セッション内の重複当選なし。
 * candidates.length <= slots の場合は全員当選。
 */
export function drawLottery(candidates: LotteryCandidate[], slots: number): string[] {
  if (candidates.length <= slots) {
    return candidates.map((c) => c.userId);
  }

  const pool = candidates.map((c) => ({ ...c, w: weight(c) }));
  const winners: string[] = [];

  for (let i = 0; i < slots; i++) {
    const total = pool.reduce((sum, c) => sum + c.w, 0);
    let rand = Math.random() * total;

    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].w;
      if (rand <= 0) {
        winners.push(pool[j].userId);
        pool.splice(j, 1);
        break;
      }
    }
  }

  return winners;
}
