// 導出數據為JSON
export const exportData = (players, gameHistory, courts) => {
  const data = {
    players,
    gameHistory,
    courts: courts.map(court => ({ 
      ...court, 
      isWarmupActive: false, 
      isGameActive: false 
    })),
    timestamp: new Date().toISOString()
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
        resolve(data);
      } catch (error) {
        reject(new Error('檔案格式錯誤'));
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
    teamA: [...court.teamA],
    teamB: [...court.teamB],
    winner,
    duration: court.gameTime,
    timestamp: new Date().toISOString()
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
        totalGames: player.totalGames + 1
      };
    }
    return player;
  });
};