import React, { useState, useCallback } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import UnifiedPlayerSelector from '../Player/UnifiedPlayerSelector';

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

  // 水平滾動控制
  const scrollContainer = (direction) => {
    const container = document.getElementById('queue-scroll-container');
    if (container) {
      const scrollAmount = 240; // 約一個卡片的寬度(56*4=224) + gap(16)
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
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
                className="flex-shrink-0 w-56 border-2 border-dashed border-blue-300 rounded-lg p-2 bg-blue-50"
              >
                <div className="text-xs font-medium text-blue-700 mb-2 text-center">
                  第 {groupIndex + 1} 組 ({group.length}/4人)
                </div>
                <div className="space-y-1.5">
                  {/* 隊伍A */}
                  <div className="border border-blue-200 rounded p-1.5 bg-white min-h-14">
                    <div className="text-xs text-blue-600 font-medium mb-1 text-center">隊伍A</div>
                    <UnifiedPlayerSelector
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
                      waitingQueue={waitingQueue}
                      restArea={restArea}
                      courts={courts}
                      title={`第${groupIndex + 1}組 隊伍A 選擇`}
                      allowReplace={true}
                      showStatus={true} // 修正：排隊區域也顯示狀態
                    />
                  </div>
                  
                  {/* 隊伍B */}
                  <div className="border border-red-200 rounded p-1.5 bg-white min-h-14">
                    <div className="text-xs text-red-600 font-medium mb-1 text-center">隊伍B</div>
                    <UnifiedPlayerSelector
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
                      waitingQueue={waitingQueue}
                      restArea={restArea}
                      courts={courts}
                      title={`第${groupIndex + 1}組 隊伍B 選擇`}
                      allowReplace={true}
                      showStatus={true} // 修正：排隊區域也顯示狀態
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
          <div className="grid grid-cols-3 gap-4 text-center">
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
                {groups.filter(group => group.length === 4).length}
              </div>
              <div className="text-xs text-gray-600">完整隊伍</div>
            </div>
          </div>
        </div>
      )}

      {/* 排隊區操作提示 - 更新版本 */}
      {waitingQueue.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-700 space-y-1">
            <div>🎯 <strong>全新排隊體驗：</strong></div>
            <div>• 每組4人會自動分為A、B兩隊</div>
            <div>• 點擊「添加玩家」按鈕開啟智能選擇介面</div>
            <div>• <strong>新增功能：</strong>選擇介面現在顯示玩家狀態</div>
            <div>• 玩家列表按優先級和勝率智能排序</div>
            <div>• <strong>平板操作：</strong>左右滑動查看更多排隊組</div>
            <div>• 拖拽到其他玩家上可直接互換位置</div>
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