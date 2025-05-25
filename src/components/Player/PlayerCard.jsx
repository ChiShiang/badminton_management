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
  
  const skillInfo = SKILL_LEVELS[player.skillLevel];
  const winRate = calculateWinRate(player);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', player.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      playerId: player.id,
      playerName: player.name,
      sourceType: 'player-card'
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    // 添加拖拽樣式
    e.target.classList.add('dragging');
    
    if (onDragStart) {
      onDragStart(player.id, e);
    }
  };

  const handleDragEnd = (e) => {
    // 移除拖拽樣式
    e.target.classList.remove('dragging');
    setIsDragOverForSwap(false);
    
    if (onDragEnd) {
      onDragEnd(player.id, e);
    }
  };

  const handleClick = (e) => {
    // 如果是拖拽操作，不觸發點擊
    if (e.defaultPrevented) return;
    
    if (onClick) {
      onClick(player);
    }
  };

  // 處理玩家間的直接拖拽互換
  const handleDragOver = useCallback((e) => {
    if (!allowDirectSwap) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverForSwap(true);
  }, [allowDirectSwap]);

  const handleDragLeave = useCallback((e) => {
    if (!allowDirectSwap) return;
    
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverForSwap(false);
    }
  }, [allowDirectSwap]);

  const handleDrop = useCallback((e) => {
    if (!allowDirectSwap) return;
    
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
  }, [allowDirectSwap, player.id, onPlayerSwap]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 select-none relative ${CARD_SIZES[size]} ${
        isClickable 
          ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg' 
          : 'border-gray-200'
      } ${isDraggable ? 'cursor-move' : ''} ${
        isDragOverForSwap ? 'border-green-400 bg-green-50' : ''
      }`}
      style={{ minWidth: size === 'small' ? '90px' : '110px' }}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      data-player-id={player.id}
    >
      <div className="font-semibold text-gray-800 truncate">
        {player.name}
      </div>
      <div className={`text-xs px-1 py-0.5 rounded mb-1 ${skillInfo.color}`}>
        Lv.{player.skillLevel} {skillInfo.name}
      </div>
      <div className="text-gray-500 text-xs">
        勝率: {winRate}%
      </div>
      {size !== 'small' && (
        <div className="text-gray-400 text-xs">
          {player.wins}勝 {player.losses}敗
        </div>
      )}
      
      {/* 互換提示 */}
      {isDragOverForSwap && allowDirectSwap && (
        <div className="absolute inset-0 bg-green-400 bg-opacity-20 rounded-lg flex items-center justify-center">
          <div className="text-green-700 text-xs font-bold">
            ⇄ 互換
          </div>
        </div>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;