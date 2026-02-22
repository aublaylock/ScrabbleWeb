import type { Game, Ctx } from 'boardgame.io';
import type { ScrabbleG } from '@scrabble/common';
import { buildTileBag } from '@scrabble/common';
import { shuffleBag, drawTiles } from './bag';
import { placeTiles, exchangeTiles, passTurn } from './moves';
import { computeEndGameScores } from './endgame';

// Game ends after 6 consecutive scoreless turns (passes + exchanges)
const MAX_CONSECUTIVE_PASSES = 6;

export const ScrabbleGame: Game<ScrabbleG> = {
  name: 'scrabble',
  minPlayers: 2,
  maxPlayers: 4,

  setup(ctx: Ctx): ScrabbleG {
    const bag = shuffleBag(buildTileBag());
    const players: ScrabbleG['players'] = {};
    let currentBag = bag;

    for (const pid of ctx.playOrder) {
      const [drawn, rest] = drawTiles(currentBag, 7);
      currentBag = rest;
      players[pid] = { rack: drawn, score: 0 };
    }

    return {
      board: Array.from({ length: 15 }, () => Array<null>(15).fill(null)),
      bag: currentBag,
      players,
      myRack: [],
      consecutivePasses: 0,
      moveLog: [],
    };
  },

  moves: {
    placeTiles,
    exchangeTiles,
    passTurn,
  },

  endIf(G: ScrabbleG, ctx: Ctx) {
    // All consecutive passes/exchanges with no word play
    if (G.consecutivePasses >= MAX_CONSECUTIVE_PASSES) {
      return computeEndGameScores(G, ctx);
    }

    // A player emptied their rack and the bag is empty
    const someoneDone = Object.values(G.players).some(
      (p) => p.rack.length === 0,
    );
    if (someoneDone && G.bag.length === 0) {
      return computeEndGameScores(G, ctx);
    }

    return undefined;
  },

  playerView(G: ScrabbleG, _ctx: Ctx, playerID: string | null): ScrabbleG {
    const myRack = (playerID !== null ? G.players[playerID]?.rack : undefined) ?? [];
    const players = Object.fromEntries(
      Object.entries(G.players).map(([pid, p]) => [
        pid,
        {
          score: p.score,
          rack: pid === playerID ? p.rack : [],
        },
      ]),
    ) as ScrabbleG['players'];
    // Merge opponent racks into the bag so players can't deduce opponents' tiles
    // by cross-referencing the bag distribution against the initial tile counts.
    const opponentTiles = Object.entries(G.players)
      .filter(([pid]) => pid !== playerID)
      .flatMap(([, p]) => p.rack);
    const bag = [...G.bag, ...opponentTiles];
    return { ...G, bag, players, myRack };
  },
};
