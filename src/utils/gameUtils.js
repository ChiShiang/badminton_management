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

// 找到玩家當前位置
export const findPlayerLocation = (playerId, { waitingQueue, restArea, courts }) => {
  if (waitingQueue.includes(playerId)) return { type: 'waiting' };
  if (restArea.includes(playerId)) return { type: 'rest' };
  
  const court = courts.find(c => c.teamA.includes(playerId) || c.teamB.includes(playerId));
  if (court) {
    return {
      type: 'court',
      courtId: court.id,
      team: court.teamA.includes(playerId) ? 'teamA' : 'teamB'
    };
  }
  return null;
};

// 生成唯一ID
export const generateId = () => Date.now().toString();

// 計算勝率百分比
export const calculateWinRate = (player) => {
  return player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0;
};