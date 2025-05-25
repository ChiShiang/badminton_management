import React from 'react';
import { Plus, Users, UserPlus, Edit3, Save, X, Trash2, Trophy } from 'lucide-react';
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
  onDeletePlayer
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* 模態框標題 */}
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
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 新增玩家區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
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

          {/* 玩家列表 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700">玩家列表 ({players.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {players.map(player => {
                const skillInfo = SKILL_LEVELS[player.skillLevel];
                return (
                  <div key={player.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      {editingPlayer === player.id ? (
                        <div className="flex-1 space-y-2">
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
                          <div className="flex space-x-2">
                            <button
                              onClick={onSavePlayerInfo}
                              className="flex-1 p-1 text-green-600 hover:bg-green-50 rounded text-sm"
                            >
                              <Save className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                              onClick={onCancelEditPlayer}
                              className="flex-1 p-1 text-gray-600 hover:bg-gray-50 rounded text-sm"
                            >
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{player.name}</div>
                            <div className={`inline-block text-xs px-2 py-1 rounded mt-1 ${skillInfo.color}`}>
                              <Trophy className="w-3 h-3 inline mr-1" />
                              Lv.{player.skillLevel} {skillInfo.name}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onStartEditPlayer(player)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="編輯玩家"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeletePlayer(player.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="刪除玩家"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {editingPlayer !== player.id && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          總場次: {player.totalGames} 場
                        </div>
                        <div className="text-sm text-gray-600">
                          戰績: {player.wins}勝 {player.losses}敗
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          勝率: {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%
                        </div>
                        
                        {/* 狀態指示 */}
                        <div className="mt-2">
                          {waitingQueue.includes(player.id) && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">排隊中</span>
                          )}
                          {restArea.includes(player.id) && (
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">休息中</span>
                          )}
                          {courts.some(court => court.teamA.includes(player.id) || court.teamB.includes(player.id)) && (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">比賽中</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;