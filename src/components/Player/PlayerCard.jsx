import React, { useState, useCallback } from 'react';
import { SKILL_LEVELS, CARD_SIZES } from '../../utils/constants';
import { calculateWinRate } from '../../utils/gameUtils';

const PlayerCard = React.memo(({ 
  player, 
  size = 'normal', 
  onClick = null, 
  isClickable = false,
  isDraggable = true,
  onDragStart = null,
  onDragEnd = null,
  allowDirectSwap = true,
  onPlayerSwap = null
}) => {
  const [isDragOverForSwap, setIsDragOverForSwap] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const skillInfo = SKILL_LEVELS[player.skillLevel];
  const winRate = calculateWinRate(player);

  const handleDragStart = (e) => {
    // 防止意外的文字選取和搜尋
    e.dataTransfer.setData('text/plain', player.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      playerId: player.id,
      playerName: player.name,
      sourceType: 'player-card'
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    // 清除可能的文字選取
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    // 添加拖拽樣式
    setIsDragging(true);
    e.target.classList.add('dragging');
    
    if (onDragStart) {
      onDragStart(player.id, e);
    }
  };

  const handleDragEnd = (e) => {
    // 移除拖拽樣式
    setIsDragging(false);
    e.target.classList.remove('dragging');
    setIsDragOverForSwap(false);
    
    if (onDragEnd) {
      onDragEnd(player.id, e);
    }
  };

  const handleClick = (e) => {
    // 防止拖拽時觸發點擊
    if (isDragging || e.defaultPrevented) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(e, player);
    }
  };

  const handleMouseDown = (e) => {
    // 防止文字選取
    e.preventDefault();
  };

  const handleSelectStart = (e) => {
    // 防止文字選取
    e.preventDefault();
    return false;
  };

  // 處理玩家間的直接拖拽互換
  const handleDragOver = useCallback((e) => {
    if (!allowDirectSwap || isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverForSwap(true);
  }, [allowDirectSwap, isDragging]);

  const handleDragLeave = useCallback((e) => {
    if (!allowDirectSwap || isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverForSwap(false);
    }
  }, [allowDirectSwap, isDragging]);

  const handleDrop = useCallback((e) => {
    if (!allowDirectSwap || isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverForSwap(false);
    
    const draggedPlayerId = e.dataTransfer.getData('text/plain');
    const dragData = e.dataTransfer.getData('application/json');
    
    if (draggedPlayerId && draggedPlayerId !== player.id) {
      try {
        const parsedData = JSON.parse(dragData);
        if (parsedData.sourceType === 'player-card') {
          // 觸發玩家互換
          if (onPlayerSwap) {
            onPlayerSwap(draggedPlayerId, player.id);
          }
        }
      } catch (error) {
        console.warn('Failed to parse drag data:', error);
      }
    }
  }, [allowDirectSwap, player.id, onPlayerSwap, isDragging]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 select-none relative ${CARD_SIZES[size]} ${
        isClickable 
          ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg' 
          : 'border-gray-200'
      } ${isDraggable && !isDragging ? 'cursor-move' : ''} ${
        isDragging ? 'opacity-60 transform rotate-2 scale-105' : ''
      } ${
        isDragOverForSwap ? 'border-green-400 bg-green-50' : ''
      }`}
      style={{ 
        minWidth: size === 'small' ? '90px' : '110px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      draggable={isDraggable && !isDragOverForSwap}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onSelectStart={handleSelectStart}
      data-player-id={player.id}
    >
      <div className="font-semibold text-gray-800 truncate pointer-events-none">
        {player.name}
      </div>
      <div className={`text-xs px-1 py-0.5 rounded mb-1 pointer-events-none ${skillInfo.color}`}>
        Lv.{player.skillLevel} {skillInfo.name}
      </div>
      <div className="text-gray-500 text-xs pointer-events-none">
        勝率: {winRate}%
      </div>
      {size !== 'small' && (
        <div className="text-gray-400 text-xs pointer-events-none">
          {player.wins}勝 {player.losses}敗
        </div>
      )}
      
      {/* 互換提示 */}
      {isDragOverForSwap && allowDirectSwap && !isDragging && (
        <div className="absolute inset-0 bg-green-400 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-green-700 text-xs font-bold">
            ⇄ 互換
          </div>
        </div>
      )}

      {/* 拖拽中提示 */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-400 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-blue-700 text-xs font-bold">
            📱 拖拽中
          </div>
        </div>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;