import React from 'react';
import { Trash2 } from 'lucide-react';
import CourtTimer from './CourtTimer';
import PlayerSelector from '../Player/PlayerSelector';

const CourtView = React.memo(({ 
  court, 
  onRemoveCourt,
  onSetWarmupTime,
  onStartWarmup,
  onPauseWarmup,
  onResetWarmup,
  onStartGame,
  onEndGame,
  // PlayerSelector props
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove,
  onPlayerSwap
}) => {
  const totalPlayers = court.teamA.length + court.teamB.length;

  const handleQuickFillCourt = () => {
    if (availablePlayers.length >= 4) {
      // 這個邏輯應該在主組件中處理
      console.log('Quick fill court:', court.id);
      // 可以通過 props 傳遞一個回調函數來處理
    } else {
      alert(`排隊區人數不足，需要4人但只有${availablePlayers.length}人`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      {/* 場地標題 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-800">{court.name}</h3>
        <div className="flex space-x-2">
          <div className={`text-xs px-2 py-1 rounded ${
            totalPlayers === 4 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {totalPlayers}/4人
          </div>
          <button
            onClick={() => onRemoveCourt(court.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
            title="刪除場地"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 計時器區域 */}
      <CourtTimer
        court={court}
        onSetWarmupTime={onSetWarmupTime}
        onStartWarmup={onStartWarmup}
        onPauseWarmup={onPauseWarmup}
        onResetWarmup={onResetWarmup}
        onStartGame={onStartGame}
      />

      {/* 場地俯瞰圖 */}
      <div 
        className="relative bg-gradient-to-b from-green-100 to-green-200 rounded-lg border-2 border-green-300" 
        style={{ height: '220px' }}
      >
        {/* 中線 */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white transform -translate-x-0.5"></div>
        
        {/* 場地線條 */}
        <div className="absolute inset-2">
          {/* 外邊界線 */}
          <div className="absolute inset-0 border-2 border-white opacity-60"></div>
          
          {/* 發球線 */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-white opacity-40"></div>
          <div className="absolute bottom-12 left-0 right-0 h-0.5 bg-white opacity-40"></div>
          
          {/* 單打邊線 */}
          <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-white opacity-40"></div>
          <div className="absolute top-0 bottom-0 right-8 w-0.5 bg-white opacity-40"></div>
        </div>
        
        {/* A隊區域 */}
        <div className="absolute left-0 top-0 w-1/2 h-full p-2 flex flex-col">
          <div className="text-sm font-bold text-red-600 bg-white px-2 py-1 rounded mb-2 text-center shadow-sm">
            A隊 ({court.teamA.length}/2)
          </div>
          <div className="flex-1">
            <PlayerSelector
              targetLocation={{ type: 'court', courtId: court.id, team: 'teamA' }}
              currentPlayers={court.teamA}
              maxPlayers={2}
              selectorId={`court-${court.id}-teamA`}
              activeSelector={activeSelector}
              setActiveSelector={setActiveSelector}
              availablePlayers={availablePlayers}
              players={players}
              onPlayerMove={onPlayerMove}
              onPlayerSwap={onPlayerSwap}
            />
          </div>
        </div>

        {/* B隊區域 */}
        <div className="absolute right-0 top-0 w-1/2 h-full p-2 flex flex-col">
          <div className="text-sm font-bold text-blue-600 bg-white px-2 py-1 rounded mb-2 text-center shadow-sm">
            B隊 ({court.teamB.length}/2)
          </div>
          <div className="flex-1">
            <PlayerSelector
              targetLocation={{ type: 'court', courtId: court.id, team: 'teamB' }}
              currentPlayers={court.teamB}
              maxPlayers={2}
              selectorId={`court-${court.id}-teamB`}
              activeSelector={activeSelector}
              setActiveSelector={setActiveSelector}
              availablePlayers={availablePlayers}
              players={players}
              onPlayerMove={onPlayerMove}
              onPlayerSwap={onPlayerSwap}
            />
          </div>
        </div>

        {/* 比賽狀態指示器 */}
        {court.isGameActive && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            比賽中
          </div>
        )}
        
        {court.isWarmupActive && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            熱身中
          </div>
        )}

        {/* 場地中央網子視覺效果 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 opacity-60"></div>
      </div>

      {/* 比賽控制按鈕 */}
      {court.isGameActive && (
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => onEndGame(court.id, 'A')}
            className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors font-medium shadow-md"
          >
            A隊獲勝
          </button>
          <button
            onClick={() => onEndGame(court.id, 'B')}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors font-medium shadow-md"
          >
            B隊獲勝
          </button>
        </div>
      )}

      {/* 快速操作按鈕 */}
      {!court.isGameActive && totalPlayers === 0 && (
        <div className="mt-3">
          <button
            onClick={handleQuickFillCourt}
            className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            disabled={availablePlayers.length < 4}
          >
            快速補位 (需要4人)
          </button>
        </div>
      )}

      {/* 場地操作提示 */}
      {!court.isGameActive && totalPlayers > 0 && totalPlayers < 4 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="text-xs text-yellow-700 text-center">
            還需要 {4 - totalPlayers} 人才能開始比賽
          </div>
          <div className="text-xs text-yellow-600 text-center mt-1">
            拖拽玩家到A隊或B隊區域，或與其他玩家互換位置
          </div>
        </div>
      )}

      {/* 隊伍平衡提示 */}
      {totalPlayers === 4 && Math.abs(court.teamA.length - court.teamB.length) > 0 && (
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-2">
          <div className="text-xs text-orange-700 text-center">
            隊伍人數不平衡：A隊 {court.teamA.length}人，B隊 {court.teamB.length}人
          </div>
          <div className="text-xs text-orange-600 text-center mt-1">
            建議調整為每隊2人以保持比賽公平
          </div>
        </div>
      )}

      {/* 互換操作提示 */}
      {totalPlayers >= 2 && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
          <div className="text-xs text-blue-700 space-y-1">
            <div>💡 <strong>場地互換操作：</strong></div>
            <div>• 拖拽玩家到另一玩家上可直接互換位置</div>
            <div>• 拖拽到滿員隊伍可選擇替換對象</div>
            <div>• 支援與排隊區、休息區玩家互換</div>
            <div>• A隊↔B隊之間也可以互換</div>
          </div>
        </div>
      )}
    </div>
  );
});

CourtView.displayName = 'CourtView';

export default CourtView;