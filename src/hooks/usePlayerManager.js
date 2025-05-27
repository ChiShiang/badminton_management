import { useState, useCallback, useMemo } from 'react';
import { generateId, findPlayerLocation } from '../utils/gameUtils';
import { DEFAULT_SETTINGS } from '../utils/constants';

export const usePlayerManager = (players, setPlayers, waitingQueue, setWaitingQueue, restArea, setRestArea, courts, setCourts) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkillLevel, setNewPlayerSkillLevel] = useState(DEFAULT_SETTINGS.defaultSkillLevel);
  const [batchPlayerCount, setBatchPlayerCount] = useState(10);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerSkillLevel, setEditPlayerSkillLevel] = useState(DEFAULT_SETTINGS.defaultSkillLevel);

  // 優化：僅基於玩家位置相關的狀態計算可用玩家
  const availablePlayers = useMemo(() => {
    const playersInCourts = new Set();
    courts.forEach(court => {
      if (court.teamA) court.teamA.forEach(id => playersInCourts.add(id));
      if (court.teamB) court.teamB.forEach(id => playersInCourts.add(id));
    });

    return players.filter(p => 
      !waitingQueue.includes(p.id) && 
      !restArea.includes(p.id) && 
      !playersInCourts.has(p.id)
    );
  }, [players, waitingQueue, restArea, courts.map(c => c.teamA.concat(c.teamB).join(',')).join('|')]);

  // 清理玩家在所有位置的重複
  const cleanupPlayerDuplicates = useCallback((playerId) => {
    setWaitingQueue(prev => prev.filter(id => id !== playerId));
    setRestArea(prev => prev.filter(id => id !== playerId));
    setCourts(prev => prev.map(court => ({
      ...court,
      teamA: court.teamA.filter(id => id !== playerId),
      teamB: court.teamB.filter(id => id !== playerId)
    })));
  }, [setWaitingQueue, setRestArea, setCourts]);

  // 新增玩家函數
  const addPlayer = useCallback(() => {
    if (!newPlayerName.trim()) return;

    const newPlayer = {
      id: generateId(),
      name: newPlayerName.trim(),
      wins: 0,
      losses: 0,
      totalGames: 0,
      skillLevel: newPlayerSkillLevel
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    setWaitingQueue(prev => [...prev, newPlayer.id]);
    setNewPlayerName('');
  }, [newPlayerName, newPlayerSkillLevel, setPlayers, setWaitingQueue]);

  // 批次新增函數
  const addBatchPlayers = useCallback(() => {
    const newPlayers = [];
    const startIndex = players.length + 1;
    
    for (let i = 0; i < batchPlayerCount; i++) {
      const newPlayer = {
        id: generateId() + i,
        name: `Player-${startIndex + i}`,
        wins: 0,
        losses: 0,
        totalGames: 0,
        skillLevel: newPlayerSkillLevel
      };
      newPlayers.push(newPlayer);
    }
    
    setPlayers(prev => [...prev, ...newPlayers]);
    setWaitingQueue(prev => [...prev, ...newPlayers.map(p => p.id)]);
  }, [players.length, batchPlayerCount, newPlayerSkillLevel, setPlayers, setWaitingQueue]);

  // 刪除玩家函數
  const deletePlayer = useCallback((playerId) => {
    if (!window.confirm('確定要刪除此玩家嗎？')) return;
    
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    cleanupPlayerDuplicates(playerId);
  }, [setPlayers, cleanupPlayerDuplicates]);

  // 編輯相關函數
  const startEditPlayer = useCallback((player) => {
    setEditingPlayer(player.id);
    setEditPlayerName(player.name);
    setEditPlayerSkillLevel(player.skillLevel);
  }, []);

  const savePlayerInfo = useCallback(() => {
    if (!editPlayerName.trim()) return;
    
    setPlayers(prev => prev.map(p => 
      p.id === editingPlayer 
        ? { ...p, name: editPlayerName.trim(), skillLevel: editPlayerSkillLevel }
        : p
    ));
    
    setEditingPlayer(null);
    setEditPlayerName('');
    setEditPlayerSkillLevel(DEFAULT_SETTINGS.defaultSkillLevel);
  }, [editingPlayer, editPlayerName, editPlayerSkillLevel, setPlayers]);

  const cancelEditPlayer = useCallback(() => {
    setEditingPlayer(null);
    setEditPlayerName('');
    setEditPlayerSkillLevel(DEFAULT_SETTINGS.defaultSkillLevel);
  }, []);

  // 修正3：完全重寫移動玩家函數，解決跨區域排序問題
  const movePlayer = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) {
        console.error('找不到要移動的玩家:', playerId);
        return false;
      }

      console.log('🎯 移動玩家:', { 
        playerId, 
        playerName: player.name,
        targetLocation, 
        targetPlayerId,
        targetPlayerName: targetPlayerId ? players.find(p => p.id === targetPlayerId)?.name : null
      });

      // 如果有目標玩家，執行互換
      if (targetPlayerId) {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) {
          console.error('找不到目標玩家:', targetPlayerId);
          return false;
        }

        const gameState = { waitingQueue, restArea, courts };
        const sourceLocation = findPlayerLocation(playerId, gameState);
        const targetLocation_orig = findPlayerLocation(targetPlayerId, gameState);

        console.log('📍 位置信息:', { 
          source: { playerId, location: sourceLocation },
          target: { targetPlayerId, location: targetLocation_orig }
        });

        if (!sourceLocation || !targetLocation_orig) {
          console.error('無法找到玩家位置');
          return false;
        }

        // 排隊區內的互換
        if (sourceLocation.type === 'waiting' && targetLocation_orig.type === 'waiting') {
          console.log('🔄 排隊區內互換');
          
          setWaitingQueue(prev => {
            const newQueue = [...prev];
            const sourceIndex = newQueue.indexOf(playerId);
            const targetIndex = newQueue.indexOf(targetPlayerId);
            
            if (sourceIndex !== -1 && targetIndex !== -1) {
              [newQueue[sourceIndex], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[sourceIndex]];
              console.log('✅ 排隊區互換完成');
              return newQueue;
            }
            return prev;
          });
          
          return true;
        }

        // 修正3：跨區域互換 - 關鍵修正，保持排隊位置
        console.log('🔄 跨區域互換，保持原始位置');
        
        // 記錄排隊區中的原始位置索引
        let sourceQueueIndex = -1;
        let targetQueueIndex = -1;
        
        if (sourceLocation.type === 'waiting') {
          sourceQueueIndex = waitingQueue.indexOf(playerId);
        }
        if (targetLocation_orig.type === 'waiting') {
          targetQueueIndex = waitingQueue.indexOf(targetPlayerId);
        }
        
        console.log('📊 記錄排隊位置:', { sourceQueueIndex, targetQueueIndex });

        // 清理兩個玩家的所有位置
        cleanupPlayerDuplicates(playerId);
        cleanupPlayerDuplicates(targetPlayerId);

        // 使用同步的方式重新分配位置，確保位置保持
        setTimeout(() => {
          // 將玩家1放到玩家2的原位置
          if (targetLocation_orig.type === 'waiting') {
            // 重要：如果目標位置是排隊區，使用原始索引插入
            setWaitingQueue(prev => {
              const newQueue = [...prev];
              if (targetQueueIndex >= 0 && targetQueueIndex < newQueue.length) {
                newQueue.splice(targetQueueIndex, 0, playerId);
              } else {
                newQueue.push(playerId);
              }
              console.log('✅ 玩家1放到排隊位置:', targetQueueIndex);
              return newQueue;
            });
          } else if (targetLocation_orig.type === 'rest') {
            setRestArea(prev => [...prev, playerId]);
          } else if (targetLocation_orig.type === 'court') {
            setCourts(prev => prev.map(court => {
              if (court.id === targetLocation_orig.courtId) {
                const targetTeam = targetLocation_orig.team;
                return {
                  ...court,
                  [targetTeam]: [...court[targetTeam], playerId]
                };
              }
              return court;
            }));
          }

          // 將玩家2放到玩家1的原位置
          if (sourceLocation.type === 'waiting') {
            // 重要：如果原位置是排隊區，使用原始索引插入
            setWaitingQueue(prev => {
              const newQueue = [...prev];
              if (sourceQueueIndex >= 0 && sourceQueueIndex < newQueue.length) {
                newQueue.splice(sourceQueueIndex, 0, targetPlayerId);
              } else {
                newQueue.push(targetPlayerId);
              }
              console.log('✅ 玩家2放到排隊位置:', sourceQueueIndex);
              return newQueue;
            });
          } else if (sourceLocation.type === 'rest') {
            setRestArea(prev => [...prev, targetPlayerId]);
          } else if (sourceLocation.type === 'court') {
            setCourts(prev => prev.map(court => {
              if (court.id === sourceLocation.courtId) {
                const targetTeam = sourceLocation.team;
                return {
                  ...court,
                  [targetTeam]: [...court[targetTeam], targetPlayerId]
                };
              }
              return court;
            }));
          }
        }, 50);

        return true;
      }

      // 普通移動（非互換）
      console.log('➡️ 普通移動');
      cleanupPlayerDuplicates(playerId);

      setTimeout(() => {
        if (targetLocation.type === 'waiting') {
          setWaitingQueue(prev => [...prev, playerId]);
        } else if (targetLocation.type === 'rest') {
          setRestArea(prev => [...prev, playerId]);
        } else if (targetLocation.type === 'court') {
          setCourts(prev => prev.map(court => {
            if (court.id === targetLocation.courtId) {
              const targetTeam = targetLocation.team;
              const currentTeam = court[targetTeam];
              
              if (currentTeam.length < DEFAULT_SETTINGS.maxPlayersPerTeam) {
                return {
                  ...court,
                  [targetTeam]: [...currentTeam, playerId]
                };
              } else {
                // 隊伍已滿，將玩家放回排隊區
                setTimeout(() => {
                  setWaitingQueue(prev => [...prev, playerId]);
                }, 20);
              }
            }
            return court;
          }));
        }
      }, 50);

      return true;
    } catch (error) {
      console.error('移動玩家時發生錯誤:', error);
      return false;
    }
  }, [players, waitingQueue, restArea, courts, cleanupPlayerDuplicates, setWaitingQueue, setRestArea, setCourts]);

  // 修正3：穩定化互換函數，特別優化排隊區邏輯
  const swapPlayers = useCallback((playerId1, playerId2) => {
    try {
      console.log('🔄 互換玩家請求:', { playerId1, playerId2 });
      
      const player1 = players.find(p => p.id === playerId1);
      const player2 = players.find(p => p.id === playerId2);
      
      if (!player1 || !player2) {
        console.error('❌ 找不到要互換的玩家');
        return false;
      }
      
      const gameState = { waitingQueue, restArea, courts };
      const location1 = findPlayerLocation(playerId1, gameState);
      const location2 = findPlayerLocation(playerId2, gameState);
      
      console.log('📍 玩家位置:', { 
        player1: { id: playerId1, name: player1.name, location: location1 },
        player2: { id: playerId2, name: player2.name, location: location2 }
      });
      
      if (!location1 || !location2) {
        console.error('❌ 無法找到玩家位置');
        return false;
      }

      // 如果兩個玩家都在排隊區，進行排隊區內的位置互換
      if (location1.type === 'waiting' && location2.type === 'waiting') {
        console.log('🔄 排隊區內互換');
        
        setWaitingQueue(prev => {
          const newQueue = [...prev];
          const index1 = newQueue.indexOf(playerId1);
          const index2 = newQueue.indexOf(playerId2);
          
          if (index1 !== -1 && index2 !== -1) {
            [newQueue[index1], newQueue[index2]] = [newQueue[index2], newQueue[index1]];
            console.log('✅ 排隊區互換完成');
            return newQueue;
          }
          return prev;
        });
        
        return true;
      }
      
      // 跨區域互換，使用movePlayer邏輯
      console.log('🔄 跨區域互換，使用movePlayer');
      return movePlayer(playerId1, location2, playerId2);
      
    } catch (error) {
      console.error('❌ 互換玩家時發生錯誤:', error);
      return false;
    }
  }, [waitingQueue, restArea, courts, movePlayer, setWaitingQueue, players]);

  return {
    // 狀態
    newPlayerName,
    setNewPlayerName,
    newPlayerSkillLevel,
    setNewPlayerSkillLevel,
    batchPlayerCount,
    setBatchPlayerCount,
    editingPlayer,
    editPlayerName,
    setEditPlayerName,
    editPlayerSkillLevel,
    setEditPlayerSkillLevel,
    availablePlayers,
    
    // 方法
    addPlayer,
    addBatchPlayers,
    deletePlayer,
    startEditPlayer,
    savePlayerInfo,
    cancelEditPlayer,
    movePlayer,
    swapPlayers,
    cleanupPlayerDuplicates
  };
};