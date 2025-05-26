// 格式化時間 (秒 -> MM:SS)
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 計算玩家綜合評分
export const getPlayerScore = (player) => {
  const winRate = player.totalGames > 0 ? player.wins / player.totalGames : 0.5;
  const skillScore = player.skillLevel / 18; // 正規化到0-1
  return skillScore * 0.7 + winRate * 0.3; // 等級70% + 勝率30%
};

// 平衡分隊演算法
export const balanceTeams = (players) => {
  if (players.length !== 4) return { teamA: [], teamB: [] };
  
  // 按綜合評分排序
  const sortedPlayers = [...players].sort((a, b) => getPlayerScore(b) - getPlayerScore(a));
  
  // 平衡分隊：最強+最弱 vs 第二強+第三強
  const teamA = [sortedPlayers[0].id, sortedPlayers[3].id];
  const teamB = [sortedPlayers[1].id, sortedPlayers[2].id];
  
  return { teamA, teamB };
};

// 找到玩家當前位置 - 修正版本，添加安全檢查
export const findPlayerLocation = (playerId, gameState) => {
  // 安全檢查：確保所有必要的參數都存在
  if (!playerId || !gameState) {
    console.warn('findPlayerLocation: 缺少必要參數', { playerId, gameState });
    return null;
  }

  const { waitingQueue = [], restArea = [], courts = [] } = gameState;

  // 檢查排隊區
  if (Array.isArray(waitingQueue) && waitingQueue.includes(playerId)) {
    return { type: 'waiting' };
  }
  
  // 檢查休息區
  if (Array.isArray(restArea) && restArea.includes(playerId)) {
    return { type: 'rest' };
  }
  
  // 檢查場地
  if (Array.isArray(courts)) {
    for (const court of courts) {
      if (court && court.teamA && court.teamB) {
        if (Array.isArray(court.teamA) && court.teamA.includes(playerId)) {
          return {
            type: 'court',
            courtId: court.id,
            team: 'teamA'
          };
        }
        if (Array.isArray(court.teamB) && court.teamB.includes(playerId)) {
          return {
            type: 'court',
            courtId: court.id,
            team: 'teamB'
          };
        }
      }
    }
  }
  
  // 找不到玩家位置
  return null;
};

// 生成唯一ID
export const generateId = () => Date.now().toString();

// 計算勝率百分比
export const calculateWinRate = (player) => {
  return player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0;
};