import React, { useState, useCallback } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import PlayerSelector from '../Player/PlayerSelector';

const QueueGroups = React.memo(({ 
  waitingQueue,
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove,
  onPlayerSwap,
  restArea,
  courts
}) => {
  const [dragOverQueue, setDragOverQueue] = useState(false);

  // 將排隊人員分組，每4人一組，並正確分配到A/B隊
  const groups = [];
  for (let i = 0; i < waitingQueue.length; i += 4) {
    const groupPlayers = waitingQueue.slice(i, i + 4);
    groups.push({
      teamA: groupPlayers.slice(0, 2), // 前兩人為A隊
      teamB: groupPlayers.slice(2, 4), // 後兩人為B隊
      totalPlayers: groupPlayers.length
    });
  }

  // 如果沒有人排隊，顯示空組
  if (waitingQueue.length === 0) {
    groups.push({
      teamA: [],
      teamB: [],
      totalPlayers: 0
    });
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

  // 水平滾動控制
  const scrollContainer = (direction) => {
    const container = document.getElementById('queue-scroll-container');
    if (container) {
      const scrollAmount = 240;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 修正的玩家移動處理 - 確保在排隊區內移動時保持正確順序
  const handleQueuePlayerMove = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    console.log('🔄 排隊區玩家移動:', { playerId, targetLocation, targetPlayerId });
    
    // 如果是在排隊區內的操作，使用互換邏輯
    if (targetPlayerId && waitingQueue.includes(playerId) && waitingQueue.includes(targetPlayerId)) {
      console.log('🔄 排隊區內互換:', { playerId, targetPlayerId });
      return onPlayerSwap(playerId, targetPlayerId);
    }
    
    // 其他情況使用正常的移動邏輯
    return onPlayerMove(playerId, targetLocation, targetPlayerId);
  }, [waitingQueue, onPlayerMove, onPlayerSwap]);

  return (
    <div className="space-y-4">
      {/* 排隊區說明 */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="text-sm text-blue-700">
          <div className="font-semibold mb-1">📋 排隊順序說明</div>
          <div className="text-xs space-y-1">
            <div>• <strong>隊伍分配：</strong>按排隊順序，每4人為一組（第1、2人為A隊，第3、4人為B隊）</div>
            <div>• <strong>場地分配：</strong>完整的4人組會優先分配到空場地</div>
            <div>• <strong>順序調整：</strong>可在組內拖拽調整位置，或點擊玩家選擇替換</div>
          </div>
        </div>
      </div>

      {/* 水平滾動容器 */}
      {groups.length > 0 && waitingQueue.length > 0 && (
        <div className="relative">
          {/* 滾動控制按鈕 - 左 */}
          {groups.length > 4 && (
            <button
              onClick={() => scrollContainer('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
              style={{ marginLeft: '-12px' }}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* 滾動控制按鈕 - 右 */}
          {groups.length > 4 && (
            <button
              onClick={() => scrollContainer('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
              style={{ marginRight: '-12px' }}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* 排隊組水平滾動區域 */}
          <div 
            id="queue-scroll-container"
            className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2"
            style={{
              scrollbarWidth: 'thin',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {groups.map((group, groupIndex) => (
              <div 
                key={groupIndex} 
                className={`flex-shrink-0 w-56 border-2 rounded-lg p-2 ${
                  group.totalPlayers === 4 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="text-xs font-medium text-center mb-2">
                  <span className={group.totalPlayers === 4 ? 'text-green-700' : 'text-blue-700'}>
                    第 {groupIndex + 1} 組 ({group.totalPlayers}/4人)
                    {group.totalPlayers === 4 && <span className="ml-1">✅ 可上場</span>}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {/* 隊伍A */}
                  <div className="border border-red-200 rounded p-1.5 bg-white min-h-14">
                    <div className="text-xs text-red-600 font-medium mb-1 text-center">
                      A隊 ({group.teamA.length}/2) - 排隊位置 {groupIndex * 4 + 1}, {groupIndex * 4 + 2}
                    </div>
                    <PlayerSelector
                      targetLocation={{ type: 'waiting' }}
                      currentPlayers={group.teamA}
                      maxPlayers={2}
                      selectorId={`queue-${groupIndex}-A`}
                      activeSelector={activeSelector}
                      setActiveSelector={setActiveSelector}
                      availablePlayers={availablePlayers}
                      players={players}
                      onPlayerMove={handleQueuePlayerMove}
                      onPlayerSwap={onPlayerSwap}
                      waitingQueue={waitingQueue}
                      restArea={restArea}
                      courts={courts}
                      isQueue={true}
                    />
                  </div>
                  
                  {/* 隊伍B */}
                  <div className="border border-blue-200 rounded p-1.5 bg-white min-h-14">
                    <div className="text-xs text-blue-600 font-medium mb-1 text-center">
                      B隊 ({group.teamB.length}/2) - 排隊位置 {groupIndex * 4 + 3}, {groupIndex * 4 + 4}
                    </div>
                    <PlayerSelector
                      targetLocation={{ type: 'waiting' }}
                      currentPlayers={group.teamB}
                      maxPlayers={2}
                      selectorId={`queue-${groupIndex}-B`}
                      activeSelector={activeSelector}
                      setActiveSelector={setActiveSelector}
                      availablePlayers={availablePlayers}
                      players={players}
                      onPlayerMove={handleQueuePlayerMove}
                      onPlayerSwap={onPlayerSwap}
                      waitingQueue={waitingQueue}
                      restArea={restArea}
                      courts={courts}
                      isQueue={true}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* 新增排隊組按鈕 */}
            {waitingQueue.length % 4 === 0 && waitingQueue.length > 0 && (
              <div className="flex-shrink-0 w-56 flex items-center justify-center">
                <button
                  onClick={handleAddQueueGroup}
                  className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                  disabled={availablePlayers.length === 0}
                >
                  <Users className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">新增排隊組</span>
                  <span className="text-xs opacity-75">點擊添加</span>
                </button>
              </div>
            )}
          </div>

          {/* 滾動提示 */}
          {groups.length > 4 && (
            <div className="text-center mt-2">
              <div className="text-xs text-gray-500 flex items-center justify-center space-x-2">
                <ChevronLeft className="w-3 h-3" />
                <span>左右滑動查看更多排隊組</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空狀態 - 支援拖拽 */}
      {waitingQueue.length === 0 && (
        <div 
          className={`text-center py-12 border-2 border-dashed rounded-lg transition-colors ${
            dragOverQueue 
              ? 'border-blue-400 bg-blue-50 text-blue-600' 
              : 'border-gray-300 text-gray-500 bg-gray-50'
          }`}
          onDragOver={handleQueueDragOver}
          onDragLeave={handleQueueDragLeave}
          onDrop={handleQueueDrop}
        >
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <div className="text-lg font-medium mb-2">
            {dragOverQueue ? '放開以加入排隊' : '尚無排隊玩家'}
          </div>
          <div className="text-sm text-gray-400 mb-4">
            拖拽玩家到此處或點擊下方按鈕開始排隊
          </div>
          <button
            onClick={handleStartQueue}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            disabled={availablePlayers.length === 0}
          >
            開始排隊
          </button>
          {availablePlayers.length === 0 && (
            <div className="text-xs text-gray-400 mt-2">
              請先在玩家管理中新增玩家
            </div>
          )}
        </div>
      )}

      {/* 排隊統計信息 */}
      {waitingQueue.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{waitingQueue.length}</div>
              <div className="text-xs text-gray-600">排隊人數</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{groups.length}</div>
              <div className="text-xs text-gray-600">排隊組數</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">
                {groups.filter(group => group.totalPlayers === 4).length}
              </div>
              <div className="text-xs text-gray-600">完整隊伍</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                {waitingQueue.length % 4}
              </div>
              <div className="text-xs text-gray-600">等待配對</div>
            </div>
          </div>
        </div>
      )}

      {/* 排隊區操作提示 */}
      {waitingQueue.length > 0 && (
        <div className="bg-blue-25 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-700 space-y-1">
            <div>💡 <strong>排隊區操作提示：</strong></div>
            <div>• <strong>分隊順序：</strong>每4人自動分組，位置1、2為A隊，位置3、4為B隊</div>
            <div>• <strong>上場順序：</strong>完整的4人組優先分配到空場地</div>
            <div>• <strong>位置調整：</strong>可拖拽玩家調整排隊順序</div>
            <div>• <strong>隊伍平衡：</strong>系統會按排隊順序分配，保持公平性</div>
            <div>• <strong>平板操作：</strong>左右滑動查看更多排隊組</div>
          </div>
        </div>
      )}

      {/* CSS 樣式注入 */}
      <style jsx>{`
        /* 隱藏滾動條但保持功能 */
        #queue-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        
        #queue-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        #queue-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        #queue-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* 平板觸控優化 */
        @media (hover: none) and (pointer: coarse) {
          #queue-scroll-container {
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
          }
          
          #queue-scroll-container > div {
            scroll-snap-align: start;
          }
        }
        
        /* 平板和手機響應式 */
        @media (max-width: 768px) {
          #queue-scroll-container > div {
            width: 200px;
          }
        }
        
        @media (max-width: 480px) {
          #queue-scroll-container > div {
            width: 180px;
          }
        }
        
        /* 桌面端確保卡片寬度一致 */
        @media (min-width: 769px) {
          #queue-scroll-container > div {
            width: 224px; /* w-56 */
          }
        }
      `}</style>
    </div>
  );
});

QueueGroups.displayName = 'QueueGroups';

export default QueueGroups;