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

// 找到玩家當前位置 - 完全重寫，處理重複玩家問題
export const findPlayerLocation = (playerId, gameState) => {
  // 安全檢查：確保所有必要的參數都存在
  if (!playerId || !gameState) {
    console.warn('findPlayerLocation: 缺少必要參數', { playerId, gameState });
    return null;
  }

  const { waitingQueue = [], restArea = [], courts = [] } = gameState;

  // 記錄找到的所有位置
  const foundLocations = [];

  try {
    // 檢查排隊區
    if (Array.isArray(waitingQueue) && waitingQueue.includes(playerId)) {
      foundLocations.push({ type: 'waiting', source: 'waitingQueue' });
    }
    
    // 檢查休息區
    if (Array.isArray(restArea) && restArea.includes(playerId)) {
      foundLocations.push({ type: 'rest', source: 'restArea' });
    }
    
    // 檢查場地
    if (Array.isArray(courts)) {
      for (const court of courts) {
        if (court && court.teamA && court.teamB) {
          if (Array.isArray(court.teamA) && court.teamA.includes(playerId)) {
            foundLocations.push({
              type: 'court',
              courtId: court.id,
              team: 'teamA',
              source: `court-${court.id}-teamA`
            });
          }
          if (Array.isArray(court.teamB) && court.teamB.includes(playerId)) {
            foundLocations.push({
              type: 'court',
              courtId: court.id,
              team: 'teamB',
              source: `court-${court.id}-teamB`
            });
          }
        }
      }
    }

    // 處理重複玩家情況
    if (foundLocations.length === 0) {
      // 玩家不在任何位置，是可用狀態
      return null;
    } else if (foundLocations.length === 1) {
      // 正常情況，玩家只在一個位置
      const location = foundLocations[0];
      return {
        type: location.type,
        courtId: location.courtId,
        team: location.team
      };
    } else {
      // 重複玩家情況，需要處理
      console.warn(`玩家 ${playerId} 出現在多個位置:`, foundLocations);
      
      // 優先級：場地 > 休息區 > 排隊區
      // 這樣可以確保比賽中的玩家優先級最高
      const priorityOrder = ['court', 'rest', 'waiting'];
      
      for (const priority of priorityOrder) {
        const priorityLocation = foundLocations.find(loc => loc.type === priority);
        if (priorityLocation) {
          return {
            type: priorityLocation.type,
            courtId: priorityLocation.courtId,
            team: priorityLocation.team,
            isDuplicate: true, // 標記為重複玩家
            allLocations: foundLocations // 記錄所有位置，用於調試
          };
        }
      }
      
      // 如果沒有找到優先級匹配的位置，返回第一個
      const firstLocation = foundLocations[0];
      return {
        type: firstLocation.type,
        courtId: firstLocation.courtId,
        team: firstLocation.team,
        isDuplicate: true,
        allLocations: foundLocations
      };
    }
  } catch (error) {
    console.error('findPlayerLocation 發生錯誤:', error, { playerId, gameState });
    return null;
  }
};

// 檢查玩家是否在特定位置
export const isPlayerInLocation = (playerId, location, gameState) => {
  if (!playerId || !location || !gameState) {
    return false;
  }

  const { waitingQueue = [], restArea = [], courts = [] } = gameState;

  try {
    switch (location.type) {
      case 'waiting':
        return Array.isArray(waitingQueue) && waitingQueue.includes(playerId);
      case 'rest':
        return Array.isArray(restArea) && restArea.includes(playerId);
      case 'court':
        if (!location.courtId || !location.team) return false;
        const court = courts.find(c => c && c.id === location.courtId);
        if (!court || !court[location.team]) return false;
        return Array.isArray(court[location.team]) && court[location.team].includes(playerId);
      default:
        return false;
    }
  } catch (error) {
    console.error('isPlayerInLocation 錯誤:', error);
    return false;
  }
};

// 獲取所有重複玩家
export const findDuplicatePlayers = (gameState) => {
  const { waitingQueue = [], restArea = [], courts = [] } = gameState;
  const playerCounts = {};
  const duplicates = [];

  try {
    // 統計每個玩家出現的次數和位置
    const countPlayer = (playerId, location) => {
      if (!playerCounts[playerId]) {
        playerCounts[playerId] = {
          count: 0,
          locations: []
        };
      }
      playerCounts[playerId].count++;
      playerCounts[playerId].locations.push(location);
    };

    // 統計排隊區
    waitingQueue.forEach(playerId => {
      countPlayer(playerId, { type: 'waiting' });
    });

    // 統計休息區
    restArea.forEach(playerId => {
      countPlayer(playerId, { type: 'rest' });
    });

    // 統計場地
    courts.forEach(court => {
      if (court && court.teamA && court.teamB) {
        court.teamA.forEach(playerId => {
          countPlayer(playerId, { type: 'court', courtId: court.id, team: 'teamA' });
        });
        court.teamB.forEach(playerId => {
          countPlayer(playerId, { type: 'court', courtId: court.id, team: 'teamB' });
        });
      }
    });

    // 找出重複的玩家
    Object.keys(playerCounts).forEach(playerId => {
      if (playerCounts[playerId].count > 1) {
        duplicates.push({
          playerId,
          count: playerCounts[playerId].count,
          locations: playerCounts[playerId].locations
        });
      }
    });

    return duplicates;
  } catch (error) {
    console.error('findDuplicatePlayers 錯誤:', error);
    return [];
  }
};

// 生成唯一ID
export const generateId = () => Date.now().toString();

// 計算勝率百分比
export const calculateWinRate = (player) => {
  return player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0;
};

// 驗證遊戲狀態一致性
export const validateGameState = (gameState) => {
  const duplicates = findDuplicatePlayers(gameState);
  
  return {
    isValid: duplicates.length === 0,
    duplicates,
    errors: duplicates.map(dup => 
      `玩家 ${dup.playerId} 出現 ${dup.count} 次在: ${dup.locations.map(loc => 
        loc.type === 'court' ? `${loc.courtId}-${loc.team}` : loc.type
      ).join(', ')}`
    )
  };
};