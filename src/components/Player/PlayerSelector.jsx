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
  waitingQueue = [], 
  restArea = [],     
  courts = [],
  isQueue = false  // 新增：標識是否為排隊區
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReplacementSelector, setShowReplacementSelector] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [selectedPlayerForReplacement, setSelectedPlayerForReplacement] = useState(null);
  
  const isShowingSelector = activeSelector === selectorId;

  // 獲取玩家狀態的函數 - 修正版本，處理重複玩家
  const getPlayerStatus = useCallback((playerId) => {
    try {
      if (!playerId) {
        return { type: 'unknown', text: '未知', color: 'bg-gray-100 text-gray-700' };
      }

      const gameState = { 
        waitingQueue: waitingQueue || [], 
        restArea: restArea || [], 
        courts: courts || [] 
      };
      
      // 檢查是否在當前選擇器的位置
      if (currentPlayers.includes(playerId)) {
        if (targetLocation.type === 'court') {
          const court = courts.find(c => c.id === targetLocation.courtId);
          const courtName = court ? court.name : '場地';
          const teamName = targetLocation.team === 'teamA' ? 'A隊' : 'B隊';
          return { 
            type: 'current', 
            text: `${courtName} ${teamName}`, 
            color: 'bg-green-100 text-green-700' 
          };
        } else if (targetLocation.type === 'waiting') {
          return { type: 'current', text: '排隊中', color: 'bg-blue-100 text-blue-700' };
        } else if (targetLocation.type === 'rest') {
          return { type: 'current', text: '休息中', color: 'bg-orange-100 text-orange-700' };
        }
      }
      
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
          const court = (courts || []).find(c => c && c.id === location.courtId);
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
    } catch (error) {
      console.error('getPlayerStatus 錯誤:', error, { playerId, waitingQueue, restArea, courts });
      return { type: 'error', text: '錯誤', color: 'bg-red-100 text-red-700' };
    }
  }, [waitingQueue, restArea, courts, currentPlayers, targetLocation]);

  // 按狀態分組的玩家列表 - 修正版本，排除當前位置的玩家
  const categorizedPlayers = useMemo(() => {
    try {
      const categories = {
        available: [],
        waiting: [],
        court: [],
        rest: []
      };
      
      if (!Array.isArray(players)) {
        console.warn('players 不是數組:', players);
        return categories;
      }
      
      players.forEach(player => {
        if (!player || !player.id) {
          console.warn('無效的玩家對象:', player);
          return;
        }

        // 排除當前位置已有的玩家（避免自己替換自己）
        if (currentPlayers.includes(player.id)) {
          return;
        }

        try {
          const status = getPlayerStatus(player.id);
          if (categories[status.type]) {
            categories[status.type].push({
              ...player,
              status
            });
          }
        } catch (error) {
          console.error('處理玩家狀態時發生錯誤:', error, player);
        }
      });
      
      return categories;
    } catch (error) {
      console.error('categorizedPlayers 計算錯誤:', error);
      return {
        available: [],
        waiting: [],
        court: [],
        rest: []
      };
    }
  }, [players, getPlayerStatus, currentPlayers]);
  
  const handleToggleSelector = useCallback((playerId = null) => {
    if (playerId) {
      // 點擊現有玩家，顯示替換選擇器
      setSelectedPlayerForReplacement(playerId);
      setShowPlayerSelector(true);
      setActiveSelector(null);
    } else {
      // 點擊添加按鈕，顯示可用玩家選擇器
      setActiveSelector(isShowingSelector ? null : selectorId);
    }
  }, [selectorId, isShowingSelector, setActiveSelector]);

  // 修正：處理玩家選擇，特別針對排隊區的邏輯
  const handlePlayerSelect = useCallback((playerId, targetPlayerId = null) => {
    try {
      console.log('🎯 選擇玩家:', { playerId, targetPlayerId, targetLocation, isQueue });
      
      // 檢查玩家是否已經在目標位置
      if (currentPlayers.includes(playerId)) {
        console.log('✅ 玩家已在目標位置');
        setActiveSelector(null);
        setShowReplacementSelector(false);
        setShowPlayerSelector(false);
        setDraggedPlayerId(null);
        setSelectedPlayerForReplacement(null);
        return true;
      }
      
      // 修正：如果是排隊區的替換操作
      if (isQueue && targetPlayerId && targetLocation.type === 'waiting') {
        console.log('🔄 排隊區內替換操作:', { playerId, targetPlayerId });
        
        // 獲取兩個玩家的位置
        const gameState = { waitingQueue, restArea, courts };
        const playerLocation = findPlayerLocation(playerId, gameState);
        const targetPlayerLocation = findPlayerLocation(targetPlayerId, gameState);
        
        console.log('📍 玩家位置信息:', { 
          player: { id: playerId, location: playerLocation },
          target: { id: targetPlayerId, location: targetPlayerLocation }
        });
        
        // 如果兩個玩家都在排隊區，使用互換
        if (playerLocation?.type === 'waiting' && targetPlayerLocation?.type === 'waiting') {
          console.log('🔄 排隊區內互換');
          const result = onPlayerSwap(playerId, targetPlayerId);
          
          // 清理狀態
          setActiveSelector(null);
          setShowReplacementSelector(false);
          setShowPlayerSelector(false);
          setDraggedPlayerId(null);
          setSelectedPlayerForReplacement(null);
          
          return result;
        } else {
          // 否則使用替換邏輯（跨區域替換）
          console.log('🔄 跨區域替換');
          const result = onPlayerMove(playerId, targetLocation, targetPlayerId);
          
          // 清理狀態
          setActiveSelector(null);
          setShowReplacementSelector(false);
          setShowPlayerSelector(false);
          setDraggedPlayerId(null);
          setSelectedPlayerForReplacement(null);
          
          return result;
        }
      }
      
      // 使用正常的移動邏輯
      const result = onPlayerMove(playerId, targetLocation, targetPlayerId);
      
      // 清理狀態
      setActiveSelector(null);
      setShowReplacementSelector(false);
      setShowPlayerSelector(false);
      setDraggedPlayerId(null);
      setSelectedPlayerForReplacement(null);
      
      return result;
    } catch (error) {
      console.error('❌ handlePlayerSelect 錯誤:', error);
      alert('選擇玩家時發生錯誤，請重試');
      return false;
    }
  }, [onPlayerMove, onPlayerSwap, targetLocation, setActiveSelector, currentPlayers, isQueue, waitingQueue, restArea, courts]);

  // 拖拽事件處理 - 改進版本
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
    console.log('📥 拖拽放下:', { playerId, currentPlayers, maxPlayers, isQueue });
    
    if (!playerId) {
      return;
    }

    // 檢查玩家是否已在當前位置
    if (currentPlayers.includes(playerId)) {
      console.log('⚠️ 玩家已在當前位置，忽略拖拽');
      return;
    }

    // 如果區域未滿，直接添加
    if (currentPlayers.length < maxPlayers) {
      console.log('✅ 區域未滿，直接添加玩家');
      handlePlayerSelect(playerId);
      return;
    }

    // 如果區域已滿，顯示替換選擇器
    if (currentPlayers.length >= maxPlayers) {
      console.log('⚠️ 區域已滿，顯示替換選擇器');
      setDraggedPlayerId(playerId);
      setShowReplacementSelector(true);
      return;
    }
  }, [currentPlayers, maxPlayers, handlePlayerSelect, isQueue]);

  const handlePlayerCardClick = useCallback((e, playerId) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleSelector(playerId);
  }, [handleToggleSelector]);

  // 修正：處理玩家替換，考慮排隊區特殊邏輯
  const handlePlayerReplace = useCallback((targetPlayerId) => {
    if (draggedPlayerId) {
      console.log('🔄 執行替換:', { draggedPlayerId, targetPlayerId, isQueue });
      
      // 如果是排隊區，檢查是否需要使用互換邏輯
      if (isQueue && targetLocation.type === 'waiting') {
        const gameState = { waitingQueue, restArea, courts };
        const draggedPlayerLocation = findPlayerLocation(draggedPlayerId, gameState);
        
        // 如果被拖拽的玩家也在排隊區，使用互換
        if (draggedPlayerLocation?.type === 'waiting') {
          console.log('🔄 排隊區內互換');
          return onPlayerSwap(draggedPlayerId, targetPlayerId);
        } else {
          // 否則使用替換邏輯
          console.log('🔄 跨區域替換到排隊區');
          return handlePlayerSelect(draggedPlayerId, targetPlayerId);
        }
      } else {
        // 其他區域使用正常替換邏輯
        return handlePlayerSelect(draggedPlayerId, targetPlayerId);
      }
    }
  }, [draggedPlayerId, handlePlayerSelect, onPlayerSwap, isQueue, targetLocation, waitingQueue, restArea, courts]);

  const handleCancelReplacement = useCallback(() => {
    setShowReplacementSelector(false);
    setShowPlayerSelector(false);
    setDraggedPlayerId(null);
    setSelectedPlayerForReplacement(null);
  }, []);

  // 修正：玩家選擇器選擇處理
  const handlePlayerSelectorChoice = useCallback((newPlayerId) => {
    if (selectedPlayerForReplacement) {
      console.log('🔄 玩家選擇器替換:', { newPlayerId, selectedPlayerForReplacement, isQueue });
      
      // 如果是排隊區，確保使用正確的邏輯
      if (isQueue && targetLocation.type === 'waiting') {
        const gameState = { waitingQueue, restArea, courts };
        const newPlayerLocation = findPlayerLocation(newPlayerId, gameState);
        
        // 如果新玩家也在排隊區，使用互換邏輯
        if (newPlayerLocation?.type === 'waiting') {
          console.log('🔄 排隊區內玩家選擇器互換');
          const success = onPlayerSwap(newPlayerId, selectedPlayerForReplacement);
          
          // 清理狀態
          setActiveSelector(null);
          setShowReplacementSelector(false);
          setShowPlayerSelector(false);
          setDraggedPlayerId(null);
          setSelectedPlayerForReplacement(null);
          
          return success;
        } else {
          // 否則使用替換邏輯
          console.log('🔄 跨區域玩家選擇器替換');
          return handlePlayerSelect(newPlayerId, selectedPlayerForReplacement);
        }
      } else {
        // 其他區域使用替換邏輯
        return handlePlayerSelect(newPlayerId, selectedPlayerForReplacement);
      }
    }
  }, [selectedPlayerForReplacement, handlePlayerSelect, onPlayerSwap, isQueue, targetLocation, waitingQueue, restArea, courts]);

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
    const selectedPlayer = (players || []).find(p => p && p.id === selectedPlayerForReplacement);
    
    return (
      <div className="bg-purple-50 border-2 border-purple-400 rounded p-3 max-h-80 overflow-y-auto">
        <div className="text-sm text-purple-800 mb-2 font-medium">
          選擇玩家替換：{selectedPlayer?.name || '未知玩家'}
        </div>
        <div className="text-xs text-purple-700 mb-3">
          {isQueue ? '點擊下方任一玩家進行替換（排隊區內自動互換位置）' : '點擊下方任一玩家進行替換'}
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
                {isQueue && <span className="text-purple-500"> (可直接互換位置)</span>}
              </div>
              <div className="space-y-1">
                {categorizedPlayers.waiting.map(player => (
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
                {categorizedPlayers.court.map(player => (
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
                {categorizedPlayers.rest.map(player => (
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
    const draggedPlayer = (players || []).find(p => p && p.id === draggedPlayerId);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3">
        <div className="text-sm text-yellow-800 mb-2 font-medium">
          選擇要被替換的玩家
        </div>
        <div className="text-xs text-yellow-700 mb-3">
          {draggedPlayer?.name || '未知玩家'} 將替換選中的玩家
          {isQueue && <span className="block text-yellow-600 mt-1">💡 排隊區內會自動調整位置順序</span>}
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {(currentPlayers || []).map(playerId => {
            const player = (players || []).find(p => p && p.id === playerId);
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

  // 顯示一般選擇器 - 修正版本，顯示所有可用玩家
  if (isShowingSelector) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded p-2">
        <div className="text-xs text-gray-600 mb-2">選擇玩家：</div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {/* 優先顯示可用玩家 */}
          {categorizedPlayers.available.length > 0 && (
            <div>
              <div className="text-xs font-medium text-green-600 mb-1">可用玩家:</div>
              {categorizedPlayers.available.map(player => (
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
          )}
          
          {/* 也顯示其他狀態的玩家，讓用戶可以選擇 */}
          {(categorizedPlayers.waiting.length > 0 || categorizedPlayers.rest.length > 0 || categorizedPlayers.court.length > 0) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-1">其他玩家:</div>
              {[...categorizedPlayers.waiting, ...categorizedPlayers.rest, ...categorizedPlayers.court].map(player => (
                <div key={player.id} className="flex items-center justify-between mb-1">
                  <PlayerCard
                    player={player}
                    size="small"
                    isClickable={true}
                    isDraggable={false}
                    onClick={() => handlePlayerSelect(player.id)}
                  />
                  <div className={`text-xs px-1 py-0.5 rounded ${player.status.color} ml-1`}>
                    {player.status.text}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {(currentPlayers || []).map(playerId => {
        const player = (players || []).find(p => p && p.id === playerId);
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
      
      {/* 添加玩家按鈕 - 確保總是顯示 */}
      {(currentPlayers || []).length < maxPlayers && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleSelector();
          }}
          className="w-full text-xs px-2 py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors focus:outline-none focus:border-blue-400"
        >
          + 添加玩家 ({(currentPlayers || []).length}/{maxPlayers})
        </button>
      )}
      
      {/* 拖拽提示 */}
      {isDragOver && (
        <div className="text-center text-blue-600 text-xs py-2">
          {(currentPlayers || []).length >= maxPlayers 
            ? '放開以選擇替換對象' 
            : '放開以添加玩家'
          }
        </div>
      )}
    </div>
  );
});

PlayerSelector.displayName = 'PlayerSelector';

// 使用 React.memo 包裝組件，並提供自定義比較函數
export default React.memo(PlayerSelector, (prevProps, nextProps) => {
  // 自定義比較函數，只在關鍵 props 變化時重新渲染
  return (
    prevProps.activeSelector === nextProps.activeSelector &&
    prevProps.currentPlayers.join(',') === nextProps.currentPlayers.join(',') &&
    prevProps.waitingQueue.join(',') === nextProps.waitingQueue.join(',') &&
    prevProps.restArea.join(',') === nextProps.restArea.join(',') &&
    prevProps.players.length === nextProps.players.length &&
    prevProps.isQueue === nextProps.isQueue &&
    // 只比較場地的玩家分配，不比較計時器狀態
    prevProps.courts.map(c => `${c.id}:${c.teamA?.join('-')}|${c.teamB?.join('-')}`).join('|') ===
    nextProps.courts.map(c => `${c.id}:${c.teamA?.join('-')}|${c.teamB?.join('-')}`).join('|')
  );
});