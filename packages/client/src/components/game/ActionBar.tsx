import React from 'react';

interface Props {
  isMyTurn: boolean;
  hasPending: boolean;
  exchangeMode: boolean;
  canExchange: boolean;
  onSubmit: () => void;
  onRecallAll: () => void;
  onToggleExchange: () => void;
  onExchangeSubmit: () => void;
  onPass: () => void;
}

export function ActionBar({
  isMyTurn,
  hasPending,
  exchangeMode,
  canExchange,
  onSubmit,
  onRecallAll,
  onToggleExchange,
  onExchangeSubmit,
  onPass,
}: Props) {
  if (exchangeMode) {
    return (
      <div className="action-bar">
        <button className="btn btn-primary" onClick={onExchangeSubmit}>
          Confirm Exchange
        </button>
        <button className="btn btn-secondary" onClick={onToggleExchange}>
          Cancel
        </button>
      </div>
    );
  }

  // Planning ahead during opponent's turn — show a passive label + clear button
  if (!isMyTurn) {
    return (
      <div className="action-bar">
        {hasPending && (
          <>
            <button className="btn btn-ghost" onClick={onRecallAll}>
              Clear
            </button>
          </>
        )}
      </div>
    );
  }

  // Active turn controls
  return (
    <div className="action-bar">
      <button
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={!hasPending}
      >
        Play Word
      </button>
      {hasPending && (
        <button className="btn btn-secondary" onClick={onRecallAll}>
          Recall Tiles
        </button>
      )}
      {canExchange && (
        <button className="btn btn-secondary" onClick={onToggleExchange}>
          Exchange
        </button>
      )}
      <button className="btn btn-ghost" onClick={onPass}>
        Pass
      </button>
    </div>
  );
}
