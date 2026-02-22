import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LobbyClient } from 'boardgame.io/client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000';

interface MatchSeat {
  id: number;
  name?: string;
  isConnected?: boolean;
}

interface Match {
  matchID: string;
  players: MatchSeat[];
  createdAt: number;
  gameover?: unknown;
}

interface MatchInfo {
  matchID: string;
  playerID: string;
  credentials: string;
  playerName: string;
}

interface Props {
  onJoin: (info: MatchInfo) => void;
}

const lobbyClient = new LobbyClient({ server: SERVER_URL });

export function LobbyPage({ onJoin }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('scrabble-name') ?? '',
  );
  const [numPlayers, setNumPlayers] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const result = await lobbyClient.listMatches('scrabble');
      const open = (result.matches as Match[]).filter(
        (m) =>
          !m.gameover &&
          m.players.some((p) => p.name === undefined || p.name === null || p.name === ''),
      );
      setMatches(open);
    } catch {
      // Server may not be ready yet
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    pollRef.current = setInterval(fetchMatches, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMatches]);

  const saveName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('scrabble-name', name);
  };

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    setBusy(true);
    setError('');
    try {
      const { matchID } = await lobbyClient.createMatch('scrabble', {
        numPlayers,
      });
      const { playerCredentials } = await lobbyClient.joinMatch(
        'scrabble',
        matchID,
        { playerID: '0', playerName: playerName.trim() },
      );
      onJoin({ matchID, playerID: '0', credentials: playerCredentials, playerName: playerName.trim() });
    } catch (e) {
      setError('Could not create game. Is the server running?');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinMatch = async (match: Match) => {
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    const openSeat = match.players.find((p) => !p.name);
    if (!openSeat) { setError('No open seats in that game'); return; }
    setBusy(true);
    setError('');
    try {
      const { playerCredentials } = await lobbyClient.joinMatch(
        'scrabble',
        match.matchID,
        {
          playerID: String(openSeat.id),
          playerName: playerName.trim(),
        },
      );
      onJoin({
        matchID: match.matchID,
        playerID: String(openSeat.id),
        credentials: playerCredentials,
        playerName: playerName.trim(),
      });
    } catch (e) {
      setError('Could not join game');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    if (!joinCode.trim()) { setError('Enter a game code'); return; }
    setBusy(true);
    setError('');
    try {
      const match = await lobbyClient.getMatch('scrabble', joinCode.trim());
      const openSeat = (match.players as MatchSeat[]).find((p) => !p.name);
      if (!openSeat) { setError('No open seats in that game'); setBusy(false); return; }
      const { playerCredentials } = await lobbyClient.joinMatch(
        'scrabble',
        joinCode.trim(),
        { playerID: String(openSeat.id), playerName: playerName.trim() },
      );
      onJoin({
        matchID: joinCode.trim(),
        playerID: String(openSeat.id),
        credentials: playerCredentials,
        playerName: playerName.trim(),
      });
    } catch (e) {
      setError('Game not found. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lobby">
      <h1 className="lobby-title">ScrabbleWeb</h1>

      <div className="lobby-card">
        <label className="lobby-label">
          Your name
          <input
            className="lobby-input"
            value={playerName}
            onChange={(e) => saveName(e.target.value)}
            maxLength={20}
            placeholder="Enter your name"
          />
        </label>
      </div>

      <div className="lobby-card">
        <h2>Create a New Game</h2>
        <label className="lobby-label">
          Players
          <select
            className="lobby-input"
            value={numPlayers}
            onChange={(e) => setNumPlayers(Number(e.target.value))}
          >
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
        </label>
        <button className="btn btn-primary" onClick={handleCreate} disabled={busy}>
          Create Game
        </button>
      </div>

      <div className="lobby-card">
        <h2>Join by Code</h2>
        <div className="lobby-row">
          <input
            className="lobby-input"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Game code"
          />
          <button className="btn btn-secondary" onClick={handleJoinByCode} disabled={busy}>
            Join
          </button>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="lobby-card">
          <h2>Open Games</h2>
          <ul className="match-list">
            {matches.map((m) => {
              const filled = m.players.filter((p) => p.name).length;
              const total = m.players.length;
              return (
                <li key={m.matchID} className="match-item">
                  <span className="match-code">{m.matchID.slice(0, 8)}…</span>
                  <span className="match-seats">
                    {filled}/{total} players
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleJoinMatch(m)}
                    disabled={busy}
                  >
                    Join
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p className="lobby-error">{error}</p>}
    </div>
  );
}
