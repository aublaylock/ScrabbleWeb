import React, { useState } from 'react';
import type { Tile, PremiumType } from '@scrabble/common';

const PREMIUM_LABELS: Record<string, string> = {
  TW: 'TW',
  DW: 'DW',
  TL: 'TL',
  DL: 'DL',
  star: '★',
};

const PREMIUM_CLASSES: Record<string, string> = {
  TW: 'cell-tw',
  DW: 'cell-dw',
  TL: 'cell-tl',
  DL: 'cell-dl',
  star: 'cell-star',
};

interface Props {
  row: number;
  col: number;
  committedTile: Tile | null;
  pendingTile: Tile | null;
  premium: PremiumType;
  /** Show click-target cursor (a rack tile is selected and this cell is empty). */
  isTarget: boolean;
  onClick: () => void;
  /** Called when something is dropped onto this empty cell. */
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Called when a pending tile starts being dragged off this cell. */
  onPendingDragStart: (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => void;
}

export function Cell({
  row,
  col,
  committedTile,
  pendingTile,
  premium,
  isTarget,
  onClick,
  onDrop,
  onPendingDragStart,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  const isPending = !committedTile && !!pendingTile;
  const isEmpty = !committedTile && !pendingTile;
  const premiumClass = premium ? (PREMIUM_CLASSES[premium] ?? '') : '';
  const label = premium ? (PREMIUM_LABELS[premium] ?? '') : '';

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEmpty) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDragOver(false);
    if (!isEmpty) return;
    onDrop(e);
  };

  return (
    <div
      className={[
        'cell',
        premiumClass,
        !isEmpty ? 'cell-filled' : '',
        isPending ? 'cell-pending tile-draggable' : '',
        isTarget ? 'cell-target' : '',
        dragOver ? 'cell-drag-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      draggable={isPending}
      onDragStart={isPending ? (e) => onPendingDragStart(e, row, col) : undefined}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {committedTile ? (
        <TileDisplay tile={committedTile} pending={false} />
      ) : pendingTile ? (
        <TileDisplay tile={pendingTile} pending />
      ) : (
        label && <span className="cell-label">{label}</span>
      )}
    </div>
  );
}

interface TileDisplayProps {
  tile: Tile;
  pending: boolean;
}

function TileDisplay({ tile, pending }: TileDisplayProps) {
  const letter = tile.isBlank ? (tile.assignedLetter ?? '?') : tile.letter;
  return (
    <div
      className={[
        'tile',
        pending ? 'tile-pending' : 'tile-committed',
        tile.isBlank ? 'tile-blank' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="tile-letter">{letter}</span>
      <span className="tile-value">{tile.isBlank ? 0 : tile.value}</span>
    </div>
  );
}
