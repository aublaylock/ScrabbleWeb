export type Coord = { row: number; col: number };

export interface Tile {
  id: string;
  letter: string;         // "A"–"Z", or "" for a blank
  value: number;          // face value (0 for blanks)
  isBlank: boolean;
  assignedLetter?: string; // set when a blank is placed on the board
}

export interface PlacedTile {
  tile: Tile;
  coord: Coord;
}

export type BoardCell = Tile | null;
export type Board = BoardCell[][];  // [15][15]

export interface PlayerState {
  rack: Tile[];   // empty for opponents after playerView strips it
  score: number;
}

export interface MoveLogEntry {
  playerID: string;
  playerName?: string;
  type: 'place' | 'exchange' | 'pass';
  words?: string[];
  score?: number;
  turn: number;
}

export interface ScrabbleG {
  board: Board;
  bag: Tile[];
  players: Record<string, PlayerState>;
  myRack: Tile[];        // populated by playerView; empty array on server
  consecutivePasses: number;
  moveLog: MoveLogEntry[];
  lastMoveCoords?: Coord[]; // coords of the most recently placed tiles (for highlight)
}

export type PremiumType = 'DL' | 'TL' | 'DW' | 'TW' | 'star' | null;
