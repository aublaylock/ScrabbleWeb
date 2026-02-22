import React, { useState } from 'react';
import { LobbyPage } from './components/lobby/LobbyPage';
import { ScrabbleClient } from './boardgameio';

interface MatchInfo {
  matchID: string;
  playerID: string;
  credentials: string;
  playerName: string;
}

export default function App() {
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);

  if (matchInfo) {
    return (
      <div>
        <ScrabbleClient
          matchID={matchInfo.matchID}
          playerID={matchInfo.playerID}
          credentials={matchInfo.credentials}
        />
        <button
          className="leave-btn"
          onClick={() => setMatchInfo(null)}
        >
          Leave Game
        </button>
      </div>
    );
  }

  return <LobbyPage onJoin={setMatchInfo} />;
}
