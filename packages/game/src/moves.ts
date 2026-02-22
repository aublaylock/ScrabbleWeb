import { INVALID_MOVE } from 'boardgame.io/core';
import type { Ctx } from 'boardgame.io';
import type { PlacedTile, ScrabbleG } from '@scrabble/common';
import { validatePlacement, validateWords } from './validation';
import { computeScore } from './scoring';
import { drawTiles } from './bag';

export function placeTiles(
  G: ScrabbleG,
  ctx: Ctx,
  placements: PlacedTile[],
) {
  const pid = ctx.currentPlayer;
  const player = G.players[pid];
  if (!player) return INVALID_MOVE;

  // Ensure every placed tile is in the player's rack
  for (const { tile } of placements) {
    if (!player.rack.find((t) => t.id === tile.id)) return INVALID_MOVE;
  }

  const placementError = validatePlacement(G.board, placements);
  if (placementError) return INVALID_MOVE;

  const { words, error } = validateWords(G.board, placements);
  if (error) return INVALID_MOVE;

  // Commit tiles to the board (Immer lets us mutate directly)
  for (const { tile, coord } of placements) {
    G.board[coord.row][coord.col] = tile;
  }

  const score = computeScore(G.board, placements, words);
  G.players[pid].score += score;

  // Replenish rack
  const toRemove = new Set(placements.map((p) => p.tile.id));
  const remaining = player.rack.filter((t) => !toRemove.has(t.id));
  const [drawn, newBag] = drawTiles(G.bag, placements.length);
  G.players[pid].rack = [...remaining, ...drawn];
  G.bag = newBag;

  G.consecutivePasses = 0;
  G.moveLog.push({
    playerID: pid,
    type: 'place',
    words: words.map((w) => w.word),
    score,
    turn: ctx.turn,
  });

  ctx.events?.endTurn();
}

export function exchangeTiles(
  G: ScrabbleG,
  ctx: Ctx,
  tileIds: string[],
) {
  if (G.bag.length < 7) return INVALID_MOVE;
  if (tileIds.length === 0) return INVALID_MOVE;

  const pid = ctx.currentPlayer;
  const player = G.players[pid];
  if (!player) return INVALID_MOVE;

  const toExchange = tileIds
    .map((id) => player.rack.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (toExchange.length !== tileIds.length) return INVALID_MOVE;

  const [drawn, bagAfterDraw] = drawTiles(G.bag, tileIds.length);
  const toExchangeSet = new Set(tileIds);
  G.players[pid].rack = [
    ...player.rack.filter((t) => !toExchangeSet.has(t.id)),
    ...drawn,
  ];
  G.bag = [...bagAfterDraw, ...toExchange];

  G.consecutivePasses += 1;
  G.moveLog.push({
    playerID: pid,
    type: 'exchange',
    turn: ctx.turn,
  });

  ctx.events?.endTurn();
}

export function passTurn(G: ScrabbleG, ctx: Ctx) {
  G.consecutivePasses += 1;
  G.moveLog.push({
    playerID: ctx.currentPlayer,
    type: 'pass',
    turn: ctx.turn,
  });
  ctx.events?.endTurn();
}
