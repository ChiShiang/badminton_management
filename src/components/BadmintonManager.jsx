import React, { useState, useCallback } from 'react';
import { Plus, Users, Download, Upload, Settings, TrendingUp, UserPlus, Trophy, Clock } from 'lucide-react';

// 導入組件
import CourtView from './Court/CourtView';
import QueueGroups from './Queue/QueueGroups';
import PlayerModal from './Player/PlayerModal';
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
  
  // 新增：頁籤狀態
  const [activeTab, setActiveTab] = useState('courts'); // 'courts' 或 'queue'

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
    exportData(players, gameHistory, courts, restArea);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const data = await importData(file);
        
        // 先載入玩家資料
        if (data.players) {
          setPlayers(data.players);
        }
        
        // 載入比賽歷史
        if (data.gameHistory) {
          setGameHistory(data.gameHistory);
        }
        
        // 載入場地資料
        if (data.courts) {
          setCourts(data.courts);
        }
        
        // 重要：根據場地資料重新分配玩家位置
        if (data.players) {
          // 收集所有已分配的玩家ID
          const assignedPlayerIds = new Set();
          
          // 從場地收集玩家
          if (data.courts) {
            data.courts.forEach(court => {
              court.teamA.forEach(id => assignedPlayerIds.add(id));
              court.teamB.forEach(id => assignedPlayerIds.add(id));
            });
          }
          
          // 休息區的玩家（如果有保存的話）
          const savedRestArea = data.restArea || [];
          setRestArea(savedRestArea);
          savedRestArea.forEach(id => assignedPlayerIds.add(id));
          
          // 剩餘的玩家都放到排隊區
          const unassignedPlayers = data.players
            .filter(player => !assignedPlayerIds.has(player.id))
            .map(player => player.id);
          
          setWaitingQueue(unassignedPlayers);
        }
        
        alert('資料導入成功！');
      } catch (error) {
        alert(error.message);
      }
    }
    // 重置檔案輸入，允許重複選擇相同檔案
    event.target.value = '';
  };

  // 快速操作
  const handleResetPositions = () => {
    if (window.confirm('確定要重置所有玩家位置嗎？這將把所有玩家移到排隊區。')) {
      gameLogic.resetAllPositions();
      setRestArea([]);
      setActiveSelector(null);
    }
  };

  // 處理玩家互換（包括跨區域互換）
  const handlePlayerSwap = useCallback((playerId1, playerId2) => {
    const success = playerManager.swapPlayers(playerId1, playerId2);
    if (!success) {
      alert('互換失敗，請檢查玩家位置或重試');
    }
  }, [playerManager]);

  // 增強的移動處理器，支援替換邏輯
  const handlePlayerMove = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    const success = playerManager.movePlayer(playerId, targetLocation, targetPlayerId);
    if (!success && !targetPlayerId) {
      console.log('Move failed, may need replacement selection');
    }
    return success;
  }, [playerManager]);

  // 快速填滿場地
  const handleQuickFillCourt = useCallback((courtId) => {
    gameLogic.quickFillCourt(courtId);
  }, [gameLogic]);

  // 自動填滿所有空場地
  const handleAutoFillAllCourts = () => {
    if (waitingQueue.length < 4) {
      alert('排隊區人數不足，至少需要4人才能開始自動分配');
      return;
    }
    
    if (window.confirm('確定要自動分配玩家到所有空場地嗎？')) {
      gameLogic.autoFillAllCourts();
    }
  };

  // 頁籤組件
  const TabButton = ({ id, label, icon: Icon, isActive, onClick, badge = null }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
        isActive
          ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
      {badge !== null && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

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
                disabled={players.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                導出資料
              </button>
              
              <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer shadow-md">
                <Upload className="w-4 h-4 mr-2" />
                導入資料
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData} 
                  className="hidden" 
                />
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

        {/* 統計信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-sm text-gray-600">總玩家數</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{waitingQueue.length}</div>
            <div className="text-sm text-gray-600">排隊中</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{restArea.length}</div>
            <div className="text-sm text-gray-600">休息中</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {courts.reduce((total, court) => total + court.teamA.length + court.teamB.length, 0)}
            </div>
            <div className="text-sm text-gray-600">比賽中</div>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* 頁籤導航 */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex space-x-2 px-6 py-2">
              <TabButton
                id="courts"
                label="比賽場地"
                icon={Trophy}
                isActive={activeTab === 'courts'}
                onClick={setActiveTab}
                badge={courts.length}
              />
              <TabButton
                id="queue"
                label="排隊管理"
                icon={Clock}
                isActive={activeTab === 'queue'}
                onClick={setActiveTab}
                badge={Math.ceil(waitingQueue.length / 4)}
              />
            </div>
          </div>

          {/* 頁籤內容 */}
          <div className="p-6">
            {activeTab === 'courts' && (
              <div>
                {/* 場地控制區 */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                    <TrendingUp className="w-6 h-6 mr-3 text-green-600" />
                    比賽場地管理 ({courts.length})
                  </h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAutoFillAllCourts}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      disabled={waitingQueue.length < 4}
                    >
                      自動填滿空場地
                    </button>
                    <button
                      onClick={handleResetPositions}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      重置所有位置
                    </button>
                  </div>
                </div>
                
                {/* 場地網格 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      onQuickFillCourt={handleQuickFillCourt}
                      activeSelector={activeSelector}
                      setActiveSelector={setActiveSelector}
                      availablePlayers={playerManager.availablePlayers}
                      players={players}
                      onPlayerMove={handlePlayerMove}
                      onPlayerSwap={handlePlayerSwap}
                      waitingQueue={waitingQueue}
                      restArea={restArea}
                      courts={courts}
                    />
                  ))}
                </div>
                
                {/* 空狀態 */}
                {courts.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <TrendingUp className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <div className="text-xl mb-3">尚未建立場地</div>
                    <div className="text-sm mb-6 text-gray-400">點擊上方「新增場地」按鈕來建立第一個羽球場地</div>
                    <button
                      onClick={gameLogic.addCourt}
                      className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      建立第一個場地
                    </button>
                  </div>
                )}

                {/* 場地操作說明 */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">💡 場地操作說明</h4>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div>• <strong>拖拽移動</strong>：拖拽玩家卡片到不同區域</div>
                      <div>• <strong>直接互換</strong>：拖拽玩家到另一玩家上互換位置</div>
                      <div>• <strong>點擊替換</strong>：點擊玩家卡片顯示替換選項</div>
                      <div>• <strong>快速補位</strong>：使用「快速補位」按鈕自動分配玩家</div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-semibold text-green-700 mb-2">⚡ 快速操作</h4>
                    <div className="text-xs text-green-600 space-y-1">
                      <div>• <strong>自動填滿</strong>：一鍵填滿所有空場地</div>
                      <div>• <strong>重置位置</strong>：將所有玩家移回排隊區</div>
                      <div>• <strong>計時功能</strong>：支援熱身和比賽計時</div>
                      <div>• <strong>比賽記錄</strong>：自動記錄比賽結果和統計</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'queue' && (
              <div>
                {/* 排隊控制區 */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                    <Users className="w-6 h-6 mr-3 text-blue-600" />
                    排隊管理系統
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      {waitingQueue.length} 人排隊
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      {Math.ceil(waitingQueue.length / 4)} 組隊伍
                    </div>
                    {restArea.length > 0 && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        {restArea.length} 人休息
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 排隊區域 */}
                <div className="bg-gray-50 rounded-lg p-4 min-h-96">
                  <QueueGroups
                    waitingQueue={waitingQueue}
                    activeSelector={activeSelector}
                    setActiveSelector={setActiveSelector}
                    availablePlayers={playerManager.availablePlayers}
                    players={players}
                    onPlayerMove={handlePlayerMove}
                    onPlayerSwap={handlePlayerSwap}
                    restArea={restArea}
                    courts={courts}
                  />
                </div>

                {/* 排隊操作說明 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">🔄 排隊操作</h4>
                    <div className="text-xs text-purple-600 space-y-1">
                      <div>• <strong>自動分組</strong>：每4人自動組成一隊</div>
                      <div>• <strong>隊伍調整</strong>：在組內拖拽調整A、B隊分配</div>
                      <div>• <strong>跨組移動</strong>：可在不同組之間移動玩家</div>
                      <div>• <strong>智能分隊</strong>：根據等級和勝率平衡隊伍</div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="text-sm font-semibold text-orange-700 mb-2">☕ 休息管理</h4>
                    <div className="text-xs text-orange-600 space-y-1">
                      <div>• <strong>玩家管理頁面</strong>：在管理玩家中設定休息狀態</div>
                      <div>• <strong>一鍵加入</strong>：休息中的玩家可快速加入排隊</div>
                      <div>• <strong>狀態顯示</strong>：清楚顯示每位玩家的當前狀態</div>
                      <div>• <strong>靈活調整</strong>：隨時調整玩家的參與狀態</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 玩家管理模態框 - 傳遞 onPlayerMove */}
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
          onPlayerMove={handlePlayerMove}
        />
      </div>
    </div>
  );
};

export default BadmintonManager;