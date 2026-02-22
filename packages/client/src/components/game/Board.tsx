import React from 'react';
import type { Board as BoardType, PlacedTile, Tile } from '@scrabble/common';
import { getPremium } from '@scrabble/common';
import { Cell } from './Cell';

interface Props {
  board: BoardType;
  pendingPlacements: PlacedTile[];
  selectedTile: Tile | null;
  onCellClick: (row: number, col: number) => void;
  onCellDrop: (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => void;
  onPendingDragStart: (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => void;
}

export function Board({
  board,
  pendingPlacements,
  selectedTile,
  onCellClick,
  onCellDrop,
  onPendingDragStart,
}: Props) {
  const pendingMap = new Map(
    pendingPlacements.map((p) => [`${p.coord.row},${p.coord.col}`, p.tile]),
  );

  return (
    <div className="board">
      {Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => {
          const key = `${row},${col}`;
          const committed = board[row][col];
          const pending = pendingMap.get(key) ?? null;
          const premium = getPremium(row, col);

          return (
            <Cell
              key={key}
              row={row}
              col={col}
              committedTile={committed}
              pendingTile={pending}
              premium={premium}
              // Show click-target cursor whenever a tile is selected and cell is free
              isTarget={!committed && !pending && !!selectedTile}
              onClick={() => onCellClick(row, col)}
              onDrop={(e) => onCellDrop(e, row, col)}
              onPendingDragStart={onPendingDragStart}
            />
          );
        }),
      )}
    </div>
  );
}
