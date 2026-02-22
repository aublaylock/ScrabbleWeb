import * as path from 'path';
import { Server } from 'boardgame.io/server';
import { ScrabbleGame, setDictionary } from '@scrabble/game';
import { loadDictionaryFile } from './dictionary';

const PORT = parseInt(process.env.PORT ?? '8000', 10);
const DICT_PATH =
  process.env.DICT_PATH ??
  path.resolve(__dirname, '../../../NSWL2023.txt');

async function main() {
  console.log(`Loading dictionary from: ${DICT_PATH}`);
  const dict = await loadDictionaryFile(DICT_PATH);
  setDictionary(dict);
  console.log(`Dictionary loaded: ${dict.size} words`);

  const server = Server({
    games: [ScrabbleGame],
    // Allow all origins in development; set CLIENT_ORIGIN in production.
    origins: process.env.CLIENT_ORIGIN
      ? [process.env.CLIENT_ORIGIN]
      : true,
  });

  // Health-check endpoint — used by uptime monitors to prevent free-tier spin-down.
  server.app.use(async (ctx: { path: string; status: number; body: string }, next: () => Promise<void>) => {
    if (ctx.path === '/health') {
      ctx.status = 200;
      ctx.body = 'OK';
      return;
    }
    await next();
  });

  server.run(PORT, () => {
    console.log(`Scrabble server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
