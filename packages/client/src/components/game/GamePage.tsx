import React, { useEffect, useMemo, useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { ScrabbleG, Tile, Coord } from '@scrabble/common';
import { Board } from './Board';
import { Rack } from './Rack';
import { ActionBar } from './ActionBar';
import { ScorePanel } from './ScorePanel';
import { GameLog } from './GameLog';
import { useTilePlacement } from '../../hooks/useTilePlacement';
import { validatePlacement, extractWords, computeScore } from '@scrabble/game';
import type { Board as BoardGrid } from '@scrabble/common';

interface EndGameResult {
  winner: string;
  scores: Record<string, number>;
  reason: string;
}

// Drag payload serialised into dataTransfer
interface DragPayload {
  source: 'rack' | 'board';
  tileId: string;
  row?: number;
  col?: number;
}

export type GamePageProps = BoardProps<ScrabbleG>;

export function GamePage({ G, ctx, moves, playerID, isActive, matchID }: GamePageProps) {
  const placement = useTilePlacement();
  const [blankPending, setBlankPending] = useState<{ tile: Tile; coord: Coord } | null>(null);
  const [error, setError] = useState('');
  const [showBag, setShowBag] = useState(false);

  const myRack = G.myRack ?? [];
  const isMyTurn = isActive && !ctx.gameover;

  // When the board updates (opponent played), remove any staged tiles that now conflict.
  useEffect(() => {
    placement.clearConflicts(G.board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [G.board]);

  // ── Bag letter distribution (for hover tooltip) ───────────

  const bagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tile of G.bag) {
      const key = tile.isBlank ? '?' : tile.letter;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [G.bag]);

  // ── Placement preview (validity + estimated score) ────────

  const placementPreview = useMemo(() => {
    const placements = placement.pendingPlacements;
    if (placements.length === 0) return null;

    const geoError = validatePlacement(G.board, placements);
    if (geoError) return { valid: false, message: geoError };

    const words = extractWords(G.board, placements);
    if (words.length === 0) return { valid: false, message: 'No complete word formed' };

    const tempBoard = G.board.map((row) => [...row]) as BoardGrid;
    for (const { tile, coord } of placements) {
      tempBoard[coord.row][coord.col] = tile;
    }
    const score = computeScore(tempBoard, placements, words);
    const isBingo = placements.length === 7;
    return {
      valid: true,
      message: isBingo ? `BINGO! +50 bonus — ${score} pts` : `${score} pts`,
    };
  }, [G.board, placement.pendingPlacements]);

  // ── Helpers ──────────────────────────────────────────────

  const placeWithBlankCheck = (tile: Tile, coord: Coord) => {
    if (tile.isBlank) {
      // Stage the tile first, then open the letter picker
      placement.placeTileDirectly(tile, coord);
      setBlankPending({ tile, coord });
    } else {
      placement.placeTileDirectly(tile, coord);
    }
  };

  // ── Click handlers ────────────────────────────────────────

  const handleCellClick = (row: number, col: number) => {
    const coord = { row, col };
    const key = `${row},${col}`;

    // Clicking a staged tile on the board recalls it
    if (placement.pendingSet.has(key)) {
      placement.recallFromBoard(coord);
      return;
    }

    if (!placement.selectedRackTile) return;
    placeWithBlankCheck(placement.selectedRackTile, coord);
  };

  // ── Drag handlers ─────────────────────────────────────────

  const handleTileDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    tile: Tile,
  ) => {
    const payload: DragPayload = { source: 'rack', tileId: tile.id };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePendingDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => {
    const pending = placement.pendingPlacements.find(
      (p) => p.coord.row === row && p.coord.col === col,
    );
    if (!pending) return;
    const payload: DragPayload = { source: 'board', tileId: pending.tile.id, row, col };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCellDrop = (
    e: React.DragEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    const data = JSON.parse(raw) as DragPayload;
    const targetCoord = { row, col };

    if (data.source === 'rack') {
      const tile = myRack.find((t) => t.id === data.tileId);
      if (!tile || placement.pendingRackIds.has(tile.id)) return;
      placeWithBlankCheck(tile, targetCoord);
    } else if (data.source === 'board' && data.row !== undefined && data.col !== undefined) {
      const fromCoord = { row: data.row, col: data.col };
      placement.movePendingTile(fromCoord, targetCoord);
    }
  };

  const handleRackDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const data = JSON.parse(raw) as DragPayload;
    if (data.source === 'board' && data.row !== undefined && data.col !== undefined) {
      placement.recallFromBoard({ row: data.row, col: data.col });
    }
  };

  // ── Blank tile letter assignment ──────────────────────────

  const handleBlankLetter = (letter: string) => {
    if (!blankPending) return;
    // Mutate the staged tile's assignedLetter in-place
    const staged = placement.pendingPlacements.find(
      (p) => p.tile.id === blankPending.tile.id,
    );
    if (staged) staged.tile.assignedLetter = letter;
    setBlankPending(null);
  };

  // ── Move submission ───────────────────────────────────────

  const handleSubmit = () => {
    if (placement.pendingPlacements.length === 0) {
      setError('Place at least one tile first');
      return;
    }
    setError('');
    moves.placeTiles(placement.pendingPlacements);
    placement.clearAll();
  };

  const handleExchangeSubmit = () => {
    if (placement.exchangeSelection.size === 0) {
      setError('Select tiles to exchange');
      return;
    }
    setError('');
    moves.exchangeTiles([...placement.exchangeSelection]);
    placement.clearAll();
  };

  const handlePass = () => {
    setError('');
    moves.passTurn();
    placement.clearAll();
  };

  // ── Game over screen ──────────────────────────────────────

  if (ctx.gameover) {
    const { winner, scores, reason } = ctx.gameover as EndGameResult;
    return (
      <div className="gameover">
        <h1>Game Over</h1>
        <p className="gameover-reason">
          {reason === 'playerOut'
            ? 'A player used all their tiles!'
            : 'All players passed — game ended.'}
        </p>
        <h2>Final Scores</h2>
        <ul className="gameover-scores">
          {Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .map(([pid, score]) => (
              <li key={pid} className={pid === winner ? 'winner' : ''}>
                Player {parseInt(pid) + 1}
                {pid === winner ? ' 🏆' : ''}: {score}
              </li>
            ))}
        </ul>
      </div>
    );
  }

  // ── Main game UI ──────────────────────────────────────────

  return (
    <div className="game-layout">
      <aside className="game-sidebar">
        <div className="match-info">
          <span className="match-label">Game</span>
          <span className="match-id">{matchID.slice(0, 8)}</span>
        </div>
        <ScorePanel
          players={G.players}
          currentPlayer={ctx.currentPlayer}
          myPlayerID={playerID ?? ''}
          playOrder={ctx.playOrder}
        />
        <GameLog entries={G.moveLog} playerID={playerID ?? ''} />
        <div
          className="bag-count"
          onMouseEnter={() => setShowBag(true)}
          onMouseLeave={() => setShowBag(false)}
        >
          {G.bag.length} tile{G.bag.length !== 1 ? 's' : ''} in bag
          {showBag && G.bag.length > 0 && (
            <div className="bag-details">
              {bagCounts.map(([letter, count]) => (
                <span key={letter} className="bag-letter">{letter}:{count}</span>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="game-main">
        {isMyTurn ? (
          <div className="turn-banner your-turn">Your turn</div>
        ) : (
          <div className="turn-banner">
            Player {parseInt(ctx.currentPlayer) + 1}'s turn
          </div>
        )}

        <Board
          board={G.board}
          pendingPlacements={placement.pendingPlacements}
          selectedTile={placement.selectedRackTile}
          onCellClick={handleCellClick}
          onCellDrop={handleCellDrop}
          onPendingDragStart={handlePendingDragStart}
        />

        <Rack
          tiles={myRack}
          pendingRackIds={placement.pendingRackIds}
          selectedId={placement.selectedRackTile?.id ?? null}
          exchangeMode={placement.exchangeMode}
          exchangeSelection={placement.exchangeSelection}
          onTileClick={(tile) => {
            if (placement.exchangeMode) {
              placement.toggleExchangeSelect(tile.id);
            } else {
              placement.selectFromRack(tile);
            }
          }}
          onTileDragStart={handleTileDragStart}
          onRackDrop={handleRackDrop}
        />

        {placementPreview && (
          <div className={`placement-preview ${placementPreview.valid ? 'preview-valid' : 'preview-invalid'}`}>
            {placementPreview.message}
          </div>
        )}

        {error && <p className="game-error">{error}</p>}

        <ActionBar
          isMyTurn={isMyTurn}
          hasPending={placement.pendingPlacements.length > 0}
          exchangeMode={placement.exchangeMode}
          canExchange={G.bag.length >= 7}
          onSubmit={handleSubmit}
          onRecallAll={placement.recallAll}
          onToggleExchange={placement.toggleExchangeMode}
          onExchangeSubmit={handleExchangeSubmit}
          onPass={handlePass}
        />

        {/* Blank tile letter picker */}
        {blankPending && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Choose a letter for the blank tile</h3>
              <div className="letter-grid">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                  <button
                    key={letter}
                    className="letter-btn"
                    onClick={() => handleBlankLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
