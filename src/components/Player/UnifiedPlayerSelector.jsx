import React, { useCallback, useState, useMemo, useRef } from 'react';
import { Search, Filter, Users, X, ArrowRight, RefreshCw } from 'lucide-react';
import PlayerCard from './PlayerCard';
import { findPlayerLocation } from '../../utils/gameUtils';
import { SKILL_LEVELS } from '../../utils/constants';

const UnifiedPlayerSelector = React.memo(({ 
  targetLocation, 
  currentPlayers = [], 
  maxPlayers = 2, 
  selectorId,
  activeSelector,
  setActiveSelector,
  availablePlayers,
  players,
  onPlayerMove,
  onPlayerSwap,
  waitingQueue = [], 
  restArea = [],     
  courts = [],
  // 新增 props
  title = "選擇玩家",
  allowReplace = true,
  showStatus = true // 預設顯示狀態
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReplacementSelector, setShowReplacementSelector] = useState(false);
  const [showPlayerSelectModal, setShowPlayerSelectModal] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [selectedPlayerForReplacement, setSelectedPlayerForReplacement] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('all');
  const [operationType, setOperationType] = useState('add'); // 'add' 或 'replace'
  
  // 搜尋輸入框的 ref，用於防止失焦
  const searchInputRef = useRef(null);
  const modalIdRef = useRef(Date.now()); // 固定的模態框 ID
  
  const isShowingSelector = activeSelector === selectorId;

  // 獲取玩家狀態的函數
  const getPlayerStatus = useCallback((playerId) => {
    try {
      if (!playerId) {
        return { type: 'unknown', text: '未知', color: 'bg-gray-100 text-gray-700', priority: 99 };
      }

      // 檢查是否在當前選擇器的位置
      if (currentPlayers.includes(playerId)) {
        if (targetLocation.type === 'court') {
          const court = courts.find(c => c.id === targetLocation.courtId);
          const courtName = court ? court.name : '場地';
          const teamName = targetLocation.team === 'teamA' ? 'A隊' : 'B隊';
          return { 
            type: 'current', 
            text: `${courtName} ${teamName}`, 
            color: 'bg-green-100 text-green-700',
            priority: 0
          };
        } else if (targetLocation.type === 'waiting') {
          return { type: 'current', text: '排隊中', color: 'bg-blue-100 text-blue-700', priority: 0 };
        } else if (targetLocation.type === 'rest') {
          return { type: 'current', text: '休息中', color: 'bg-orange-100 text-orange-700', priority: 0 };
        }
      }
      
      // 快速檢查各個位置 - 加入優先級
      if (waitingQueue.includes(playerId)) {
        return { type: 'waiting', text: '排隊中', color: 'bg-blue-100 text-blue-700', priority: 2 };
      }
      if (restArea.includes(playerId)) {
        return { type: 'rest', text: '休息中', color: 'bg-orange-100 text-orange-700', priority: 3 };
      }
      
      // 檢查場地
      for (const court of courts) {
        if (court.teamA && court.teamA.includes(playerId)) {
          return { 
            type: 'court', 
            text: `${court.name} A隊`, 
            color: 'bg-purple-100 text-purple-700',
            priority: 4
          };
        }
        if (court.teamB && court.teamB.includes(playerId)) {
          return { 
            type: 'court', 
            text: `${court.name} B隊`, 
            color: 'bg-purple-100 text-purple-700',
            priority: 4
          };
        }
      }
      
      return { type: 'available', text: '可用', color: 'bg-green-100 text-green-700', priority: 1 };
    } catch (error) {
      console.error('getPlayerStatus 錯誤:', error);
      return { type: 'error', text: '錯誤', color: 'bg-red-100 text-red-700', priority: 99 };
    }
  }, [
    waitingQueue.join(','), 
    restArea.join(','), 
    currentPlayers.join(','), 
    targetLocation,
    courts.map(c => `${c.id}:${c.name}:${c.teamA?.join('-') || ''}|${c.teamB?.join('-') || ''}`).join('|')
  ]);

  // 模態框的玩家過濾 - 增加排序
  const modalFilteredPlayers = useMemo(() => {
    let filtered = players;
    
    // 在替換模式下，排除當前要被替換的玩家
    if (operationType === 'replace' && selectedPlayerForReplacement) {
      filtered = filtered.filter(p => p.id !== selectedPlayerForReplacement);
    }
    
    // 在添加模式下，排除當前位置已有的玩家
    if (operationType === 'add') {
      const currentPlayerSet = new Set(currentPlayers);
      filtered = filtered.filter(p => !currentPlayerSet.has(p.id));
    }

    // 狀態過濾
    if (modalStatusFilter !== 'all') {
      filtered = filtered.filter(player => {
        const status = getPlayerStatus(player.id);
        return status.type === modalStatusFilter;
      });
    }

    // 名字搜尋
    if (modalSearchTerm.trim()) {
      const searchLower = modalSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchLower)
      );
    }

    // 添加狀態信息並排序
    const playersWithStatus = filtered.map(player => ({
      ...player,
      status: getPlayerStatus(player.id)
    }));

    // 排序：優先級 -> 勝率 -> 姓名
    playersWithStatus.sort((a, b) => {
      // 首先按狀態優先級排序
      if (a.status.priority !== b.status.priority) {
        return a.status.priority - b.status.priority;
      }
      
      // 然後按勝率排序（高到低）
      const aWinRate = a.totalGames > 0 ? a.wins / a.totalGames : 0;
      const bWinRate = b.totalGames > 0 ? b.wins / b.totalGames : 0;
      if (Math.abs(aWinRate - bWinRate) > 0.01) {
        return bWinRate - aWinRate;
      }
      
      // 最後按姓名排序
      return a.name.localeCompare(b.name);
    });

    return playersWithStatus;
  }, [players, modalSearchTerm, modalStatusFilter, getPlayerStatus, currentPlayers, operationType, selectedPlayerForReplacement]);

  // 處理切換選擇器
  const handleToggleSelector = useCallback((playerId = null) => {
    if (playerId) {
      // 點擊現有玩家，顯示替換模態框
      setSelectedPlayerForReplacement(playerId);
      setOperationType('replace');
      setModalSearchTerm('');
      setModalStatusFilter('all');
      setShowPlayerSelectModal(true);
      setActiveSelector(null);
    } else {
      // 點擊添加按鈕，顯示添加模態框
      setOperationType('add');
      setSelectedPlayerForReplacement(null);
      setModalSearchTerm('');
      setModalStatusFilter('all');
      setShowPlayerSelectModal(true);
      setActiveSelector(null);
    }
  }, [setActiveSelector]);

  // 處理玩家選擇
  const handlePlayerSelect = useCallback((playerId, targetPlayerId = null) => {
    try {
      if (currentPlayers.includes(playerId)) {
        closeModal();
        return true;
      }
      
      const result = onPlayerMove(playerId, targetLocation, targetPlayerId);
      closeModal();
      return result;
    } catch (error) {
      console.error('handlePlayerSelect 錯誤:', error);
      return false;
    }
  }, [onPlayerMove, targetLocation, currentPlayers]);

  // 關閉模態框
  const closeModal = useCallback(() => {
    setShowPlayerSelectModal(false);
    setShowReplacementSelector(false);
    setSelectedPlayerForReplacement(null);
    setModalSearchTerm('');
    setModalStatusFilter('all');
    setDraggedPlayerId(null);
    setActiveSelector(null);
  }, [setActiveSelector]);

  // 拖拽事件處理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId || currentPlayers.includes(playerId)) {
      return;
    }

    // 如果區域未滿，直接添加
    if (currentPlayers.length < maxPlayers) {
      handlePlayerSelect(playerId);
      return;
    }

    // 如果區域已滿，顯示替換選擇器
    setDraggedPlayerId(playerId);
    setShowReplacementSelector(true);
  }, [currentPlayers, maxPlayers, handlePlayerSelect]);

  // 處理玩家卡片點擊
  const handlePlayerCardClick = useCallback((e, playerId) => {
    e.preventDefault();
    e.stopPropagation();
    if (allowReplace) {
      handleToggleSelector(playerId);
    }
  }, [handleToggleSelector, allowReplace]);

  // 替換玩家處理
  const handlePlayerReplace = useCallback((targetPlayerId) => {
    if (draggedPlayerId) {
      handlePlayerSelect(draggedPlayerId, targetPlayerId);
    }
    setShowReplacementSelector(false);
    setDraggedPlayerId(null);
  }, [draggedPlayerId, handlePlayerSelect]);

  // 處理搜尋輸入 - 防止失焦
  const handleSearchChange = useCallback((e) => {
    setModalSearchTerm(e.target.value);
    // 保持焦點
    if (searchInputRef.current && searchInputRef.current !== document.activeElement) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, []);

  // 玩家選擇模態框組件 - 優化渲染穩定性
  const PlayerSelectModal = React.memo(() => {
    if (!showPlayerSelectModal) return null;

    const isReplaceMode = operationType === 'replace';
    const targetPlayer = isReplaceMode ? players.find(p => p.id === selectedPlayerForReplacement) : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* 模態框標題 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {isReplaceMode ? '替換玩家' : title}
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="text-blue-100 mt-2">
              {isReplaceMode ? (
                <>為 <strong>{targetPlayer?.name}</strong> 選擇替換的玩家</>
              ) : (
                <>選擇要加入的玩家 ({currentPlayers.length}/{maxPlayers})</>
              )}
            </div>
          </div>

          {/* 搜尋和過濾區域 */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    key={`search-${modalIdRef.current}`} // 固定 key 防止重新創建
                    type="text"
                    placeholder="搜尋玩家姓名..."
                    value={modalSearchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="off"
                  />
                  {modalSearchTerm && (
                    <button
                      onClick={() => {
                        setModalSearchTerm('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={modalStatusFilter}
                  onChange={(e) => setModalStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">全部狀態</option>
                  <option value="available">可用</option>
                  <option value="waiting">排隊中</option>
                  <option value="rest">休息中</option>
                  <option value="playing">比賽中</option>
                </select>
              </div>
            </div>
          </div>

          {/* 玩家列表 */}
          <div className="p-6 overflow-y-auto max-h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modalFilteredPlayers.map(player => (
                <div
                  key={player.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  onClick={() => {
                    if (isReplaceMode) {
                      handlePlayerSelect(player.id, selectedPlayerForReplacement);
                    } else {
                      handlePlayerSelect(player.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{player.name}</div>
                      <div className="text-sm text-gray-600">
                        Lv.{player.skillLevel} {SKILL_LEVELS[player.skillLevel]?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        勝率: {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%
                      </div>
                    </div>
                    {/* 強制顯示狀態 */}
                    <div className={`text-xs px-2 py-1 rounded-full ${player.status.color} ml-2`}>
                      {player.status.text}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {player.wins}勝 {player.losses}敗 • 總{player.totalGames}場
                  </div>
                  <div className="flex items-center text-xs text-blue-600 font-medium">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    點擊{isReplaceMode ? '替換' : '選擇'}
                  </div>
                </div>
              ))}
            </div>

            {modalFilteredPlayers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg mb-2">沒有找到符合條件的玩家</div>
                <div className="text-sm">請調整搜尋條件或狀態篩選</div>
              </div>
            )}
          </div>

          {/* 底部操作區域 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              顯示 {modalFilteredPlayers.length} 位玩家
              {modalFilteredPlayers.length > 0 && (
                <span className="ml-2 text-gray-500">
                  • 按優先級和勝率排序
                </span>
              )}
            </div>
            <button
              onClick={closeModal}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  });

  // 替換選擇器（拖拽時）
  if (showReplacementSelector && draggedPlayerId) {
    const draggedPlayer = players.find(p => p.id === draggedPlayerId);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3">
        <div className="text-sm text-yellow-800 mb-2 font-medium">
          選擇要被替換的玩家
        </div>
        <div className="text-xs text-yellow-700 mb-3">
          {draggedPlayer?.name || '未知玩家'} 將替換選中的玩家
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {currentPlayers.map(playerId => {
            const player = players.find(p => p.id === playerId);
            if (!player) return null;
            
            return (
              <div 
                key={player.id}
                className="cursor-pointer hover:bg-yellow-100 rounded p-2 border border-yellow-300 flex items-center justify-between"
                onClick={() => handlePlayerReplace(playerId)}
              >
                <div className="text-sm font-medium">{player.name}</div>
                <div className="text-xs text-yellow-600">點擊替換</div>
              </div>
            );
          })}
        </div>
        <button
          onClick={closeModal}
          className="mt-3 w-full text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          取消
        </button>
      </div>
    );
  }

  // 主要介面
  return (
    <>
      <div 
        className={`space-y-1 min-h-16 p-2 rounded border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 當前玩家列表 */}
        {currentPlayers.map(playerId => {
          const player = players.find(p => p.id === playerId);
          return player ? (
            <PlayerCard
              key={player.id}
              player={player}
              size="small"
              isClickable={allowReplace}
              isDraggable={true}
              onClick={(e) => handlePlayerCardClick(e, playerId)}
              onDragStart={(draggedId) => setDraggedPlayerId(draggedId)}
              allowDirectSwap={true}
              onPlayerSwap={onPlayerSwap}
            />
          ) : null;
        })}
        
        {/* 添加玩家按鈕 */}
        {currentPlayers.length < maxPlayers && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleSelector();
            }}
            className="w-full text-xs px-2 py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors focus:outline-none focus:border-blue-400"
          >
            + 添加玩家 ({currentPlayers.length}/{maxPlayers})
          </button>
        )}
        
        {/* 拖拽提示 */}
        {isDragOver && (
          <div className="text-center text-blue-600 text-xs py-2">
            {currentPlayers.length >= maxPlayers 
              ? '放開以選擇替換對象' 
              : '放開以添加玩家'
            }
          </div>
        )}
      </div>

      {/* 玩家選擇模態框 */}
      <PlayerSelectModal />
    </>
  );
}, (prevProps, nextProps) => {
  // 自定義比較函數
  return (
    prevProps.activeSelector === nextProps.activeSelector &&
    prevProps.currentPlayers.join(',') === nextProps.currentPlayers.join(',') &&
    prevProps.waitingQueue.join(',') === nextProps.waitingQueue.join(',') &&
    prevProps.restArea.join(',') === nextProps.restArea.join(',') &&
    prevProps.players.length === nextProps.players.length &&
    prevProps.courts.map(c => `${c.id}:${c.teamA?.join('-')}|${c.teamB?.join('-')}`).join('|') ===
    nextProps.courts.map(c => `${c.id}:${c.teamA?.join('-')}|${c.teamB?.join('-')}`).join('|')
  );
});

UnifiedPlayerSelector.displayName = 'UnifiedPlayerSelector';

export default UnifiedPlayerSelector;