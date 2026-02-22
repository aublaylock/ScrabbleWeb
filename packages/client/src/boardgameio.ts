import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { ScrabbleGame } from '@scrabble/game';
import { GamePage } from './components/game/GamePage';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000';

export const ScrabbleClient = Client({
  game: ScrabbleGame,
  board: GamePage,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});
