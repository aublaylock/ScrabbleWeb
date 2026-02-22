import type { Tile } from '@scrabble/common';

/**
 * Draw `n` tiles from the front of the bag.
 * Returns [drawn, remainingBag].
 */
export function drawTiles(bag: Tile[], n: number): [Tile[], Tile[]] {
  const count = Math.min(n, bag.length);
  return [bag.slice(0, count), bag.slice(count)];
}

/**
 * Fisher-Yates shuffle using boardgame.io's seeded random,
 * or Math.random as a fallback.
 */
export function shuffleBag(
  bag: Tile[],
  randomFn?: (min: number, max: number) => number,
): Tile[] {
  const arr = [...bag];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomFn
      ? Math.floor(randomFn(0, 1) * (i + 1))
      : Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
