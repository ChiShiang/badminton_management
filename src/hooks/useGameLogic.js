import { useCallback } from 'react';
import { generateId, balanceTeams } from '../utils/gameUtils';
import { createGameRecord, updatePlayerStats } from '../utils/dataUtils';
import { DEFAULT_SETTINGS } from '../utils/constants';

export const useGameLogic = (
  courts, setCourts, 
  players, setPlayers, 
  waitingQueue, setWaitingQueue,
  gameHistory, setGameHistory,
  autoQueue
) => {
  // 自動補位邏輯 - 移到前面定義
  const autoFillCourt = useCallback((courtId) => {
    setWaitingQueue(currentQueue => {
      if (currentQueue.length >= DEFAULT_SETTINGS.playersPerGame) {
        const availablePlayers = currentQueue.slice(0, DEFAULT_SETTINGS.playersPerGame);
        const playersData = availablePlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
        
        // 使用平衡分隊算法
        const { teamA, teamB } = balanceTeams(playersData);

        setCourts(prevCourts => prevCourts.map(court => 
          court.id === courtId 
            ? { ...court, teamA, teamB }
            : court
        ));

        return currentQueue.slice(DEFAULT_SETTINGS.playersPerGame);
      }
      return currentQueue;
    });
  }, [players, setCourts, setWaitingQueue]);

  // 新增場地
  const addCourt = useCallback(() => {
    const newCourt = {
      id: generateId(),
      name: `場地 ${courts.length + 1}`,
      teamA: [],
      teamB: [],
      warmupTime: 0,
      gameTime: 0,
      isWarmupActive: false,
      isGameActive: false,
      gameResult: null,
      warmupOriginalTime: 0
    };
    setCourts(prev => [...prev, newCourt]);
  }, [courts.length, setCourts]);

  // 刪除場地
  const removeCourt = useCallback((courtId) => {
    if (courts.length <= 1) {
      alert('至少需要保留一個場地！');
      return;
    }
    
    const court = courts.find(c => c.id === courtId);
    if (court) {
      const playersToMove = [...court.teamA, ...court.teamB];
      setWaitingQueue(prev => [...prev, ...playersToMove]);
    }
    
    setCourts(prev => prev.filter(c => c.id !== courtId));
  }, [courts, setCourts, setWaitingQueue]);

  // 開始比賽
  const startGame = useCallback((courtId) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;

    const totalPlayers = court.teamA.length + court.teamB.length;
    if (totalPlayers !== DEFAULT_SETTINGS.playersPerGame) {
      alert('需要滿4人才能開始比賽！');
      return;
    }

    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? { ...court, isGameActive: true, gameTime: 0 }
        : court
    ));
  }, [courts, setCourts]);

  // 結束比賽
  const endGame = useCallback((courtId, winner) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;

    // 創建比賽記錄
    const gameRecord = createGameRecord(court, winner);
    setGameHistory(prev => [...prev, gameRecord]);

    // 更新玩家統計
    const updatedPlayers = updatePlayerStats(players, gameRecord);
    setPlayers(updatedPlayers);

    // 將場上玩家移到排隊區
    const finishedPlayers = [...court.teamA, ...court.teamB];
    setWaitingQueue(prev => [...prev, ...finishedPlayers]);

    // 清空場地
    setCourts(prev => prev.map(c => 
      c.id === courtId 
        ? { ...c, teamA: [], teamB: [], isGameActive: false, gameTime: 0, gameResult: winner }
        : c
    ));

    // 自動補位
    if (autoQueue) {
      setTimeout(() => {
        autoFillCourt(courtId);
      }, 500);
    }
  }, [courts, players, autoQueue, autoFillCourt, setCourts, setPlayers, setWaitingQueue, setGameHistory]);

  // 快速補位
  const quickFillCourt = useCallback((courtId) => {
    if (waitingQueue.length >= DEFAULT_SETTINGS.playersPerGame) {
      autoFillCourt(courtId);
    } else {
      alert('排隊區人數不足4人，無法自動補位');
    }
  }, [waitingQueue.length, autoFillCourt]);

  // 重置所有人員位置
  const resetAllPositions = useCallback(() => {
    const allPlayerIds = players.map(p => p.id);
    setWaitingQueue(allPlayerIds);
    setCourts(prev => prev.map(court => ({ ...court, teamA: [], teamB: [] })));
  }, [players, setWaitingQueue, setCourts]);

  // 自動分配到所有場地
  const autoFillAllCourts = useCallback(() => {
    courts.forEach((court, index) => {
      const startIdx = index * DEFAULT_SETTINGS.playersPerGame;
      if (startIdx < waitingQueue.length) {
        setTimeout(() => autoFillCourt(court.id), index * 100);
      }
    });
  }, [courts, waitingQueue.length, autoFillCourt]);

  return {
    addCourt,
    removeCourt,
    startGame,
    endGame,
    autoFillCourt,
    quickFillCourt,
    resetAllPositions,
    autoFillAllCourts
  };
};