import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/gameUtils';
import { DEFAULT_SETTINGS } from '../../utils/constants';

const CourtTimer = ({ 
  court, 
  onSetWarmupTime, 
  onStartWarmup, 
  onPauseWarmup, 
  onResetWarmup,
  onStartGame 
}) => {
  const totalPlayers = court.teamA.length + court.teamB.length;
  const canStartGame = totalPlayers === 4 && !court.isGameActive;

  return (
    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
      {/* 熱身計時器 */}
      <div className="bg-yellow-50 rounded p-2">
        <div className="flex items-center justify-between">
          <span className="text-yellow-700">熱身</span>
          <span className="font-mono font-bold">
            {formatTime(court.warmupTime)}
          </span>
        </div>
        
        {/* 時間設定按鈕 */}
        <div className="flex space-x-1 mt-1">
          {DEFAULT_SETTINGS.warmupTimes.map(min => (
            <button
              key={min}
              onClick={() => onSetWarmupTime(court.id, min)}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
            >
              {min}m
            </button>
          ))}
        </div>
        
        {/* 控制按鈕 */}
        <div className="flex space-x-1 mt-1">
          <button
            onClick={() => onStartWarmup(court.id)}
            disabled={court.isWarmupActive || court.warmupTime === 0}
            className="p-1 bg-green-500 text-white rounded disabled:opacity-50"
            title="開始"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            onClick={() => onPauseWarmup(court.id)}
            disabled={!court.isWarmupActive}
            className="p-1 bg-orange-500 text-white rounded disabled:opacity-50"
            title="暫停"
          >
            <Pause className="w-3 h-3" />
          </button>
          <button
            onClick={() => onResetWarmup(court.id)}
            className="p-1 bg-gray-500 text-white rounded"
            title="重置"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 比賽計時器 */}
      <div className="bg-blue-50 rounded p-2">
        <div className="flex items-center justify-between">
          <span className="text-blue-700">比賽</span>
          <span className="font-mono font-bold">
            {formatTime(court.gameTime)}
          </span>
        </div>
        <button
          onClick={() => onStartGame(court.id)}
          disabled={!canStartGame}
          className={`w-full mt-1 px-2 py-1 rounded text-xs transition-colors ${
            canStartGame 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {totalPlayers !== 4 ? `需要${4-totalPlayers}人` : '開始比賽'}
        </button>
      </div>
    </div>
  );
};

export default CourtTimer;