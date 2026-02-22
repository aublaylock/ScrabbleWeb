import type { PremiumType } from './types';

/**
 * Standard 15×15 Scrabble board premium squares (0-indexed).
 * Key format: "row,col"
 */
export const PREMIUM_SQUARES: Map<string, PremiumType> = new Map([
  // Triple Word Score
  ['0,0', 'TW'], ['0,7', 'TW'], ['0,14', 'TW'],
  ['7,0', 'TW'],                ['7,14', 'TW'],
  ['14,0', 'TW'], ['14,7', 'TW'], ['14,14', 'TW'],

  // Double Word Score (diagonals from corners)
  ['1,1', 'DW'],  ['2,2', 'DW'],  ['3,3', 'DW'],  ['4,4', 'DW'],
  ['1,13', 'DW'], ['2,12', 'DW'], ['3,11', 'DW'], ['4,10', 'DW'],
  ['10,4', 'DW'], ['11,3', 'DW'], ['12,2', 'DW'], ['13,1', 'DW'],
  ['10,10', 'DW'], ['11,11', 'DW'], ['12,12', 'DW'], ['13,13', 'DW'],

  // Center star (also a DW)
  ['7,7', 'star'],

  // Triple Letter Score
  ['1,5', 'TL'],  ['1,9', 'TL'],
  ['5,1', 'TL'],  ['5,5', 'TL'],  ['5,9', 'TL'],  ['5,13', 'TL'],
  ['9,1', 'TL'],  ['9,5', 'TL'],  ['9,9', 'TL'],  ['9,13', 'TL'],
  ['13,5', 'TL'], ['13,9', 'TL'],

  // Double Letter Score
  ['0,3', 'DL'],  ['0,11', 'DL'],
  ['2,6', 'DL'],  ['2,8', 'DL'],
  ['3,0', 'DL'],  ['3,7', 'DL'],  ['3,14', 'DL'],
  ['6,2', 'DL'],  ['6,6', 'DL'],  ['6,8', 'DL'],  ['6,12', 'DL'],
  ['7,3', 'DL'],  ['7,11', 'DL'],
  ['8,2', 'DL'],  ['8,6', 'DL'],  ['8,8', 'DL'],  ['8,12', 'DL'],
  ['11,0', 'DL'], ['11,7', 'DL'], ['11,14', 'DL'],
  ['12,6', 'DL'], ['12,8', 'DL'],
  ['14,3', 'DL'], ['14,11', 'DL'],
]);

export function getPremium(row: number, col: number): PremiumType {
  return PREMIUM_SQUARES.get(`${row},${col}`) ?? null;
}

export const BOARD_SIZE = 15;
export const CENTER = { row: 7, col: 7 };
