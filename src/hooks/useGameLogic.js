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
  // 修正：自動補位邏輯 - 確保正確執行
  const autoFillCourt = useCallback((courtId) => {
    console.log('🎯 自動補位開始:', { courtId, waitingQueueLength: waitingQueue.length, autoQueue });
    
    // 檢查排隊人數
    if (waitingQueue.length < DEFAULT_SETTINGS.playersPerGame) {
      console.log('❌ 排隊人數不足，無法自動補位:', waitingQueue.length);
      return false;
    }

    // 檢查目標場地是否真的是空的
    const targetCourt = courts.find(c => c.id === courtId);
    if (!targetCourt) {
      console.error('❌ 找不到目標場地:', courtId);
      return false;
    }

    const currentPlayersInCourt = targetCourt.teamA.length + targetCourt.teamB.length;
    if (currentPlayersInCourt > 0) {
      console.warn('⚠️ 場地不是空的，跳過自動補位:', { courtId, currentPlayers: currentPlayersInCourt });
      return false;
    }

    // 取前4名排隊玩家，按排隊順序分配
    const nextPlayers = waitingQueue.slice(0, DEFAULT_SETTINGS.playersPerGame);
    
    if (nextPlayers.length !== DEFAULT_SETTINGS.playersPerGame) {
      console.error('❌ 無法獲取足夠的排隊玩家');
      return false;
    }

    // 保持排隊順序：前兩人為A隊，後兩人為B隊
    const teamA = [nextPlayers[0], nextPlayers[1]];
    const teamB = [nextPlayers[2], nextPlayers[3]];

    console.log('✅ 按排隊順序分隊:', { 
      teamA: teamA.map(id => players.find(p => p.id === id)?.name || id),
      teamB: teamB.map(id => players.find(p => p.id === id)?.name || id)
    });

    // 先更新排隊區，再更新場地
    setWaitingQueue(prev => {
      const newQueue = prev.slice(DEFAULT_SETTINGS.playersPerGame);
      console.log('✅ 更新排隊區:', { before: prev.length, after: newQueue.length });
      return newQueue;
    });

    // 更新場地狀態
    setCourts(prevCourts => prevCourts.map(court => 
      court.id === courtId 
        ? { ...court, teamA, teamB }
        : court
    ));

    return true;
  }, [players, setCourts, setWaitingQueue, courts, waitingQueue]);

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

  // 修正：結束比賽 - 完全重寫自動補位邏輯
  const endGame = useCallback((courtId, winner) => {
    console.log('🏁 比賽結束:', { courtId, winner, autoQueue });
    
    const court = courts.find(c => c.id === courtId);
    if (!court) {
      console.error('❌ 找不到比賽場地:', courtId);
      return;
    }

    // 創建比賽記錄
    const gameRecord = createGameRecord(court, winner);
    setGameHistory(prev => [...prev, gameRecord]);

    // 更新玩家統計
    const updatedPlayers = updatePlayerStats(players, gameRecord);
    setPlayers(updatedPlayers);

    // 將場上玩家移到排隊區末尾
    const finishedPlayers = [...court.teamA, ...court.teamB];
    console.log('📝 結束比賽的玩家:', finishedPlayers.map(id => 
      players.find(p => p.id === id)?.name || id
    ));

    // 先清空場地
    setCourts(prev => prev.map(c => 
      c.id === courtId 
        ? { ...c, teamA: [], teamB: [], isGameActive: false, gameTime: 0, gameResult: winner }
        : c
    ));

    // 將完賽玩家加到排隊區末尾
    setWaitingQueue(prev => {
      const newQueue = [...prev, ...finishedPlayers];
      console.log('📋 更新排隊區（加入完賽玩家）:', { 
        before: prev.length, 
        after: newQueue.length,
        added: finishedPlayers.length 
      });
      
      return newQueue;
    });

    // 修正：確保自動補位在狀態更新後執行
    if (autoQueue) {
      console.log('🚀 啟用自動補位，準備執行');
      
      // 使用更長的延遲確保所有狀態更新完成
      setTimeout(() => {
        setWaitingQueue(currentQueue => {
          console.log('📊 檢查自動補位條件:', { 
            queueLength: currentQueue.length, 
            required: DEFAULT_SETTINGS.playersPerGame 
          });
          
          if (currentQueue.length >= DEFAULT_SETTINGS.playersPerGame) {
            console.log('⏰ 執行自動補位');
            
            // 直接在這裡執行補位邏輯，避免狀態競爭
            const nextPlayers = currentQueue.slice(0, DEFAULT_SETTINGS.playersPerGame);
            const teamA = [nextPlayers[0], nextPlayers[1]];
            const teamB = [nextPlayers[2], nextPlayers[3]];
            
            console.log('✅ 自動分隊:', { 
              teamA: teamA.map(id => updatedPlayers.find(p => p.id === id)?.name || id),
              teamB: teamB.map(id => updatedPlayers.find(p => p.id === id)?.name || id)
            });
            
            // 更新場地
            setCourts(prevCourts => prevCourts.map(c => 
              c.id === courtId 
                ? { ...c, teamA, teamB }
                : c
            ));
            
            // 移除已分配的玩家
            const remainingQueue = currentQueue.slice(DEFAULT_SETTINGS.playersPerGame);
            console.log('✅ 自動補位完成，剩餘排隊:', remainingQueue.length);
            
            return remainingQueue;
          } else {
            console.log('⏹️ 排隊人數不足，跳過自動補位');
            return currentQueue;
          }
        });
      }, 200); // 增加延遲時間確保穩定性
    } else {
      console.log('⏹️ 自動補位未啟用');
    }

  }, [courts, players, autoQueue, setCourts, setPlayers, setWaitingQueue, setGameHistory]);

  // 修正：快速補位 - 確保功能正常
  const quickFillCourt = useCallback((courtId) => {
    console.log('⚡ 快速補位請求:', { courtId, waitingQueueLength: waitingQueue.length });
    
    const targetCourt = courts.find(c => c.id === courtId);
    if (!targetCourt) {
      alert('找不到目標場地');
      return;
    }

    const currentPlayersInCourt = targetCourt.teamA.length + targetCourt.teamB.length;
    if (currentPlayersInCourt > 0) {
      alert('此場地已有玩家，請先清空場地或使用替換功能');
      return;
    }

    if (waitingQueue.length >= DEFAULT_SETTINGS.playersPerGame) {
      const success = autoFillCourt(courtId);
      if (success) {
        console.log('✅ 快速補位成功');
      } else {
        alert('快速補位失敗，請重試');
      }
    } else {
      alert(`排隊區人數不足，需要4人但只有${waitingQueue.length}人`);
    }
  }, [waitingQueue.length, autoFillCourt, courts]);

  // 重置所有人員位置
  const resetAllPositions = useCallback(() => {
    const allPlayerIds = players.map(p => p.id);
    setWaitingQueue(allPlayerIds);
    setCourts(prev => prev.map(court => ({ ...court, teamA: [], teamB: [] })));
  }, [players, setWaitingQueue, setCourts]);

  // 修正：自動分配到所有場地 - 確保正確執行
  const autoFillAllCourts = useCallback(() => {
    // 找出所有真正空的場地
    const emptyCourts = courts.filter(court => {
      const totalPlayers = court.teamA.length + court.teamB.length;
      return totalPlayers === 0 && !court.isGameActive;
    });

    if (emptyCourts.length === 0) {
      alert('沒有空場地需要填滿');
      return;
    }

    const requiredPlayers = emptyCourts.length * DEFAULT_SETTINGS.playersPerGame;
    if (waitingQueue.length < requiredPlayers) {
      alert(`排隊區人數不足。需要 ${requiredPlayers} 人，但只有 ${waitingQueue.length} 人。`);
      return;
    }

    console.log('🏟️ 開始自動填滿所有場地:', { 
      emptyCourts: emptyCourts.length, 
      requiredPlayers,
      availablePlayers: waitingQueue.length
    });

    // 按排隊順序為每個空場地分配玩家
    let playersToAssign = [...waitingQueue];
    const courtUpdates = [];

    emptyCourts.forEach((court, index) => {
      if (playersToAssign.length >= DEFAULT_SETTINGS.playersPerGame) {
        const courtPlayers = playersToAssign.slice(0, DEFAULT_SETTINGS.playersPerGame);
        
        // 保持排隊順序：前兩人為A隊，後兩人為B隊
        const teamA = [courtPlayers[0], courtPlayers[1]];
        const teamB = [courtPlayers[2], courtPlayers[3]];
        
        console.log(`🏟️ 場地 ${court.name} 分配:`, {
          teamA: teamA.map(id => players.find(p => p.id === id)?.name || id),
          teamB: teamB.map(id => players.find(p => p.id === id)?.name || id)
        });
        
        courtUpdates.push({
          courtId: court.id,
          teamA,
          teamB
        });
        
        // 從待分配列表中移除已分配的玩家
        playersToAssign = playersToAssign.slice(DEFAULT_SETTINGS.playersPerGame);
      }
    });

    // 一次性更新所有場地
    setCourts(prev => prev.map(court => {
      const update = courtUpdates.find(u => u.courtId === court.id);
      if (update) {
        return {
          ...court,
          teamA: update.teamA,
          teamB: update.teamB
        };
      }
      return court;
    }));

    // 更新排隊區，移除已分配的玩家
    setWaitingQueue(playersToAssign);

    console.log(`✅ 成功為 ${courtUpdates.length} 個場地分配了玩家`);
  }, [courts, waitingQueue, players, setCourts, setWaitingQueue]);

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