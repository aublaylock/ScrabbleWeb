import type { Board, Coord, PlacedTile } from '@scrabble/common';
import { isValidWord } from './dictionary';

export interface WordResult {
  word: string;
  coords: Coord[];
}

/**
 * Check that the tiles being placed are geometrically valid.
 * Returns an error string on failure, null on success.
 */
export function validatePlacement(
  board: Board,
  placements: PlacedTile[],
): string | null {
  if (placements.length === 0) return 'No tiles placed';

  const rows = placements.map((p) => p.coord.row);
  const cols = placements.map((p) => p.coord.col);
  const allSameRow = rows.every((r) => r === rows[0]);
  const allSameCol = cols.every((c) => c === cols[0]);

  if (!allSameRow && !allSameCol) {
    return 'All tiles must be in the same row or column';
  }

  // Build a temporary board with the new placements
  const tempBoard: Board = board.map((row) => [...row]);
  for (const { tile, coord } of placements) {
    tempBoard[coord.row][coord.col] = tile;
  }

  // Check for gaps between the first and last placed tile
  if (allSameRow) {
    const row = rows[0];
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    for (let c = minCol; c <= maxCol; c++) {
      if (!tempBoard[row][c]) return 'Tiles cannot have gaps';
    }
  } else {
    const col = cols[0];
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    for (let r = minRow; r <= maxRow; r++) {
      if (!tempBoard[r][col]) return 'Tiles cannot have gaps';
    }
  }

  const boardIsEmpty = board.every((row) => row.every((cell) => cell === null));

  // First word must cover the center square (7,7)
  if (boardIsEmpty) {
    const coversCentre = placements.some(
      (p) => p.coord.row === 7 && p.coord.col === 7,
    );
    if (!coversCentre) return 'First word must cover the centre square (H8)';
  } else {
    // Subsequent words must connect to at least one existing tile
    const adjacentToExisting = placements.some(({ coord }) =>
      [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ].some(([dr, dc]) => {
        const r = coord.row + dr;
        const c = coord.col + dc;
        return (
          r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] !== null
        );
      }),
    );
    if (!adjacentToExisting) {
      return 'Tiles must connect to existing tiles on the board';
    }
  }

  return null;
}

/**
 * Extract all words formed by the placement (no dictionary check).
 * Safe to call client-side where the dictionary singleton is empty.
 */
export function extractWords(
  board: Board,
  placements: PlacedTile[],
): WordResult[] {
  const tempBoard: Board = board.map((row) => [...row]);
  for (const { tile, coord } of placements) {
    tempBoard[coord.row][coord.col] = tile;
  }

  const placedSet = new Set(
    placements.map((p) => `${p.coord.row},${p.coord.col}`),
  );
  const words: WordResult[] = [];
  const checked = new Set<string>();

  for (const { coord } of placements) {
    for (const dir of ['H', 'V'] as const) {
      const result = extractWord(tempBoard, coord, dir);
      if (result.word.length < 2) continue;

      const key = `${dir}-${result.coords[0].row}-${result.coords[0].col}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const touchesNew = result.coords.some((c) =>
        placedSet.has(`${c.row},${c.col}`),
      );
      if (!touchesNew) continue;

      words.push(result);
    }
  }

  return words;
}

/**
 * Extract all words formed by the placement and validate against the dictionary.
 * Returns { words, error } — error is null on success.
 */
export function validateWords(
  board: Board,
  placements: PlacedTile[],
): { words: WordResult[]; error: string | null } {
  const words = extractWords(board, placements);

  for (const { word } of words) {
    if (!isValidWord(word)) {
      return { words: [], error: `"${word}" is not a valid Scrabble word` };
    }
  }

  return { words, error: null };
}

function extractWord(
  board: Board,
  start: Coord,
  dir: 'H' | 'V',
): WordResult {
  const dr = dir === 'V' ? 1 : 0;
  const dc = dir === 'H' ? 1 : 0;

  // Walk backward to the start of the word
  let r = start.row;
  let c = start.col;
  while (
    r - dr >= 0 &&
    c - dc >= 0 &&
    board[r - dr]?.[c - dc] !== null &&
    board[r - dr]?.[c - dc] !== undefined
  ) {
    r -= dr;
    c -= dc;
  }

  // Walk forward, collecting letters
  const coords: Coord[] = [];
  let word = '';
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] !== null) {
    const tile = board[r][c]!;
    const ch = tile.isBlank ? (tile.assignedLetter ?? '?') : tile.letter;
    word += ch;
    coords.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  return { word, coords };
}
