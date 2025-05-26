// 導出數據為JSON - 包含休息區資料
export const exportData = (players, gameHistory, courts, restArea = []) => {
  const data = {
    players,
    gameHistory,
    courts: courts.map(court => ({ 
      ...court, 
      isWarmupActive: false, 
      isGameActive: false 
    })),
    restArea, // 包含休息區資料
    timestamp: new Date().toISOString(),
    version: '2.0' // 版本號，用於未來兼容性
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `badminton-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 導入數據
export const importData = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('沒有選擇檔案'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // 驗證必要的數據結構
        if (!data.players || !Array.isArray(data.players)) {
          reject(new Error('檔案格式錯誤：缺少玩家數據'));
          return;
        }
        
        // 確保休息區數據存在（向後兼容）
        if (!data.restArea) {
          data.restArea = [];
        }
        
        // 確保比賽歷史存在
        if (!data.gameHistory) {
          data.gameHistory = [];
        }
        
        // 確保場地數據存在且格式正確
        if (!data.courts || !Array.isArray(data.courts)) {
          data.courts = [{
            id: '1',
            name: '場地 1',
            teamA: [],
            teamB: [],
            warmupTime: 0,
            gameTime: 0,
            isWarmupActive: false,
            isGameActive: false,
            gameResult: null,
            warmupOriginalTime: 0
          }];
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('檔案格式錯誤：' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsText(file);
  });
};

// 創建比賽記錄
export const createGameRecord = (court, winner) => {
  return {
    id: Date.now().toString(),
    courtId: court.id,
    courtName: court.name,
    teamA: [...court.teamA],
    teamB: [...court.teamB],
    winner,
    duration: court.gameTime,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('zh-TW')
  };
};

// 更新玩家統計
export const updatePlayerStats = (players, gameRecord) => {
  return players.map(player => {
    const isInTeamA = gameRecord.teamA.includes(player.id);
    const isInTeamB = gameRecord.teamB.includes(player.id);
    
    if (isInTeamA || isInTeamB) {
      const won = (isInTeamA && gameRecord.winner === 'A') || 
                   (isInTeamB && gameRecord.winner === 'B');
      return {
        ...player,
        wins: won ? player.wins + 1 : player.wins,
        losses: won ? player.losses : player.losses + 1,
        totalGames: player.totalGames + 1,
        lastGameDate: gameRecord.date
      };
    }
    return player;
  });
};

// 驗證數據完整性
export const validateGameData = (data) => {
  const errors = [];
  
  // 檢查玩家數據
  if (!data.players || !Array.isArray(data.players)) {
    errors.push('玩家數據格式錯誤');
  } else {
    data.players.forEach((player, index) => {
      if (!player.id || !player.name) {
        errors.push(`玩家 ${index + 1} 數據不完整`);
      }
    });
  }
  
  // 檢查場地數據
  if (!data.courts || !Array.isArray(data.courts)) {
    errors.push('場地數據格式錯誤');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 生成統計報告
export const generateStatsReport = (players, gameHistory) => {
  const report = {
    totalPlayers: players.length,
    totalGames: gameHistory.length,
    activePlayersCount: players.filter(p => p.totalGames > 0).length,
    averageGamesPerPlayer: players.length > 0 ? 
      (players.reduce((sum, p) => sum + p.totalGames, 0) / players.length).toFixed(1) : 0,
    topPlayers: players
      .filter(p => p.totalGames >= 3)
      .sort((a, b) => {
        const aWinRate = a.totalGames > 0 ? a.wins / a.totalGames : 0;
        const bWinRate = b.totalGames > 0 ? b.wins / b.totalGames : 0;
        return bWinRate - aWinRate;
      })
      .slice(0, 5),
    recentGames: gameHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  };
  
  return report;
};