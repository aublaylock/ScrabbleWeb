import type { ScrabbleG } from '@scrabble/common';

export interface EndGameResult {
  winner: string;
  scores: Record<string, number>;
  reason: 'playerOut' | 'allPassed';
}

/**
 * Compute final scores:
 * - Each player subtracts their unplayed tile values
 * - The player who emptied their rack (if any) adds all opponents' unplayed totals
 */
export function computeEndGameScores(
  G: ScrabbleG,
  ctx: { numPlayers: number },
): EndGameResult {
  const finalScores: Record<string, number> = {};
  for (const [pid, player] of Object.entries(G.players)) {
    finalScores[pid] = player.score;
  }

  // Who emptied their rack (bag must also be empty)?
  const playerOut =
    G.bag.length === 0
      ? Object.entries(G.players).find(([, p]) => p.rack.length === 0)?.[0]
      : undefined;

  let unplayedTotal = 0;

  for (const [pid, player] of Object.entries(G.players)) {
    const unplayed = player.rack.reduce((sum, t) => sum + t.value, 0);
    if (pid !== playerOut) {
      finalScores[pid] -= unplayed;
      unplayedTotal += unplayed;
    }
  }

  if (playerOut !== undefined) {
    finalScores[playerOut] += unplayedTotal;
  }

  const winner = Object.entries(finalScores).sort(
    ([, a], [, b]) => b - a,
  )[0][0];

  return {
    winner,
    scores: finalScores,
    reason: playerOut !== undefined ? 'playerOut' : 'allPassed',
  };
}
