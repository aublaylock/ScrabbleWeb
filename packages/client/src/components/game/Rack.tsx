import React, { useState, useEffect } from 'react';
import type { Tile } from '@scrabble/common';

interface Props {
  tiles: Tile[];
  pendingRackIds: Set<string>;
  selectedId: string | null;
  exchangeMode: boolean;
  exchangeSelection: Set<string>;
  onTileClick: (tile: Tile) => void;
  onTileDragStart: (e: React.DragEvent<HTMLButtonElement>, tile: Tile) => void;
  onRackDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function Rack({
  tiles,
  pendingRackIds,
  selectedId,
  exchangeMode,
  exchangeSelection,
  onTileClick,
  onTileDragStart,
  onRackDrop,
}: Props) {
  const [rackDragOver, setRackDragOver] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Local display order — array of tile IDs
  const [order, setOrder] = useState<string[]>(() => tiles.map((t) => t.id));

  // Sync order when the rack changes (tiles played, drawn, or exchanged)
  const tileKey = tiles.map((t) => t.id).join(',');
  useEffect(() => {
    setOrder((prev) => {
      const tileIdSet = new Set(tiles.map((t) => t.id));
      const kept = prev.filter((id) => tileIdSet.has(id));
      const keptSet = new Set(kept);
      const newIds = tiles.filter((t) => !keptSet.has(t.id)).map((t) => t.id);
      return [...kept, ...newIds];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileKey]);

  const orderedTiles = order
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is Tile => t !== undefined);

  // ── Shuffle ───────────────────────────────────────────────

  const handleShuffle = () => {
    setOrder((prev) => {
      const s = [...prev];
      for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
      }
      return s;
    });
  };

  // ── Rack-container drag handlers ──────────────────────────

  const handleRackDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setRackDragOver(true);
  };

  const handleRackDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setRackDragOver(false);
    onRackDrop(e);
  };

  // ── Per-tile drag handlers (for reordering) ───────────────

  const handleTileDragOver = (
    e: React.DragEvent<HTMLButtonElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation(); // don't also highlight the whole rack container
    setDragOverId(targetId);
    setRackDragOver(false);
  };

  const handleTileDropOnTile = (
    e: React.DragEvent<HTMLButtonElement>,
    targetId: string,
  ) => {
    setDragOverId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const data = JSON.parse(raw) as { source: string; tileId: string };

    if (data.source === 'rack') {
      e.stopPropagation(); // handled here — don't bubble to rack container
      const draggedId = data.tileId;
      if (draggedId === targetId) return;
      setOrder((prev) => {
        const without = prev.filter((id) => id !== draggedId);
        const targetIdx = without.indexOf(targetId);
        if (targetIdx === -1) return prev;
        without.splice(targetIdx, 0, draggedId);
        return without;
      });
    }
    // source === 'board': don't stop propagation — event bubbles to rack
    // container which calls onRackDrop to recall the tile.
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="rack-wrapper">
      <div
        className={['rack', rackDragOver ? 'rack-drag-over' : ''].filter(Boolean).join(' ')}
        onDragOver={handleRackDragOver}
        onDragLeave={() => { setRackDragOver(false); setDragOverId(null); }}
        onDrop={handleRackDrop}
      >
        {orderedTiles.map((tile) => {
          const onBoard = pendingRackIds.has(tile.id);
          const selected = tile.id === selectedId;
          const inExchange = exchangeSelection.has(tile.id);
          const isDropTarget = dragOverId === tile.id;

          return (
            <button
              key={tile.id}
              className={[
                'rack-tile',
                onBoard ? 'rack-tile-placed' : '',
                selected ? 'rack-tile-selected' : '',
                exchangeMode && inExchange ? 'rack-tile-exchange' : '',
                tile.isBlank ? 'rack-tile-blank' : '',
                isDropTarget ? 'rack-tile-drop-target' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!onBoard && !exchangeMode}
              onClick={() => !onBoard && onTileClick(tile)}
              onDragStart={(e) => {
                if (onBoard) { e.preventDefault(); return; }
                onTileDragStart(e, tile);
              }}
              onDragOver={(e) => {
                if (onBoard || exchangeMode) return;
                handleTileDragOver(e, tile.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleTileDropOnTile(e, tile.id)}
              title={tile.isBlank ? 'Blank tile' : undefined}
            >
              <span className="tile-letter">
                {tile.isBlank ? (tile.assignedLetter ?? '?') : tile.letter}
              </span>
              <span className="tile-value">{tile.isBlank ? 0 : tile.value}</span>
            </button>
          );
        })}
      </div>

      <button className="shuffle-btn" onClick={handleShuffle} title="Shuffle rack">
        ⇌
      </button>
    </div>
  );
}
