import React from 'react';
import type { PlayerState } from '@scrabble/common';

interface Props {
  players: Record<string, PlayerState>;
  currentPlayer: string;
  myPlayerID: string;
  playOrder: string[];
}

export function ScorePanel({ players, currentPlayer, myPlayerID, playOrder }: Props) {
  return (
    <div className="score-panel">
      <h3>Scores</h3>
      <ul className="score-list">
        {playOrder.map((pid) => {
          const p = players[pid];
          const isCurrentTurn = pid === currentPlayer;
          const isMe = pid === myPlayerID;
          return (
            <li
              key={pid}
              className={[
                'score-item',
                isCurrentTurn ? 'score-active' : '',
                isMe ? 'score-me' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="score-name">
                {isCurrentTurn && <span className="turn-arrow">▶ </span>}
                Player {parseInt(pid) + 1}
                {isMe ? ' (You)' : ''}
              </span>
              <span className="score-value">{p?.score ?? 0}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
