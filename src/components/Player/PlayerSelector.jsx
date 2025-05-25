import React, { useCallback, useState } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReplacementSelector, setShowReplacementSelector] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  
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
    setShowReplacementSelector(false);
    setDraggedPlayerId(null);
  }, [onPlayerMove, targetLocation, setActiveSelector]);

  // 拖拽事件處理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId || currentPlayers.includes(playerId)) {
      return;
    }

    // 如果區域未滿，直接添加
    if (currentPlayers.length < maxPlayers) {
      handlePlayerSelect(playerId);
      return;
    }

    // 如果區域已滿，顯示替換選擇器
    if (currentPlayers.length >= maxPlayers) {
      setDraggedPlayerId(playerId);
      setShowReplacementSelector(true);
      return;
    }
  }, [currentPlayers, maxPlayers, handlePlayerSelect]);

  const handlePlayerCardClick = useCallback((playerId) => {
    handleToggleSelector(playerId);
  }, [handleToggleSelector]);

  const handlePlayerReplace = useCallback((targetPlayerId) => {
    if (draggedPlayerId) {
      handlePlayerSelect(draggedPlayerId, targetPlayerId);
    }
  }, [draggedPlayerId, handlePlayerSelect]);

  const handleCancelReplacement = useCallback(() => {
    setShowReplacementSelector(false);
    setDraggedPlayerId(null);
  }, []);

  // 顯示替換選擇器
  if (showReplacementSelector && draggedPlayerId) {
    const draggedPlayer = players.find(p => p.id === draggedPlayerId);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3">
        <div className="text-sm text-yellow-800 mb-2 font-medium">
          選擇要被替換的玩家
        </div>
        <div className="text-xs text-yellow-700 mb-3">
          {draggedPlayer?.name} 將替換選中的玩家
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {currentPlayers.map(playerId => {
            const player = players.find(p => p.id === playerId);
            return player ? (
              <div 
                key={player.id}
                className="cursor-pointer hover:bg-yellow-100 rounded p-1"
                onClick={() => handlePlayerReplace(playerId)}
              >
                <PlayerCard
                  player={player}
                  size="small"
                  isClickable={true}
                  isDraggable={false}
                />
              </div>
            ) : null;
          })}
        </div>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleCancelReplacement}
            className="flex-1 text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

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
              isDraggable={false}
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
              isDraggable={false}
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

  // 顯示當前玩家和拖拽區域
  return (
    <div 
      className={`space-y-1 min-h-16 p-2 rounded border-2 border-dashed transition-colors ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {currentPlayers.map(playerId => {
        const player = players.find(p => p.id === playerId);
        return player ? (
          <PlayerCard
            key={player.id}
            player={player}
            size="small"
            isClickable={true}
            isDraggable={true}
            onClick={() => handlePlayerCardClick(playerId)}
            onDragStart={(draggedId) => {
              // 記錄被拖拽的玩家
              setDraggedPlayerId(draggedId);
            }}
          />
        ) : null;
      })}
      
      {currentPlayers.length < maxPlayers && (
        <button
          onClick={() => handleToggleSelector()}
          className="w-full text-xs px-2 py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + 添加玩家 ({currentPlayers.length}/{maxPlayers})
        </button>
      )}
      
      {/* 拖拽提示 */}
      {isDragOver && (
        <div className="text-center text-blue-600 text-xs py-2">
          {currentPlayers.length >= maxPlayers 
            ? '放開以選擇替換對象' 
            : '放開以添加玩家'
          }
        </div>
      )}
    </div>
  );
});

PlayerSelector.displayName = 'PlayerSelector';

export default PlayerSelector;