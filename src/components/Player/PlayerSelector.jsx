import React, { useCallback, useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import { findPlayerLocation } from '../../utils/gameUtils';

const PlayerSelector = React.memo(({ 
  targetLocation, 
  currentPlayers = [], 
  maxPlayers = 2, 
  selectorId,
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove,
  onPlayerSwap,
  waitingQueue,
  restArea,
  courts
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReplacementSelector, setShowReplacementSelector] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [selectedPlayerForReplacement, setSelectedPlayerForReplacement] = useState(null);
  
  const isShowingSelector = activeSelector === selectorId;

  // 獲取玩家狀態的函數
  const getPlayerStatus = useCallback((playerId) => {
    const gameState = { waitingQueue, restArea, courts };
    const location = findPlayerLocation(playerId, gameState);
    
    if (!location) {
      return { type: 'available', text: '可用', color: 'bg-green-100 text-green-700' };
    }
    
    switch (location.type) {
      case 'waiting':
        return { type: 'waiting', text: '排隊中', color: 'bg-blue-100 text-blue-700' };
      case 'rest':
        return { type: 'rest', text: '休息中', color: 'bg-orange-100 text-orange-700' };
      case 'court':
        const court = courts.find(c => c.id === location.courtId);
        const courtName = court ? court.name : '場地';
        const teamName = location.team === 'teamA' ? 'A隊' : 'B隊';
        return { 
          type: 'court', 
          text: `${courtName} ${teamName}`, 
          color: 'bg-purple-100 text-purple-700' 
        };
      default:
        return { type: 'unknown', text: '未知', color: 'bg-gray-100 text-gray-700' };
    }
  }, [waitingQueue, restArea, courts]);

  // 按狀態分組的玩家列表
  const categorizedPlayers = useMemo(() => {
    const categories = {
      available: [],
      waiting: [],
      court: [],
      rest: []
    };
    
    players.forEach(player => {
      const status = getPlayerStatus(player.id);
      if (categories[status.type]) {
        categories[status.type].push({
          ...player,
          status
        });
      }
    });
    
    return categories;
  }, [players, getPlayerStatus]);
  
  const handleToggleSelector = useCallback((playerId = null) => {
    if (playerId) {
      // 點擊現有玩家，顯示替換選擇器
      setSelectedPlayerForReplacement(playerId);
      setShowPlayerSelector(true);
      setActiveSelector(null);
    } else {
      setActiveSelector(isShowingSelector ? null : selectorId);
    }
  }, [selectorId, isShowingSelector, setActiveSelector]);

  const handlePlayerSelect = useCallback((playerId, targetPlayerId = null) => {
    const result = onPlayerMove(playerId, targetLocation, targetPlayerId);
    setActiveSelector(null);
    setShowReplacementSelector(false);
    setShowPlayerSelector(false);
    setDraggedPlayerId(null);
    setSelectedPlayerForReplacement(null);
    return result;
  }, [onPlayerMove, targetLocation, setActiveSelector]);

  // 拖拽事件處理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handlePlayerCardClick = useCallback((e, playerId) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleSelector(playerId);
  }, [handleToggleSelector]);

  const handlePlayerReplace = useCallback((targetPlayerId) => {
    if (draggedPlayerId) {
      handlePlayerSelect(draggedPlayerId, targetPlayerId);
    }
  }, [draggedPlayerId, handlePlayerSelect]);

  const handleCancelReplacement = useCallback(() => {
    setShowReplacementSelector(false);
    setShowPlayerSelector(false);
    setDraggedPlayerId(null);
    setSelectedPlayerForReplacement(null);
  }, []);

  const handlePlayerSelectorChoice = useCallback((newPlayerId) => {
    if (selectedPlayerForReplacement) {
      // 執行替換操作：新玩家替換選中的玩家
      const success = handlePlayerSelect(newPlayerId, selectedPlayerForReplacement);
      if (!success) {
        alert('替換失敗，請重試');
      }
    }
  }, [selectedPlayerForReplacement, handlePlayerSelect]);

  // 玩家狀態組件
  const PlayerWithStatus = ({ player, onClick, isClickable = true }) => (
    <div 
      className={`cursor-pointer hover:bg-purple-100 rounded p-2 border border-purple-200 ${
        isClickable ? 'hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <PlayerCard
            player={player}
            size="small"
            isClickable={false}
            isDraggable={false}
          />
        </div>
        <div className={`ml-2 text-xs px-2 py-1 rounded-full ${player.status.color}`}>
          {player.status.text}
        </div>
      </div>
    </div>
  );

  // 顯示玩家選擇器（點擊現有玩家時）
  if (showPlayerSelector && selectedPlayerForReplacement) {
    const selectedPlayer = players.find(p => p.id === selectedPlayerForReplacement);
    const excludeIds = new Set(currentPlayers);
    
    return (
      <div className="bg-purple-50 border-2 border-purple-400 rounded p-3 max-h-80 overflow-y-auto">
        <div className="text-sm text-purple-800 mb-2 font-medium">
          選擇玩家替換：{selectedPlayer?.name}
        </div>
        <div className="text-xs text-purple-700 mb-3">
          點擊下方任一玩家進行替換
        </div>
        
        <div className="space-y-3">
          {/* 可用玩家 */}
          {categorizedPlayers.available.length > 0 && (
            <div>
              <div className="text-xs font-medium text-purple-600 border-b border-purple-200 pb-1 mb-2">
                🟢 可用玩家 ({categorizedPlayers.available.length})
              </div>
              <div className="space-y-1">
                {categorizedPlayers.available.map(player => (
                  <PlayerWithStatus
                    key={player.id}
                    player={player}
                    onClick={() => handlePlayerSelectorChoice(player.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* 排隊中玩家 */}
          {categorizedPlayers.waiting.length > 0 && (
            <div>
              <div className="text-xs font-medium text-purple-600 border-b border-purple-200 pb-1 mb-2">
                🔵 排隊中玩家 ({categorizedPlayers.waiting.length})
              </div>
              <div className="space-y-1">
                {categorizedPlayers.waiting
                  .filter(player => !excludeIds.has(player.id))
                  .map(player => (
                    <PlayerWithStatus
                      key={player.id}
                      player={player}
                      onClick={() => handlePlayerSelectorChoice(player.id)}
                    />
                  ))}
              </div>
            </div>
          )}
          
          {/* 場上玩家 */}
          {categorizedPlayers.court.length > 0 && (
            <div>
              <div className="text-xs font-medium text-purple-600 border-b border-purple-200 pb-1 mb-2">
                🟣 場上玩家 ({categorizedPlayers.court.length})
              </div>
              <div className="space-y-1">
                {categorizedPlayers.court
                  .filter(player => !excludeIds.has(player.id))
                  .map(player => (
                    <PlayerWithStatus
                      key={player.id}
                      player={player}
                      onClick={() => handlePlayerSelectorChoice(player.id)}
                    />
                  ))}
              </div>
            </div>
          )}
          
          {/* 休息中玩家 */}
          {categorizedPlayers.rest.length > 0 && (
            <div>
              <div className="text-xs font-medium text-purple-600 border-b border-purple-200 pb-1 mb-2">
                🟠 休息中玩家 ({categorizedPlayers.rest.length})
              </div>
              <div className="space-y-1">
                {categorizedPlayers.rest
                  .filter(player => !excludeIds.has(player.id))
                  .map(player => (
                    <PlayerWithStatus
                      key={player.id}
                      player={player}
                      onClick={() => handlePlayerSelectorChoice(player.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleCancelReplacement}
            className="flex-1 text-xs px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            取消替換
          </button>
        </div>
      </div>
    );
  }

  // 顯示替換選擇器（拖拽到滿員區域時）
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
            if (!player) return null;
            
            const status = getPlayerStatus(playerId);
            return (
              <div 
                key={player.id}
                className="cursor-pointer hover:bg-yellow-100 rounded p-1 border border-yellow-300"
                onClick={() => handlePlayerReplace(playerId)}
              >
                <div className="flex items-center justify-between">
                  <PlayerCard
                    player={player}
                    size="small"
                    isClickable={false}
                    isDraggable={false}
                  />
                  <div className={`text-xs px-2 py-1 rounded ${status.color} ml-2`}>
                    {status.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleCancelReplacement}
          className="mt-3 w-full text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
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
            onClick={(e) => handlePlayerCardClick(e, playerId)}
            onDragStart={(draggedId) => {
              setDraggedPlayerId(draggedId);
            }}
            allowDirectSwap={true}
            onPlayerSwap={onPlayerSwap}
          />
        ) : null;
      })}
      
      {currentPlayers.length < maxPlayers && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleSelector();
          }}
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