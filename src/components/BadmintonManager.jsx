import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Users, Download, Upload, Settings, TrendingUp, UserPlus, Trophy, Clock, AlertTriangle, RefreshCw, Coffee, ChevronLeft, ChevronRight, X, Search, Play, Moon, Sun } from 'lucide-react';

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
import { findDuplicatePlayers, validateGameState } from '../utils/gameUtils';


const BadmintonManager = () => {
  // 修正3：夜覽模式狀態管理
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 從 localStorage 讀取設定，預設為 false
    const saved = localStorage.getItem('badminton-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // 修正3：切換夜覽模式
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('badminton-dark-mode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // 修正3：應用夜覽模式到 body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 主要狀態
  const [courts, setCourts] = useState(defaultCourts);
  const [players, setPlayers] = useState(defaultPlayers);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [restArea, setRestArea] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [autoQueue, setAutoQueue] = useState(true);
  const [activeSelector, setActiveSelector] = useState(null);
  const [restSearchTerm, setRestSearchTerm] = useState('');

  
  // 頁籤狀態
  const [activeTab, setActiveTab] = useState('courts');

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

  // 檢測重複玩家
  const duplicateWarning = useMemo(() => {
    const gameState = { waitingQueue, restArea, courts };
    const validation = validateGameState(gameState);
    
    if (!validation.isValid) {
      return {
        count: validation.duplicates.length,
        errors: validation.errors,
        duplicates: validation.duplicates
      };
    }
    return null;
  }, [
    waitingQueue.join(','), 
    restArea.join(','), 
    courts.map(c => `${c.id}:${c.teamA.join('-')}|${c.teamB.join('-')}`).join('|')
  ]);

  // 修正重複玩家
  const handleFixDuplicates = useCallback(() => {
    if (!duplicateWarning) return;
    
    if (window.confirm(`發現 ${duplicateWarning.count} 個重複玩家，確定要自動修正嗎？這將清理重複位置並將玩家移到排隊區。`)) {
      duplicateWarning.duplicates.forEach(dup => {
        playerManager.cleanupPlayerDuplicates(dup.playerId);
        setTimeout(() => {
          setWaitingQueue(prev => {
            if (!prev.includes(dup.playerId)) {
              return [...prev, dup.playerId];
            }
            return prev;
          });
        }, 100);
      });
    }
  }, [duplicateWarning, playerManager]);

  // 數據導入/導出處理
  const handleExportData = () => {
    exportData(players, gameHistory, courts, restArea);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const data = await importData(file);
        
        if (data.players) {
          setPlayers(data.players);
        }
        
        if (data.gameHistory) {
          setGameHistory(data.gameHistory);
        }
        
        if (data.courts) {
          setCourts(data.courts);
        }
        
        if (data.players) {
          const assignedPlayerIds = new Set();
          
          if (data.courts) {
            data.courts.forEach(court => {
              court.teamA.forEach(id => assignedPlayerIds.add(id));
              court.teamB.forEach(id => assignedPlayerIds.add(id));
            });
          }
          
          const savedRestArea = data.restArea || [];
          setRestArea(savedRestArea);
          savedRestArea.forEach(id => assignedPlayerIds.add(id));
          
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

  // 處理玩家互換
  const handlePlayerSwap = useCallback((playerId1, playerId2) => {
    const success = playerManager.swapPlayers(playerId1, playerId2);
    if (!success) {
      alert('互換失敗，請檢查玩家位置或重試');
    }
  }, [playerManager]);

  // 處理玩家移動
  const handlePlayerMove = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    console.log('移動玩家請求:', { playerId, targetLocation, targetPlayerId });
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
    const emptyCourts = courts.filter(court => {
      const totalPlayers = court.teamA.length + court.teamB.length;
      return totalPlayers === 0 && !court.isGameActive;
    });

    if (emptyCourts.length === 0) {
      alert('沒有空場地需要填滿');
      return;
    }

    const requiredPlayers = emptyCourts.length * 4;
    if (waitingQueue.length < requiredPlayers) {
      alert(`排隊區人數不足。需要 ${requiredPlayers} 人，但只有 ${waitingQueue.length} 人。`);
      return;
    }
    
    if (window.confirm(`將為 ${emptyCourts.length} 個空場地分配玩家，確定要繼續嗎？`)) {
      gameLogic.autoFillAllCourts();
    }
  };

  // 場地水平滾動控制
  const scrollCourtsContainer = (direction) => {
    const container = document.getElementById('courts-scroll-container');
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 切換玩家休息狀態
  const togglePlayerRestStatus = (playerId) => {
    const isInRest = restArea.includes(playerId);
    
    if (isInRest) {
      handlePlayerMove(playerId, { type: 'waiting' });
    } else {
      handlePlayerMove(playerId, { type: 'rest' });
    }
  };

  // 獲取玩家當前狀態
  const getPlayerCurrentStatus = (playerId) => {
    if (waitingQueue.includes(playerId)) {
      return { status: 'waiting', text: '排隊中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: '🔵' };
    }
    if (restArea.includes(playerId)) {
      return { status: 'rest', text: '休息中', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: '🟠' };
    }
    
    const court = courts.find(c => c.teamA.includes(playerId) || c.teamB.includes(playerId));
    if (court) {
      const team = court.teamA.includes(playerId) ? 'A隊' : 'B隊';
      return { 
        status: 'playing', 
        text: `${court.name} ${team}`, 
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', 
        icon: '🟢' 
      };
    }
    
    return { status: 'available', text: '可用', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: '⚪' };
  };

  // 頁籤組件
  const TabButton = ({ id, label, icon: Icon, isActive, onClick, badge = null }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
        isActive
          ? isDarkMode
            ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400 shadow-md'
            : 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-md'
          : isDarkMode
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
      {badge !== null && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          isActive 
            ? isDarkMode
              ? 'bg-blue-900 text-blue-300'
              : 'bg-blue-100 text-blue-600'
            : isDarkMode
              ? 'bg-gray-600 text-gray-300'
              : 'bg-gray-200 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* 重複玩家警告 */}
        {duplicateWarning && (
          <div className={`rounded-xl p-4 mb-6 border ${
            isDarkMode
              ? 'bg-red-900 border-red-700'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertTriangle className={`w-6 h-6 mr-3 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-red-400' : 'text-red-500'
                }`} />
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-red-300' : 'text-red-800'
                  }`}>
                    檢測到重複玩家
                  </h3>
                  <p className={`text-sm mb-2 ${
                    isDarkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    發現 {duplicateWarning.count} 個玩家出現在多個位置，這可能導致功能異常。
                  </p>
                  <ul className={`text-sm space-y-1 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`}>
                    {duplicateWarning.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={handleFixDuplicates}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                自動修正
              </button>
            </div>
          </div>
        )}

        {/* 標題列 */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <h1 className={`text-3xl font-bold flex items-center ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              羽球場地管理系統
            </h1>
            <div className="flex flex-wrap gap-3">
              {/* 修正3：夜覽模式切換按鈕 */}
              <button
                onClick={toggleDarkMode}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors shadow-md ${
                  isDarkMode
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title={isDarkMode ? '切換到日間模式' : '切換到夜間模式'}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    日間模式
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    夜間模式
                  </>
                )}
              </button>

              <FullscreenButton />
              
              <button
                onClick={gameLogic.addCourt}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增場地
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
        <div className={`rounded-xl shadow-lg p-4 mb-6 border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className={`w-5 h-5 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                自動排隊模式
              </span>
              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                (考慮等級與勝率平衡分隊)
              </span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(e) => setAutoQueue(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors shadow-inner ${
                autoQueue ? 'bg-blue-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${
                  autoQueue ? 'translate-x-6' : 'translate-x-0.5'
                }`}></div>
              </div>
              <span className={`ml-3 text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {autoQueue ? '自動' : '手動'}
              </span>
            </label>
          </div>
        </div>

        {/* 統計信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg shadow p-4 border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>總玩家數</div>
          </div>
          <div className={`rounded-lg shadow p-4 border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-green-600">{waitingQueue.length}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>排隊中</div>
          </div>
          <div className={`rounded-lg shadow p-4 border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-orange-600">{restArea.length}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>休息中</div>
          </div>
          <div className={`rounded-lg shadow p-4 border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-purple-600">
              {courts.reduce((total, court) => total + court.teamA.length + court.teamB.length, 0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>比賽中</div>
          </div>
        </div>

        {/* 主要內容區域 - 4個頁籤 */}
        <div className={`rounded-xl shadow-lg border overflow-hidden ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}>
          {/* 頁籤導航 */}
          <div className={`border-b ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex space-x-2 px-6 py-2 overflow-x-auto">
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
              <TabButton
                id="players"
                label="玩家管理"
                icon={UserPlus}
                isActive={activeTab === 'players'}
                onClick={setActiveTab}
                badge={players.length}
              />
              <TabButton
                id="rest"
                label="休息管理"
                icon={Coffee}
                isActive={activeTab === 'rest'}
                onClick={setActiveTab}
                badge={restArea.length}
              />
            </div>
          </div>

          {/* 頁籤內容 */}
          <div className="p-6">
            {/* 比賽場地頁籤 */}
            {activeTab === 'courts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <TrendingUp className="w-6 h-6 mr-3 text-green-600" />
                    比賽場地管理 ({courts.length})
                  </h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAutoFillAllCourts}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      disabled={waitingQueue.length < 4}
                    >
                      填滿空場地
                    </button>
                    <button
                      onClick={handleResetPositions}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      重置位置
                    </button>
                  </div>
                </div>
                
                {/* 場地水平滾動容器 */}
                {courts.length > 0 && (
                  <div className="relative">
                    {/* 滾動控制按鈕 */}
                    {courts.length > 2 && (
                      <>
                        <button
                          onClick={() => scrollCourtsContainer('left')}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg rounded-full p-2 transition-colors border ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ marginLeft: '-12px' }}
                        >
                          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => scrollCourtsContainer('right')}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg rounded-full p-2 transition-colors border ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ marginRight: '-12px' }}
                        >
                          <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                      </>
                    )}

                    {/* 場地滾動區域 */}
                    <div 
                      id="courts-scroll-container"
                      className="flex gap-6 overflow-x-auto scrollbar-thin pb-4"
                      style={{ 
                        WebkitOverflowScrolling: 'touch',
                        scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#CBD5E1 #F1F5F9'
                      }}
                    >
                      {courts.map((court) => (
                        <div key={court.id} className="flex-shrink-0 w-80">
                          <CourtView
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
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      ))}
                    </div>

                    {/* 滾動提示 */}
                    {courts.length > 2 && (
                      <div className="text-center mt-4">
                        <div className={`text-xs flex items-center justify-center space-x-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <ChevronLeft className="w-3 h-3" />
                          <span>左右滑動查看更多場地</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 空狀態 */}
                {courts.length === 0 && (
                  <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <TrendingUp className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <div className="text-xl mb-3">尚未建立場地</div>
                    <div className={`text-sm mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      點擊上方「新增場地」按鈕來建立第一個羽球場地
                    </div>
                    <button
                      onClick={gameLogic.addCourt}
                      className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      建立第一個場地
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 排隊管理頁籤 */}
            {activeTab === 'queue' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <Users className="w-6 h-6 mr-3 text-blue-600" />
                    排隊管理系統
                  </h2>
                  <div className={`flex items-center space-x-4 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      {waitingQueue.length} 人排隊
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      {Math.ceil(waitingQueue.length / 4)} 組隊伍
                    </div>
                  </div>
                </div>
                
                <div className={`rounded-lg p-4 min-h-96 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
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
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            )}

            {/* 玩家管理頁籤 */}
            {activeTab === 'players' && (
              <div>
                <PlayerModal
                  showModal={true}
                  onClose={() => {}} // 作為頁籤時不需要關閉功能
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
                  isTab={true} // 新增 prop 表示這是頁籤模式
                />
              </div>
            )}

            {/* 休息管理頁籤 */}
            {activeTab === 'rest' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <Coffee className="w-6 h-6 mr-3 text-orange-600" />
                    休息區管理 ({restArea.length})
                  </h2>
                  <div className="flex space-x-3">
                    {restArea.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要將所有 ${restArea.length} 位休息中的玩家移到排隊區嗎？`)) {
                            restArea.forEach(playerId => {
                              handlePlayerMove(playerId, { type: 'waiting' });
                            });
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        全部加入排隊
                      </button>
                    )}
                  </div>
                </div>

                {/* 搜尋和過濾區域 */}
                <div className={`rounded-lg p-4 border mb-6 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          placeholder="搜尋休息中的玩家..."
                          value={restSearchTerm}
                          onChange={(e) => setRestSearchTerm(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-orange-200'
                          }`}
                          autoComplete="off"
                          spellCheck="false"
                        />
                        {restSearchTerm && (
                          <button
                            onClick={() => setRestSearchTerm('')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {restSearchTerm ? (
                        <>顯示 {restArea.filter(playerId => {
                          const player = players.find(p => p.id === playerId);
                          return player && player.name.toLowerCase().includes(restSearchTerm.toLowerCase().trim());
                        }).length} / {restArea.length} 位休息玩家</>
                      ) : (
                        <>總共 {restArea.length} 位休息玩家</>
                      )}
                    </div>
                  </div>
                </div>

                {/* 休息中的玩家列表 */}
                {(() => {
                  const filteredRestPlayers = restArea.filter(playerId => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return false;
                    
                    if (restSearchTerm.trim()) {
                      return player.name.toLowerCase().includes(restSearchTerm.toLowerCase().trim());
                    }
                    
                    return true;
                  });

                  return filteredRestPlayers.length > 0 ? (
                    <div className="relative">
                      {/* 滾動控制按鈕 */}
                      {filteredRestPlayers.length > 3 && (
                        <>
                          <button
                            onClick={() => {
                              const container = document.getElementById('rest-players-scroll-container');
                              if (container) {
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                              }
                            }}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg rounded-full p-2 transition-colors border ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            style={{ marginLeft: '-12px' }}
                          >
                            <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                          <button
                            onClick={() => {
                              const container = document.getElementById('rest-players-scroll-container');
                              if (container) {
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                              }
                            }}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg rounded-full p-2 transition-colors border ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            style={{ marginRight: '-12px' }}
                          >
                            <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          </button>
                        </>
                      )}

                      {/* 休息玩家水平滾動區域 */}
                      <div 
                        id="rest-players-scroll-container"
                        className="flex gap-4 overflow-x-auto scrollbar-thin pb-4"
                        style={{ 
                          WebkitOverflowScrolling: 'touch',
                          scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#CBD5E1 #F1F5F9'
                        }}
                      >
                        {filteredRestPlayers.map(playerId => {
                          const player = players.find(p => p.id === playerId);
                          if (!player) return null;

                          return (
                            <div key={player.id} className={`flex-shrink-0 w-72 border rounded-lg p-4 ${
                              isDarkMode
                                ? 'bg-orange-900 border-orange-700'
                                : 'bg-orange-50 border-orange-200'
                            }`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {player.name}
                                  </h3>
                                  <div className={`text-sm mt-1 ${
                                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                                  }`}>
                                    Lv.{player.skillLevel} • 勝率: {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isDarkMode
                                    ? 'bg-orange-800 text-orange-300'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  休息中
                                </span>
                              </div>
                              
                              <div className={`text-sm mb-3 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                總場次: {player.totalGames} • {player.wins}勝 {player.losses}敗
                              </div>
                              
                              <button
                                onClick={() => togglePlayerRestStatus(player.id)}
                                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                加入排隊
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* 滾動提示 */}
                      {filteredRestPlayers.length > 3 && (
                        <div className="text-center mt-2">
                          <div className={`text-xs flex items-center justify-center space-x-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <ChevronLeft className="w-3 h-3" />
                            <span>左右滑動查看更多休息玩家</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Coffee className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <div className="text-xl mb-3">
                        {restSearchTerm ? `沒有找到包含 "${restSearchTerm}" 的休息玩家` : '沒有玩家在休息'}
                      </div>
                      <div className={`text-sm mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {restSearchTerm ? (
                          <>
                            <div>請嘗試其他搜尋詞或清除搜尋條件</div>
                            <button
                              onClick={() => setRestSearchTerm('')}
                              className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              清除搜尋
                            </button>
                          </>
                        ) : (
                          '在「玩家管理」頁籤中可以設定玩家的休息狀態'
                        )}
                      </div>
                      {!restSearchTerm && (
                        <button
                          onClick={() => setActiveTab('players')}
                          className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          前往玩家管理
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* 休息統計信息 */}
                {restArea.length > 0 && (
                  <div className={`mt-8 rounded-lg p-4 border ${
                    isDarkMode
                      ? 'bg-orange-900 border-orange-700'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-orange-600">{restArea.length}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>休息總人數</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {restSearchTerm ? 
                            restArea.filter(playerId => {
                              const player = players.find(p => p.id === playerId);
                              return player && player.name.toLowerCase().includes(restSearchTerm.toLowerCase().trim());
                            }).length :
                            restArea.length
                          }
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {restSearchTerm ? '搜尋結果' : '可加入排隊'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{waitingQueue.length}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>當前排隊</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">
                          {courts.reduce((total, court) => total + court.teamA.length + court.teamB.length, 0)}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>比賽中</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 休息管理說明 */}
                <div className={`mt-8 rounded-lg p-4 border ${
                  isDarkMode
                    ? 'bg-orange-900 border-orange-700'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-700'
                  }`}>
                    ☕ 休息管理說明
                  </h4>
                  <div className={`text-xs space-y-1 ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    <div>• <strong>搜尋功能</strong>：快速找到特定的休息玩家</div>
                    <div>• <strong>設定休息</strong>：在玩家管理頁籤中為玩家設定休息狀態</div>
                    <div>• <strong>快速加入</strong>：點擊「加入排隊」讓休息玩家重新參與</div>
                    <div>• <strong>批量操作</strong>：使用「全部加入排隊」一次移動所有休息玩家</div>
                    <div>• <strong>狀態追蹤</strong>：清楚顯示每位玩家的統計資料和狀態</div>
                    <div>• <strong>水平滾動</strong>：當休息玩家較多時，可左右滑動查看</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSS 樣式 */}
        <style jsx>{`
          #courts-scroll-container::-webkit-scrollbar,
          #rest-players-scroll-container::-webkit-scrollbar {
            height: 6px;
          }
          
          #courts-scroll-container::-webkit-scrollbar-track,
          #rest-players-scroll-container::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#1F2937' : '#F1F5F9'};
            border-radius: 3px;
          }
          
          #courts-scroll-container::-webkit-scrollbar-thumb,
          #rest-players-scroll-container::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? '#4B5563' : '#CBD5E1'};
            border-radius: 3px;
          }
          
          #courts-scroll-container::-webkit-scrollbar-thumb:hover,
          #rest-players-scroll-container::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? '#6B7280' : '#94A3B8'};
          }
        `}</style>
      </div>
    </div>
  );
};

export default BadmintonManager;