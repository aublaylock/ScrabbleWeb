import type { Board, Coord, PlacedTile } from '@scrabble/common';
import { PREMIUM_SQUARES } from '@scrabble/common';
import type { WordResult } from './validation';

export function computeScore(
  board: Board,         // already has new tiles applied
  placements: PlacedTile[],
  words: WordResult[],
): number {
  const newCoords = new Set(
    placements.map((p) => `${p.coord.row},${p.coord.col}`),
  );

  let total = 0;

  for (const { coords } of words) {
    let wordScore = 0;
    let wordMultiplier = 1;

    for (const coord of coords) {
      const tile = board[coord.row][coord.col]!;
      const letterValue = tile.isBlank ? 0 : tile.value;
      const key = `${coord.row},${coord.col}`;

      // Premium squares only apply to newly placed tiles
      const premium = newCoords.has(key) ? (PREMIUM_SQUARES.get(key) ?? null) : null;

      switch (premium) {
        case 'DL':
          wordScore += letterValue * 2;
          break;
        case 'TL':
          wordScore += letterValue * 3;
          break;
        case 'DW':
        case 'star':
          wordScore += letterValue;
          wordMultiplier *= 2;
          break;
        case 'TW':
          wordScore += letterValue;
          wordMultiplier *= 3;
          break;
        default:
          wordScore += letterValue;
          break;
      }
    }

    total += wordScore * wordMultiplier;
  }

  // Bingo bonus: 50 points for using all 7 rack tiles in one turn
  if (placements.length === 7) {
    total += 50;
  }

  return total;
}

export function tileValue(coords: Coord[], board: Board): number {
  return coords.reduce((sum, { row, col }) => {
    const tile = board[row][col];
    return sum + (tile ? (tile.isBlank ? 0 : tile.value) : 0);
  }, 0);
}
