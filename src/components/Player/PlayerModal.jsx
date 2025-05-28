import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Users, UserPlus, Edit3, Save, X, Trash2, Trophy, Coffee, Play, Search, ChevronLeft, ChevronRight, ArrowRight, Filter, RefreshCw, MoreHorizontal } from 'lucide-react';
import { SKILL_LEVELS } from '../../utils/constants';

const PlayerModal = ({ 
  showModal,
  onClose,
  // 玩家數據
  players,
  waitingQueue,
  restArea,
  courts,
  // 新增玩家
  newPlayerName,
  setNewPlayerName,
  newPlayerSkillLevel,
  setNewPlayerSkillLevel,
  onAddPlayer,
  // 批次新增
  batchPlayerCount,
  setBatchPlayerCount,
  onAddBatchPlayers,
  // 編輯玩家
  editingPlayer,
  editPlayerName,
  setEditPlayerName,
  editPlayerSkillLevel,
  setEditPlayerSkillLevel,
  onStartEditPlayer,
  onSavePlayerInfo,
  onCancelEditPlayer,
  onDeletePlayer,
  // 玩家狀態管理
  onPlayerMove,
  // 頁籤模式支援
  isTab = false
}) => {
  // 搜尋和過濾狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  
  // 玩家替換模態框狀態
  const [showPlayerReplaceModal, setShowPlayerReplaceModal] = useState(false);
  const [selectedPlayerForReplacement, setSelectedPlayerForReplacement] = useState(null);
  const [replaceModalSearchTerm, setReplaceModalSearchTerm] = useState('');
  const [replaceModalStatusFilter, setReplaceModalStatusFilter] = useState('all');
  
  // 滾動位置記憶
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const lastActionRef = useRef(null);

  // 獲取玩家當前狀態
  const getPlayerCurrentStatus = useMemo(() => {
    const courtPlayerMap = new Map();
    courts.forEach(court => {
      if (court.teamA) {
        court.teamA.forEach(playerId => {
          courtPlayerMap.set(playerId, { courtName: court.name, team: 'A隊' });
        });
      }
      if (court.teamB) {
        court.teamB.forEach(playerId => {
          courtPlayerMap.set(playerId, { courtName: court.name, team: 'B隊' });
        });
      }
    });

    return (playerId) => {
      if (waitingQueue.includes(playerId)) {
        return { status: 'waiting', text: '排隊中', color: 'bg-blue-100 text-blue-700', icon: '🔵', priority: 2 };
      }
      if (restArea.includes(playerId)) {
        return { status: 'rest', text: '休息中', color: 'bg-orange-100 text-orange-700', icon: '🟠', priority: 3 };
      }
      
      const courtInfo = courtPlayerMap.get(playerId);
      if (courtInfo) {
        return { 
          status: 'playing', 
          text: `${courtInfo.courtName} ${courtInfo.team}`, 
          color: 'bg-green-100 text-green-700', 
          icon: '🟢',
          priority: 4
        };
      }
      
      return { status: 'available', text: '可用', color: 'bg-gray-100 text-gray-700', icon: '⚪', priority: 1 };
    };
  }, [
    waitingQueue.join(','), 
    restArea.join(','), 
    courts.map(c => `${c.id}:${c.name}:${c.teamA.join('-')}|${c.teamB.join('-')}`).join('|')
  ]);

  // 過濾和搜尋玩家
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(player => {
        const status = getPlayerCurrentStatus(player.id);
        return status.status === selectedStatusFilter;
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [players, searchTerm, selectedStatusFilter, getPlayerCurrentStatus]);

  // 替換模態框的玩家過濾
  const replaceModalFilteredPlayers = useMemo(() => {
    let filtered = players.filter(p => p.id !== selectedPlayerForReplacement?.id);

    if (replaceModalStatusFilter !== 'all') {
      filtered = filtered.filter(player => {
        const status = getPlayerCurrentStatus(player.id);
        return status.status === replaceModalStatusFilter;
      });
    }

    if (replaceModalSearchTerm.trim()) {
      const searchLower = replaceModalSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchLower)
      );
    }

    // 添加狀態信息並排序
    const playersWithStatus = filtered.map(player => ({
      ...player,
      status: getPlayerCurrentStatus(player.id)
    }));

    // 排序：優先級 -> 勝率 -> 姓名
    playersWithStatus.sort((a, b) => {
      if (a.status.priority !== b.status.priority) {
        return a.status.priority - b.status.priority;
      }
      
      const aWinRate = a.totalGames > 0 ? a.wins / a.totalGames : 0;
      const bWinRate = b.totalGames > 0 ? b.wins / b.totalGames : 0;
      if (Math.abs(aWinRate - bWinRate) > 0.01) {
        return bWinRate - aWinRate;
      }
      
      return a.name.localeCompare(b.name);
    });

    return playersWithStatus;
  }, [players, replaceModalSearchTerm, replaceModalStatusFilter, getPlayerCurrentStatus, selectedPlayerForReplacement]);

  // 保存滾動位置
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollLeft;
      lastActionRef.current = Date.now();
    }
  }, []);

  // 恢復滾動位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollPositionRef.current;
        }
      });
    }
  }, []);

  // 監聽狀態變化並恢復滾動位置
  useEffect(() => {
    const timeSinceLastAction = Date.now() - (lastActionRef.current || 0);
    if (timeSinceLastAction < 1000) {
      restoreScrollPosition();
    }
  }, [waitingQueue.length, restArea.length, players.length, restoreScrollPosition]);

  // 狀態變更處理
  const handleStatusChange = useCallback((playerId, newStatus) => {
    saveScrollPosition();
    
    switch (newStatus) {
      case 'waiting':
        onPlayerMove(playerId, { type: 'waiting' });
        break;
      case 'rest':
        onPlayerMove(playerId, { type: 'rest' });
        break;
      default:
        break;
    }
  }, [saveScrollPosition, onPlayerMove]);

  // 打開玩家替換模態框
  const openPlayerReplaceModal = useCallback((player) => {
    saveScrollPosition();
    setSelectedPlayerForReplacement(player);
    setReplaceModalSearchTerm('');
    setReplaceModalStatusFilter('all');
    setShowPlayerReplaceModal(true);
  }, [saveScrollPosition]);

  // 關閉玩家替換模態框
  const closePlayerReplaceModal = useCallback(() => {
    setShowPlayerReplaceModal(false);
    setSelectedPlayerForReplacement(null);
    setReplaceModalSearchTerm('');
    setReplaceModalStatusFilter('all');
  }, []);

  // 執行玩家替換
  const executePlayerReplacement = useCallback((newPlayerId) => {
    if (selectedPlayerForReplacement && newPlayerId) {
      onPlayerMove(newPlayerId, { type: 'waiting' });
      closePlayerReplaceModal();
    }
  }, [selectedPlayerForReplacement, onPlayerMove, closePlayerReplaceModal]);

  // 玩家水平滾動控制
  const scrollPlayersContainer = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 快速操作：將所有休息中的玩家移到排隊區
  const moveAllRestToQueue = () => {
    if (restArea.length === 0) {
      alert('沒有休息中的玩家');
      return;
    }
    
    if (window.confirm(`確定要將所有 ${restArea.length} 位休息中的玩家移到排隊區嗎？`)) {
      saveScrollPosition();
      restArea.forEach(playerId => {
        onPlayerMove(playerId, { type: 'waiting' });
      });
    }
  };

  // 優化的玩家卡片組件
  const PlayerCard = ({ player }) => {
    const skillInfo = SKILL_LEVELS[player.skillLevel];
    const currentStatus = getPlayerCurrentStatus(player.id);
    const canChangeStatus = currentStatus.status !== 'playing';
    const isEditing = editingPlayer === player.id;
    const [showDropdown, setShowDropdown] = useState(false);
    
    return (
      <div className="flex-shrink-0 w-80 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* 卡片頭部 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  onKeyPress={(e) => e.key === 'Enter' && onSavePlayerInfo()}
                  autoFocus
                />
                <select
                  value={editPlayerSkillLevel}
                  onChange={(e) => setEditPlayerSkillLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(SKILL_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>
                      Lv.{level} - {info.name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      saveScrollPosition();
                      onSavePlayerInfo();
                    }}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      saveScrollPosition();
                      onCancelEditPlayer();
                    }}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 truncate mb-1">{player.name}</h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${skillInfo.color}`}>
                    <Trophy className="w-4 h-4 mr-1" />
                    Lv.{player.skillLevel} {skillInfo.name}
                  </div>
                </div>
                
                {/* 操作菜單 */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32 z-10">
                      <button
                        onClick={() => {
                          saveScrollPosition();
                          onStartEditPlayer(player);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        編輯
                      </button>
                      <button
                        onClick={() => {
                          openPlayerReplaceModal(player);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        替換
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          saveScrollPosition();
                          onDeletePlayer(player.id);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-red-50 text-sm flex items-center text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        刪除
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 卡片內容 */}
        {!isEditing && (
          <div className="p-4">
            {/* 統計信息 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{player.totalGames}</div>
                <div className="text-xs text-gray-500">總場次</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{player.wins}</div>
                <div className="text-xs text-gray-500">勝場</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">勝率</div>
              </div>
            </div>
            
            {/* 當前狀態 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">當前狀態</span>
                <span className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${currentStatus.color}`}>
                  <span className="mr-1">{currentStatus.icon}</span>
                  {currentStatus.text}
                </span>
              </div>
            </div>
            
            {/* 快速操作按鈕 */}
            <div className="space-y-2">
              {canChangeStatus ? (
                <div className="grid grid-cols-2 gap-2">
                  {/* 狀態切換按鈕 */}
                  {currentStatus.status === 'waiting' ? (
                    <button
                      onClick={() => handleStatusChange(player.id, 'rest')}
                      className="px-3 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
                    >
                      <Coffee className="w-4 h-4 mr-1" />
                      休息
                    </button>
                  ) : currentStatus.status === 'rest' ? (
                    <button
                      onClick={() => handleStatusChange(player.id, 'waiting')}
                      className="px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      排隊
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(player.id, 'waiting')}
                      className="px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      排隊
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full px-3 py-2 text-sm text-center text-gray-500 bg-gray-100 rounded-lg">
                  比賽中無法調整狀態
                </div>
              )}
            </div>
          </div>
        )}

        {/* 點擊外部關閉下拉菜單 */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  };

  // 玩家替換模態框組件（保持原有的完整功能）
  const PlayerReplaceModal = () => {
    if (!showPlayerReplaceModal || !selectedPlayerForReplacement) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">替換玩家</h3>
              <button
                onClick={closePlayerReplaceModal}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="text-purple-100 mt-2">
              為 <strong>{selectedPlayerForReplacement.name}</strong> 選擇替換的玩家
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜尋玩家姓名..."
                    value={replaceModalSearchTerm}
                    onChange={(e) => setReplaceModalSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={replaceModalStatusFilter}
                  onChange={(e) => setReplaceModalStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="all">全部狀態</option>
                  <option value="available">可用</option>
                  <option value="waiting">排隊中</option>
                  <option value="playing">比賽中</option>
                  <option value="rest">休息中</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {replaceModalFilteredPlayers.map(player => (
                <div
                  key={player.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all"
                  onClick={() => executePlayerReplacement(player.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{player.name}</div>
                      <div className="text-sm text-gray-600">
                        Lv.{player.skillLevel} • {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}% 勝率
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${player.status.color} ml-2`}>
                      {player.status.icon} {player.status.text}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.wins}勝 {player.losses}敗 • 總{player.totalGames}場
                  </div>
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    點擊選擇此玩家
                  </div>
                </div>
              ))}
            </div>

            {replaceModalFilteredPlayers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg mb-2">沒有找到符合條件的玩家</div>
                <div className="text-sm">請調整搜尋條件或狀態篩選</div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              顯示 {replaceModalFilteredPlayers.length} 位玩家
            </div>
            <button
              onClick={closePlayerReplaceModal}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 如果不是顯示模態框且不是頁籤模式，則不渲染
  if (!showModal && !isTab) return null;

  // 內容組件
  const Content = () => (
    <div className={isTab ? "space-y-6" : "p-6 overflow-y-auto max-h-[calc(90vh-140px)]"}>
      {/* 新增玩家區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 單個新增 */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 text-blue-700">新增單個玩家</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="輸入玩家姓名"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              onKeyPress={(e) => e.key === 'Enter' && onAddPlayer()}
            />
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">羽球等級</label>
                <select
                  value={newPlayerSkillLevel}
                  onChange={(e) => setNewPlayerSkillLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(SKILL_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>
                      Lv.{level} - {info.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={onAddPlayer}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 批次新增 */}
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 text-green-700">批次新增玩家</h4>
          <div className="space-y-3">
            <div className="flex space-x-3">
              <div className="w-24">
                <label className="block text-sm text-gray-700 mb-1">人數</label>
                <input
                  type="number"
                  value={batchPlayerCount}
                  onChange={(e) => setBatchPlayerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">預設等級</label>
                <select
                  value={newPlayerSkillLevel}
                  onChange={(e) => setNewPlayerSkillLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  {Object.entries(SKILL_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>
                      Lv.{level} - {info.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={onAddBatchPlayers}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              新增 {batchPlayerCount} 位玩家 (Player-X)
            </button>
            <p className="text-sm text-green-600">
              將自動建立 Player-{players.length + 1} 到 Player-{players.length + batchPlayerCount} 的玩家
            </p>
          </div>
        </div>
      </div>

      {/* 玩家統計概覽 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-sm text-gray-600">總玩家數</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{waitingQueue.length}</div>
            <div className="text-sm text-gray-600">排隊中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{restArea.length}</div>
            <div className="text-sm text-gray-600">休息中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {courts.reduce((total, court) => total + court.teamA.length + court.teamB.length, 0)}
            </div>
            <div className="text-sm text-gray-600">比賽中</div>
          </div>
        </div>
      </div>

      {/* 快速休息管理 */}
      {restArea.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold text-orange-700 flex items-center">
                <Coffee className="w-5 h-5 mr-2" />
                休息管理
              </h4>
              <p className="text-sm text-orange-600 mt-1">
                目前有 {restArea.length} 位玩家在休息中
              </p>
            </div>
            <button
              onClick={moveAllRestToQueue}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              全部加入排隊
            </button>
          </div>
        </div>
      )}

      {/* 搜尋和過濾區域 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋玩家姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">狀態:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部 ({players.length})</option>
                <option value="available">可用 ({players.filter(p => getPlayerCurrentStatus(p.id).status === 'available').length})</option>
                <option value="waiting">排隊中 ({waitingQueue.length})</option>
                <option value="playing">比賽中 ({courts.reduce((total, court) => total + court.teamA.length + court.teamB.length, 0)})</option>
                <option value="rest">休息中 ({restArea.length})</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              顯示 {filteredPlayers.length} / {players.length} 位
            </div>
          </div>
        </div>
      </div>

      {/* 玩家列表 - 橫向滾動 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center justify-between">
          <span>玩家列表</span>
          {searchTerm && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              搜尋: "{searchTerm}"
            </span>
          )}
        </h4>
        
        {filteredPlayers.length > 0 ? (
          <div className="relative">
            {/* 滾動控制按鈕 */}
            {filteredPlayers.length > 3 && (
              <>
                <button
                  onClick={() => scrollPlayersContainer('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
                  style={{ marginLeft: '-12px' }}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollPlayersContainer('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
                  style={{ marginRight: '-12px' }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {/* 玩家卡片滾動區域 */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredPlayers.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>

            {/* 滾動提示 */}
            {filteredPlayers.length > 3 && (
              <div className="text-center mt-2">
                <div className="text-xs text-gray-500 flex items-center justify-center space-x-2">
                  <ChevronLeft className="w-3 h-3" />
                  <span>左右滑動查看更多玩家</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">
              {searchTerm ? `沒有找到包含 "${searchTerm}" 的玩家` : '沒有符合條件的玩家'}
            </div>
            <div className="text-sm text-gray-400">
              {searchTerm ? '請嘗試其他搜尋詞' : '請調整過濾條件或新增玩家'}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                清除搜尋
              </button>
            )}
          </div>
        )}
      </div>

      {/* 操作提示 - 更新版本 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">🎨 全新卡片設計</h4>
        <div className="text-xs text-blue-600 space-y-1">
          <div>• <strong>整合式操作</strong>：狀態調整和替換按鈕直接在卡片中</div>
          <div>• <strong>智能菜單</strong>：點擊三點圖示開啟編輯、替換、刪除選項</div>
          <div>• <strong>一鍵狀態切換</strong>：直接點擊按鈕快速變更玩家狀態</div>
          <div>• <strong>視覺化統計</strong>：場次、勝場、勝率一目了然</div>
          <div>• <strong>位置記憶</strong>：操作後自動保持滾動位置</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 主要內容 */}
      {isTab ? (
        <Content />
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold flex items-center">
                  <UserPlus className="w-6 h-6 mr-2" />
                  玩家管理系統
                </h3>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <Content />
          </div>
        </div>
      )}

      {/* 玩家替換模態框 */}
      <PlayerReplaceModal />
    </>
  );
};

export default PlayerModal;