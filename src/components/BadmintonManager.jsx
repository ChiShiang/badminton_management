import React, { useState } from 'react';
import { Plus, Users, Download, Upload, Settings, TrendingUp, UserPlus, Pause } from 'lucide-react';

// 導入組件
import CourtView from './Court/CourtView';
import QueueGroups from './Queue/QueueGroups';
import PlayerModal from './Player/PlayerModal';
import PlayerSelector from './Player/PlayerSelector';
import FullscreenButton from './Common/FullscreenButton';

// 導入 Hooks
import { useTimer } from '../hooks/useTimer';
import { usePlayerManager } from '../hooks/usePlayerManager';
import { useGameLogic } from '../hooks/useGameLogic';

// 導入工具和數據
import { exportData, importData } from '../utils/dataUtils';
import { defaultPlayers, defaultCourts } from '../data/defaultData';

const BadmintonManager = () => {
  // 主要狀態
  const [courts, setCourts] = useState(defaultCourts);
  const [players, setPlayers] = useState(defaultPlayers);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [restArea, setRestArea] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [autoQueue, setAutoQueue] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [activeSelector, setActiveSelector] = useState(null);

  // 使用自定義 Hooks
  const timerControls = useTimer(courts, setCourts);
  
  const playerManager = usePlayerManager(
    players, setPlayers, 
    waitingQueue, setWaitingQueue, 
    restArea, setRestArea, 
    courts, setCourts
  );
  
  const gameLogic = useGameLogic(
    courts, setCourts,
    players, setPlayers,
    waitingQueue, setWaitingQueue,
    gameHistory, setGameHistory,
    autoQueue
  );

  // 數據導入/導出處理
  const handleExportData = () => {
    exportData(players, gameHistory, courts);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const data = await importData(file);
        if (data.players) setPlayers(data.players);
        if (data.gameHistory) setGameHistory(data.gameHistory);
        if (data.courts) setCourts(data.courts);
        alert('資料導入成功！');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // 快速操作
  const handleResetPositions = () => {
    gameLogic.resetAllPositions();
    setRestArea([]);
    setActiveSelector(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題列 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              羽球場地管理系統
            </h1>
            <div className="flex flex-wrap gap-3">
              <FullscreenButton />
              
              <button
                onClick={gameLogic.addCourt}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增場地
              </button>
              
              <button
                onClick={() => setShowPlayerModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                管理玩家
              </button>
              
              <button
                onClick={handleExportData}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                <Download className="w-4 h-4 mr-2" />
                導出資料
              </button>
              
              <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer shadow-md">
                <Upload className="w-4 h-4 mr-2" />
                導入資料
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* 設定區域 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              <span className="font-semibold text-gray-700">自動排隊模式</span>
              <span className="ml-2 text-sm text-gray-500">(考慮等級與勝率平衡分隊)</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(e) => setAutoQueue(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors shadow-inner ${autoQueue ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${autoQueue ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </div>
              <span className="ml-3 text-sm text-gray-600 font-medium">
                {autoQueue ? '自動' : '手動'}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 場地區域 */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                  <TrendingUp className="w-6 h-6 mr-3 text-green-600" />
                  比賽場地 ({courts.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      courts.forEach(court => {
                        if (court.teamA.length === 0 && court.teamB.length === 0) {
                          gameLogic.quickFillCourt(court.id);
                        }
                      });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    disabled={waitingQueue.length < 4}
                  >
                    自動填滿空場地
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courts.map((court) => (
                  <CourtView
                    key={court.id}
                    court={court}
                    onRemoveCourt={gameLogic.removeCourt}
                    onSetWarmupTime={timerControls.setWarmupTime}
                    onStartWarmup={timerControls.startWarmup}
                    onPauseWarmup={timerControls.pauseWarmup}
                    onResetWarmup={timerControls.resetWarmup}
                    onStartGame={gameLogic.startGame}
                    onEndGame={gameLogic.endGame}
                    activeSelector={activeSelector}
                    setActiveSelector={setActiveSelector}
                    availablePlayers={playerManager.availablePlayers}
                    players={players}
                    onPlayerMove={playerManager.movePlayer}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 右側區域 */}
          <div className="xl:col-span-1 space-y-6">
            {/* 排隊區域 */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-600 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  排隊區域
                </h3>
                <div className="text-sm text-gray-500">
                  {waitingQueue.length}人 / {Math.ceil(waitingQueue.length / 4)}組
                </div>
              </div>
              
              <div className="min-h-32 max-h-96 overflow-y-auto">
                <QueueGroups
                  waitingQueue={waitingQueue}
                  activeSelector={activeSelector}
                  setActiveSelector={setActiveSelector}
                  availablePlayers={playerManager.availablePlayers}
                  players={players}
                  onPlayerMove={playerManager.movePlayer}
                />
              </div>
            </div>

            {/* 休息區 */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
                <Pause className="w-5 h-5 mr-2" />
                休息區域
              </h3>
              <div className="min-h-24 max-h-32 overflow-y-auto p-3 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                {restArea.length === 0 ? (
                  <div className="text-center text-gray-500 py-4 flex flex-col items-center">
                    <Pause className="w-6 h-6 mb-2 text-gray-400" />
                    <div className="text-sm">暫時休息的玩家</div>
                    <button
                      onClick={() => {
                        if (playerManager.availablePlayers.length > 0) {
                          setRestArea([...restArea, playerManager.availablePlayers[0].id]);
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                      disabled={playerManager.availablePlayers.length === 0}
                    >
                      添加休息玩家
                    </button>
                  </div>
                ) : (
                  <PlayerSelector
                    targetLocation={{ type: 'rest' }}
                    currentPlayers={restArea}
                    maxPlayers={Infinity}
                    selectorId="rest-area"
                    activeSelector={activeSelector}
                    setActiveSelector={setActiveSelector}
                    availablePlayers={playerManager.availablePlayers}
                    players={players}
                    onPlayerMove={playerManager.movePlayer}
                  />
                )}
              </div>
              <div className="text-sm text-gray-600 mt-2 font-medium">
                休息人數: {restArea.length}
              </div>
            </div>

            {/* 快速操作區 */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">快速操作</h3>
              <div className="space-y-3">
                <button
                  onClick={handleResetPositions}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  重置所有人員位置
                </button>
                <button
                  onClick={gameLogic.autoFillAllCourts}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  disabled={waitingQueue.length < 4}
                >
                  自動分配到所有場地
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 玩家管理模態框 */}
        <PlayerModal
          showModal={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
          players={players}
          waitingQueue={waitingQueue}
          restArea={restArea}
          courts={courts}
          newPlayerName={playerManager.newPlayerName}
          setNewPlayerName={playerManager.setNewPlayerName}
          newPlayerSkillLevel={playerManager.newPlayerSkillLevel}
          setNewPlayerSkillLevel={playerManager.setNewPlayerSkillLevel}
          onAddPlayer={playerManager.addPlayer}
          batchPlayerCount={playerManager.batchPlayerCount}
          setBatchPlayerCount={playerManager.setBatchPlayerCount}
          onAddBatchPlayers={playerManager.addBatchPlayers}
          editingPlayer={playerManager.editingPlayer}
          editPlayerName={playerManager.editPlayerName}
          setEditPlayerName={playerManager.setEditPlayerName}
          editPlayerSkillLevel={playerManager.editPlayerSkillLevel}
          setEditPlayerSkillLevel={playerManager.setEditPlayerSkillLevel}
          onStartEditPlayer={playerManager.startEditPlayer}
          onSavePlayerInfo={playerManager.savePlayerInfo}
          onCancelEditPlayer={playerManager.cancelEditPlayer}
          onDeletePlayer={playerManager.deletePlayer}
        />
      </div>
    </div>
  );
};

export default BadmintonManager;