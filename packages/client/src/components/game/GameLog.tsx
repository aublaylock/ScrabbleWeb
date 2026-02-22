import React, { useEffect, useRef } from 'react';
import type { MoveLogEntry } from '@scrabble/common';

interface Props {
  entries: MoveLogEntry[];
  playerID: string;
}

export function GameLog({ entries, playerID }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="game-log">
        <h3>Move History</h3>
        <p className="log-empty">No moves yet</p>
      </div>
    );
  }

  return (
    <div className="game-log">
      <h3>Move History</h3>
      <ul className="log-list">
        {entries.map((entry, i) => {
          const isMe = entry.playerID === playerID;
          const name = `P${parseInt(entry.playerID) + 1}${isMe ? ' (You)' : ''}`;

          let text = '';
          if (entry.type === 'place') {
            const wordList = (entry.words ?? []).join(', ');
            text = `${name}: played ${wordList} for ${entry.score ?? 0} pts`;
          } else if (entry.type === 'exchange') {
            text = `${name}: exchanged tiles`;
          } else {
            text = `${name}: passed`;
          }

          return (
            <li key={i} className={`log-entry ${isMe ? 'log-me' : ''}`}>
              {text}
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
