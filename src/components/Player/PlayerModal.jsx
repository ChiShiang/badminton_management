import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, Users, UserPlus, Edit3, Save, X, Trash2, Trophy, Coffee, Play, Search } from 'lucide-react';
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
  // 修正1：完全獨立的搜尋狀態，確保連續輸入
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 修正1：穩定的搜尋處理，支援連續輸入
  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  // 獲取玩家當前狀態
  const getPlayerCurrentStatus = useCallback((playerId) => {
    if (waitingQueue.includes(playerId)) {
      return { status: 'waiting', text: '排隊中', color: 'bg-blue-100 text-blue-700', icon: '🔵' };
    }
    if (restArea.includes(playerId)) {
      return { status: 'rest', text: '休息中', color: 'bg-orange-100 text-orange-700', icon: '🟠' };
    }
    
    const court = courts.find(c => 
      (c.teamA && c.teamA.includes(playerId)) || 
      (c.teamB && c.teamB.includes(playerId))
    );
    if (court) {
      const team = court.teamA && court.teamA.includes(playerId) ? 'A隊' : 'B隊';
      return { 
        status: 'playing', 
        text: `${court.name} ${team}`, 
        color: 'bg-green-100 text-green-700', 
        icon: '🟢' 
      };
    }
    
    return { status: 'available', text: '可用', color: 'bg-gray-100 text-gray-700', icon: '⚪' };
  }, [waitingQueue, restArea, courts]);

  // 狀態計數器
  const statusCounts = useMemo(() => {
    const counts = {
      available: 0,
      waiting: waitingQueue.length,
      playing: 0,
      rest: restArea.length
    };
    
    courts.forEach(court => {
      counts.playing += (court.teamA?.length || 0) + (court.teamB?.length || 0);
    });
    
    counts.available = players.length - counts.waiting - counts.playing - counts.rest;
    
    return counts;
  }, [players.length, waitingQueue.length, restArea.length, courts]);

  // 修正1：過濾玩家邏輯，使用穩定的searchInput
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // 按狀態過濾
    if (statusFilter !== 'all') {
      filtered = filtered.filter(player => {
        const status = getPlayerCurrentStatus(player.id);
        return status.status === statusFilter;
      });
    }

    // 按搜尋詞過濾
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [players, searchInput, statusFilter, getPlayerCurrentStatus]);

  // 切換玩家休息狀態
  const togglePlayerRestStatus = useCallback((playerId) => {
    const isInRest = restArea.includes(playerId);
    
    if (isInRest) {
      onPlayerMove(playerId, { type: 'waiting' });
    } else {
      onPlayerMove(playerId, { type: 'rest' });
    }
  }, [restArea, onPlayerMove]);

  // 快速操作：將所有休息中的玩家移到排隊區
  const moveAllRestToQueue = useCallback(() => {
    if (restArea.length === 0) {
      alert('沒有休息中的玩家');
      return;
    }
    
    if (window.confirm(`確定要將所有 ${restArea.length} 位休息中的玩家移到排隊區嗎？`)) {
      restArea.forEach(playerId => {
        onPlayerMove(playerId, { type: 'waiting' });
      });
    }
  }, [restArea, onPlayerMove]);

  if (!showModal && !isTab) return null;

  // 修正2：重新設計玩家卡片 - 清爽且功能完整
  const PlayerCard = memo(({ player }) => {
    const skillInfo = SKILL_LEVELS[player.skillLevel];
    const currentStatus = getPlayerCurrentStatus(player.id);
    const isInRest = restArea.includes(player.id);
    const canToggleRest = currentStatus.status === 'waiting' || currentStatus.status === 'rest' || currentStatus.status === 'available';
    const isEditing = editingPlayer === player.id;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editPlayerName}
              onChange={(e) => setEditPlayerName(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && onSavePlayerInfo()}
              autoFocus
            />
            <select
              value={editPlayerSkillLevel}
              onChange={(e) => setEditPlayerSkillLevel(parseInt(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              {Object.entries(SKILL_LEVELS).map(([level, info]) => (
                <option key={level} value={level}>
                  Lv.{level} - {info.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-1">
              <button
                onClick={onSavePlayerInfo}
                className="flex-1 p-1 text-green-600 hover:bg-green-50 rounded text-sm flex items-center justify-center"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={onCancelEditPlayer}
                className="flex-1 p-1 text-gray-600 hover:bg-gray-50 rounded text-sm flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 玩家資訊 */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">{player.name}</h4>
                <div className={`inline-flex items-center text-xs px-2 py-1 rounded mt-1 ${skillInfo.color}`}>
                  <Trophy className="w-3 h-3 mr-1" />
                  Lv.{player.skillLevel}
                </div>
              </div>
              
              {/* 操作按鈕 */}
              <div className="flex space-x-1 ml-2">
                <button
                  onClick={() => onStartEditPlayer(player)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="編輯"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeletePlayer(player.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="刪除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* 統計資訊 */}
            <div className="text-xs text-gray-600 mb-3 space-y-1">
              <div className="flex justify-between">
                <span>總場次: {player.totalGames}</span>
                <span>勝率: {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%</span>
              </div>
              <div>戰績: {player.wins}勝 {player.losses}敗</div>
            </div>
            
            {/* 狀態和操作 */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${currentStatus.color}`}>
                <span className="mr-1">{currentStatus.icon}</span>
                {currentStatus.text}
              </span>
              
              {canToggleRest && (
                <button
                  onClick={() => togglePlayerRestStatus(player.id)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isInRest 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {isInRest ? <Play className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                </button>
              )}
            </div>

            {currentStatus.status === 'playing' && (
              <div className="text-xs text-gray-500 text-center py-1 bg-gray-50 rounded mt-2">
                比賽中無法切換狀態
              </div>
            )}
          </>
        )}
      </div>
    );
  });

  PlayerCard.displayName = 'PlayerCard';

  // 內容組件
  const Content = () => (
    <div className={`space-y-6 ${isTab ? '' : 'p-6 max-h-[calc(90vh-140px)] overflow-y-auto'}`}>
      {/* 新增玩家區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 單個新增 */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-base font-semibold mb-3 text-blue-700 flex items-center">
            <UserPlus className="w-4 h-4 mr-2" />
            新增單個玩家
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="輸入玩家姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              onKeyPress={(e) => e.key === 'Enter' && onAddPlayer()}
            />
            <div className="flex space-x-2">
              <select
                value={newPlayerSkillLevel}
                onChange={(e) => setNewPlayerSkillLevel(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              >
                {Object.entries(SKILL_LEVELS).map(([level, info]) => (
                  <option key={level} value={level}>
                    Lv.{level} - {info.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onAddPlayer}
                disabled={!newPlayerName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                新增
              </button>
            </div>
          </div>
        </div>

        {/* 批次新增 */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="text-base font-semibold mb-3 text-green-700 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            批次新增玩家
          </h4>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="w-20">
                <label className="block text-xs text-gray-700 mb-1">人數</label>
                <input
                  type="number"
                  value={batchPlayerCount}
                  onChange={(e) => setBatchPlayerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="50"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-700 mb-1">等級</label>
                <select
                  value={newPlayerSkillLevel}
                  onChange={(e) => setNewPlayerSkillLevel(parseInt(e.target.value))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
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
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              新增 {batchPlayerCount} 位玩家
            </button>
            <p className="text-xs text-green-600">
              將建立 Player-{players.length + 1} 到 Player-{players.length + batchPlayerCount}
            </p>
          </div>
        </div>
      </div>

      {/* 統計概覽 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-xs text-gray-600">總玩家</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.waiting}</div>
            <div className="text-xs text-gray-600">排隊中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.rest}</div>
            <div className="text-xs text-gray-600">休息中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.playing}</div>
            <div className="text-xs text-gray-600">比賽中</div>
          </div>
        </div>
      </div>

      {/* 快速休息管理 */}
      {restArea.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-orange-700 flex items-center">
                <Coffee className="w-4 h-4 mr-2" />
                休息管理 ({restArea.length}人)
              </h4>
            </div>
            <button
              onClick={moveAllRestToQueue}
              className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center text-sm"
            >
              <Play className="w-3 h-3 mr-1" />
              全部加入排隊
            </button>
          </div>
        </div>
      )}

      {/* 修正1：搜尋和過濾區域 - 確保連續輸入 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋玩家姓名..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                autoComplete="off"
                spellCheck="false"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">狀態:</span>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部 ({players.length})</option>
                <option value="available">可用 ({statusCounts.available})</option>
                <option value="waiting">排隊 ({statusCounts.waiting})</option>
                <option value="playing">比賽 ({statusCounts.playing})</option>
                <option value="rest">休息 ({statusCounts.rest})</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              顯示 {filteredPlayers.length} / {players.length}
            </div>
          </div>
        </div>
      </div>

      {/* 修正2：玩家列表 - 清爽的網格佈局 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-700">
            玩家列表
            {searchInput && (
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded ml-2">
                搜尋: "{searchInput}"
              </span>
            )}
          </h4>
        </div>
        
        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">
              {searchInput ? `沒有找到包含 "${searchInput}" 的玩家` : '沒有符合條件的玩家'}
            </div>
            <div className="text-sm text-gray-400 mb-4">
              {searchInput ? '請嘗試其他搜尋詞' : '請調整過濾條件或新增玩家'}
            </div>
            {searchInput && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                清除搜尋
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // 如果是頁籤模式，直接返回內容
  if (isTab) {
    return <Content />;
  }

  // 如果是模態框模式，包裝在模態框中
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* 模態框標題 */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              玩家管理系統
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <Content />
      </div>
    </div>
  );
};

export default PlayerModal;