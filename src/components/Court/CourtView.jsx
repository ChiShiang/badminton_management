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
  onPlayerMove
}) => {
  const totalPlayers = court.teamA.length + court.teamB.length;

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
        
        {/* A隊區域 */}
        <div className="absolute left-0 top-0 w-1/2 h-full p-2 flex flex-col">
          <div className="text-sm font-bold text-red-600 bg-white px-2 py-1 rounded mb-2 text-center">
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
            />
          </div>
        </div>

        {/* B隊區域 */}
        <div className="absolute right-0 top-0 w-1/2 h-full p-2 flex flex-col">
          <div className="text-sm font-bold text-blue-600 bg-white px-2 py-1 rounded mb-2 text-center">
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
            />
          </div>
        </div>
      </div>

      {/* 比賽控制按鈕 */}
      {court.isGameActive && (
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => onEndGame(court.id, 'A')}
            className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            A隊獲勝
          </button>
          <button
            onClick={() => onEndGame(court.id, 'B')}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            B隊獲勝
          </button>
        </div>
      )}
    </div>
  );
});

CourtView.displayName = 'CourtView';

export default CourtView;