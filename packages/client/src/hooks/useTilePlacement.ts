import { useState, useCallback } from 'react';
import type { Tile, Coord, PlacedTile, Board } from '@scrabble/common';

interface UseTilePlacementReturn {
  pendingPlacements: PlacedTile[];
  selectedRackTile: Tile | null;
  exchangeMode: boolean;
  exchangeSelection: Set<string>;

  selectFromRack: (tile: Tile) => void;
  placeOnBoard: (coord: Coord) => void;
  placeTileDirectly: (tile: Tile, coord: Coord) => void;
  movePendingTile: (from: Coord, to: Coord) => void;
  recallFromBoard: (coord: Coord) => void;
  recallAll: () => void;
  clearConflicts: (board: Board) => void;
  toggleExchangeMode: () => void;
  toggleExchangeSelect: (id: string) => void;
  clearAll: () => void;

  pendingSet: Set<string>;      // "row,col" keys of staged placements
  pendingRackIds: Set<string>;  // tile IDs currently staged on board
}

export function useTilePlacement(): UseTilePlacementReturn {
  const [pendingPlacements, setPending] = useState<PlacedTile[]>([]);
  const [selectedRackTile, setSelected] = useState<Tile | null>(null);
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangeSelection, setExchangeSelection] = useState<Set<string>>(new Set());

  const pendingSet = new Set(
    pendingPlacements.map((p) => `${p.coord.row},${p.coord.col}`),
  );
  const pendingRackIds = new Set(pendingPlacements.map((p) => p.tile.id));

  // ── Click-to-place ───────────────────────────────────────

  const selectFromRack = useCallback((tile: Tile) => {
    setSelected((prev) => (prev?.id === tile.id ? null : tile));
  }, []);

  const placeOnBoard = useCallback((coord: Coord) => {
    setSelected((selected) => {
      if (!selected) return selected;
      setPending((prev) => {
        const key = `${coord.row},${coord.col}`;
        if (prev.some((p) => `${p.coord.row},${p.coord.col}` === key)) return prev;
        if (prev.some((p) => p.tile.id === selected.id)) return prev;
        return [...prev, { tile: selected, coord }];
      });
      return null; // deselect after placing
    });
  }, []);

  // ── Drag-to-place ────────────────────────────────────────

  /** Place a specific tile at a coord without needing it selected first (drag-drop). */
  const placeTileDirectly = useCallback((tile: Tile, coord: Coord) => {
    setPending((prev) => {
      const key = `${coord.row},${coord.col}`;
      if (prev.some((p) => `${p.coord.row},${p.coord.col}` === key)) return prev;
      if (prev.some((p) => p.tile.id === tile.id)) return prev;
      return [...prev, { tile, coord }];
    });
    setSelected(null);
  }, []);

  /** Move an already-staged tile from one board coord to another. */
  const movePendingTile = useCallback((from: Coord, to: Coord) => {
    setPending((prev) => {
      const toKey = `${to.row},${to.col}`;
      if (prev.some((p) => `${p.coord.row},${p.coord.col}` === toKey)) return prev;
      return prev.map((p) =>
        p.coord.row === from.row && p.coord.col === from.col
          ? { ...p, coord: to }
          : p,
      );
    });
  }, []);

  const recallFromBoard = useCallback((coord: Coord) => {
    setPending((prev) => {
      const removed = prev.find(
        (p) => p.coord.row === coord.row && p.coord.col === coord.col,
      );
      if (removed?.tile.isBlank) removed.tile.assignedLetter = undefined;
      return prev.filter(
        (p) => !(p.coord.row === coord.row && p.coord.col === coord.col),
      );
    });
  }, []);

  const recallAll = useCallback(() => {
    setPending((prev) => {
      for (const p of prev) {
        if (p.tile.isBlank) p.tile.assignedLetter = undefined;
      }
      return [];
    });
    setSelected(null);
  }, []);

  /** Remove staged placements that now conflict with a committed board tile. */
  const clearConflicts = useCallback((board: Board) => {
    setPending((prev) => {
      const kept = prev.filter((p) => board[p.coord.row][p.coord.col] === null);
      for (const p of prev) {
        if (!kept.includes(p) && p.tile.isBlank) p.tile.assignedLetter = undefined;
      }
      return kept;
    });
  }, []);

  // ── Exchange mode ─────────────────────────────────────────

  const toggleExchangeMode = useCallback(() => {
    setExchangeMode((m) => !m);
    setExchangeSelection(new Set());
    setPending([]);
    setSelected(null);
  }, []);

  const toggleExchangeSelect = useCallback((id: string) => {
    setExchangeSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPending([]);
    setSelected(null);
    setExchangeMode(false);
    setExchangeSelection(new Set());
  }, []);

  return {
    pendingPlacements,
    selectedRackTile,
    exchangeMode,
    exchangeSelection,
    selectFromRack,
    placeOnBoard,
    placeTileDirectly,
    movePendingTile,
    recallFromBoard,
    recallAll,
    clearConflicts,
    toggleExchangeMode,
    toggleExchangeSelect,
    clearAll,
    pendingSet,
    pendingRackIds,
  };
}
