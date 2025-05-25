import React, { useCallback } from 'react';
import PlayerCard from './PlayerCard';

const PlayerSelector = React.memo(({ 
  targetLocation, 
  currentPlayers = [], 
  maxPlayers = 2, 
  selectorId,
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove
}) => {
  const isShowingSelector = activeSelector === selectorId;
  
  const handleToggleSelector = useCallback((playerId = null) => {
    if (playerId) {
      setActiveSelector(`${selectorId}-${playerId}`);
    } else {
      setActiveSelector(isShowingSelector ? null : selectorId);
    }
  }, [selectorId, isShowingSelector, setActiveSelector]);

  const handlePlayerSelect = useCallback((playerId, targetPlayerId = null) => {
    onPlayerMove(playerId, targetLocation, targetPlayerId);
    setActiveSelector(null);
  }, [onPlayerMove, targetLocation, setActiveSelector]);

  // 顯示互換選擇器
  if (isShowingSelector && currentPlayers.length >= maxPlayers) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded p-2">
        <div className="text-xs text-gray-600 mb-2">選擇要互換的玩家：</div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {availablePlayers.concat(players.filter(p => currentPlayers.includes(p.id))).map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              size="small"
              isClickable={true}
              onClick={() => {
                const targetPlayerId = activeSelector.includes('-') ? activeSelector.split('-')[1] : null;
                handlePlayerSelect(player.id, targetPlayerId);
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveSelector(null)}
          className="mt-2 w-full text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          取消
        </button>
      </div>
    );
  }

  // 顯示一般選擇器
  if (isShowingSelector) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded p-2">
        <div className="text-xs text-gray-600 mb-2">選擇玩家：</div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {availablePlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              size="small"
              isClickable={true}
              onClick={() => handlePlayerSelect(player.id)}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveSelector(null)}
          className="mt-2 w-full text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          取消
        </button>
      </div>
    );
  }

  // 顯示當前玩家和添加按鈕
  return (
    <div className="space-y-1">
      {currentPlayers.map(playerId => {
        const player = players.find(p => p.id === playerId);
        return player ? (
          <PlayerCard
            key={player.id}
            player={player}
            size="small"
            isClickable={true}
            onClick={() => handleToggleSelector(playerId)}
          />
        ) : null;
      })}
      {currentPlayers.length < maxPlayers && (
        <button
          onClick={() => handleToggleSelector()}
          className="w-full text-xs px-2 py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + 添加玩家
        </button>
      )}
    </div>
  );
});

PlayerSelector.displayName = 'PlayerSelector';

export default PlayerSelector;