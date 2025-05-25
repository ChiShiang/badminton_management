import React, { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import PlayerSelector from '../Player/PlayerSelector';

const QueueGroups = React.memo(({ 
  waitingQueue,
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove,
  onPlayerSwap
}) => {
  const [dragOverQueue, setDragOverQueue] = useState(false);

  // 將排隊人員分組，每4人一組
  const groups = [];
  for (let i = 0; i < waitingQueue.length; i += 4) {
    groups.push(waitingQueue.slice(i, i + 4));
  }

  // 如果沒有完整的組或者沒有人排隊，顯示空組
  if (waitingQueue.length % 4 !== 0 || waitingQueue.length === 0) {
    const lastGroupSize = waitingQueue.length % 4;
    if (lastGroupSize === 0 && waitingQueue.length === 0) {
      groups.push([]); // 完全空的組
    }
  }

  const handleStartQueue = () => {
    if (availablePlayers.length > 0) {
      onPlayerMove(availablePlayers[0].id, { type: 'waiting' });
    }
  };

  const handleAddQueueGroup = () => {
    if (availablePlayers.length > 0) {
      onPlayerMove(availablePlayers[0].id, { type: 'waiting' });
    }
  };

  // 排隊區域拖拽處理
  const handleQueueDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQueue(true);
  }, []);

  const handleQueueDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverQueue(false);
    }
  }, []);

  const handleQueueDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverQueue(false);
    
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId && !waitingQueue.includes(playerId)) {
      onPlayerMove(playerId, { type: 'waiting' });
    }
  }, [waitingQueue, onPlayerMove]);

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-blue-50">
          <div className="text-sm font-medium text-blue-700 mb-3 text-center">
            第 {groupIndex + 1} 組 ({group.length}/4人)
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* 隊伍A */}
            <div className="border border-blue-200 rounded p-2 bg-white min-h-24">
              <div className="text-xs text-blue-600 font-medium mb-2 text-center">隊伍A</div>
              <PlayerSelector
                targetLocation={{ type: 'waiting' }}
                currentPlayers={group.slice(0, 2)}
                maxPlayers={2}
                selectorId={`queue-${groupIndex}-A`}
                activeSelector={activeSelector}
                setActiveSelector={setActiveSelector}
                availablePlayers={availablePlayers}
                players={players}
                onPlayerMove={onPlayerMove}
                onPlayerSwap={onPlayerSwap}
              />
            </div>
            
            {/* 隊伍B */}
            <div className="border border-red-200 rounded p-2 bg-white min-h-24">
              <div className="text-xs text-red-600 font-medium mb-2 text-center">隊伍B</div>
              <PlayerSelector
                targetLocation={{ type: 'waiting' }}
                currentPlayers={group.slice(2, 4)}
                maxPlayers={2}
                selectorId={`queue-${groupIndex}-B`}
                activeSelector={activeSelector}
                setActiveSelector={setActiveSelector}
                availablePlayers={availablePlayers}
                players={players}
                onPlayerMove={onPlayerMove}
                onPlayerSwap={onPlayerSwap}
              />
            </div>
          </div>
        </div>
      ))}
      
      {/* 新增排隊組按鈕 */}
      {waitingQueue.length % 4 === 0 && waitingQueue.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleAddQueueGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            disabled={availablePlayers.length === 0}
          >
            新增排隊組
          </button>
        </div>
      )}

      {/* 空狀態 - 支援拖拽 */}
      {waitingQueue.length === 0 && (
        <div 
          className={`text-center py-8 border-2 border-dashed rounded-lg transition-colors ${
            dragOverQueue 
              ? 'border-blue-400 bg-blue-50 text-blue-600' 
              : 'border-gray-300 text-gray-500'
          }`}
          onDragOver={handleQueueDragOver}
          onDragLeave={handleQueueDragLeave}
          onDrop={handleQueueDrop}
        >
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <div className="mb-3">
            {dragOverQueue ? '放開以加入排隊' : '尚無排隊玩家'}
          </div>
          <div className="text-sm text-gray-400 mb-3">
            拖拽玩家到此處或點擊下方按鈕
          </div>
          <button
            onClick={handleStartQueue}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={availablePlayers.length === 0}
          >
            開始排隊
          </button>
        </div>
      )}

      {/* 快速排隊區域 - 當有人排隊時顯示 */}
      {waitingQueue.length > 0 && (
        <div 
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragOverQueue 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-blue-300 bg-blue-25'
          }`}
          onDragOver={handleQueueDragOver}
          onDragLeave={handleQueueDragLeave}
          onDrop={handleQueueDrop}
        >
          <div className="text-center text-blue-600 text-sm">
            <Users className="w-6 h-6 mx-auto mb-2" />
            {dragOverQueue ? '放開以加入排隊' : '拖拽玩家到此處加入排隊'}
          </div>
        </div>
      )}

      {/* 排隊區操作提示 */}
      {waitingQueue.length > 0 && (
        <div className="bg-blue-25 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-700 space-y-1">
            <div>💡 <strong>排隊區操作提示：</strong></div>
            <div>• 每組4人會自動分為A、B兩隊</div>
            <div>• 可在組內拖拽調整隊伍分配</div>
            <div>• 支援與場地、休息區玩家互換</div>
            <div>• 拖拽到其他玩家上可直接互換位置</div>
          </div>
        </div>
      )}
    </div>
  );
});

QueueGroups.displayName = 'QueueGroups';

export default QueueGroups;