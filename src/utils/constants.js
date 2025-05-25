// 羽球等級定義
export const SKILL_LEVELS = {
  1: { name: '新手', color: 'bg-gray-100 text-gray-700' },
  2: { name: '新手', color: 'bg-gray-100 text-gray-700' },
  3: { name: '新手', color: 'bg-gray-100 text-gray-700' },
  4: { name: '初階', color: 'bg-green-100 text-green-700' },
  5: { name: '初階', color: 'bg-green-100 text-green-700' },
  6: { name: '初中階', color: 'bg-blue-100 text-blue-700' },
  7: { name: '中階', color: 'bg-yellow-100 text-yellow-700' },
  8: { name: '中階', color: 'bg-yellow-100 text-yellow-700' },
  9: { name: '中階', color: 'bg-yellow-100 text-yellow-700' },
  10: { name: '中進階', color: 'bg-orange-100 text-orange-700' },
  11: { name: '中進階', color: 'bg-orange-100 text-orange-700' },
  12: { name: '中進階', color: 'bg-orange-100 text-orange-700' },
  13: { name: '高階', color: 'bg-red-100 text-red-700' },
  14: { name: '高階', color: 'bg-red-100 text-red-700' },
  15: { name: '高階', color: 'bg-red-100 text-red-700' },
  16: { name: '職業', color: 'bg-purple-100 text-purple-700' },
  17: { name: '職業', color: 'bg-purple-100 text-purple-700' },
  18: { name: '職業', color: 'bg-purple-100 text-purple-700' }
};

// 玩家卡片尺寸
export const CARD_SIZES = {
  small: 'p-1 text-xs',
  normal: 'p-2 text-sm',
  large: 'p-3 text-base'
};

// 預設設定
export const DEFAULT_SETTINGS = {
  warmupTimes: [3, 5, 10], // 熱身時間選項（分鐘）
  maxPlayersPerTeam: 2,
  playersPerGame: 4,
  defaultSkillLevel: 6
};