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

  // 獲取可用玩家列表
  const availablePlayers = useMemo(() => {
    return players.filter(p => 
      !waitingQueue.includes(p.id) && 
      !restArea.includes(p.id) && 
      !courts.some(court => court.teamA.includes(p.id) || court.teamB.includes(p.id))
    );
  }, [players, waitingQueue, restArea, courts]);

  // 新增單個玩家
  const addPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
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
    }
  }, [newPlayerName, newPlayerSkillLevel, setPlayers, setWaitingQueue]);

  // 批次新增玩家
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

  // 刪除玩家
  const deletePlayer = useCallback((playerId) => {
    if (window.confirm('確定要刪除此玩家嗎？')) {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      setWaitingQueue(prev => prev.filter(id => id !== playerId));
      setRestArea(prev => prev.filter(id => id !== playerId));
      
      setCourts(prev => prev.map(court => ({
        ...court,
        teamA: court.teamA.filter(id => id !== playerId),
        teamB: court.teamB.filter(id => id !== playerId)
      })));
    }
  }, [setPlayers, setWaitingQueue, setRestArea, setCourts]);

  // 開始編輯玩家
  const startEditPlayer = useCallback((player) => {
    setEditingPlayer(player.id);
    setEditPlayerName(player.name);
    setEditPlayerSkillLevel(player.skillLevel);
  }, []);

  // 保存玩家信息
  const savePlayerInfo = useCallback(() => {
    if (editPlayerName.trim()) {
      setPlayers(prev => prev.map(p => 
        p.id === editingPlayer 
          ? { ...p, name: editPlayerName.trim(), skillLevel: editPlayerSkillLevel }
          : p
      ));
    }
    setEditingPlayer(null);
    setEditPlayerName('');
    setEditPlayerSkillLevel(DEFAULT_SETTINGS.defaultSkillLevel);
  }, [editingPlayer, editPlayerName, editPlayerSkillLevel, setPlayers]);

  // 取消編輯玩家
  const cancelEditPlayer = useCallback(() => {
    setEditingPlayer(null);
    setEditPlayerName('');
    setEditPlayerSkillLevel(DEFAULT_SETTINGS.defaultSkillLevel);
  }, []);

  // 移動玩家 - 修正版本，添加返回值
  const movePlayer = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    try {
      const gameState = { waitingQueue, restArea, courts };
      const sourceLocation = findPlayerLocation(playerId, gameState);
      
      if (!sourceLocation) {
        console.error('找不到玩家當前位置');
        return false;
      }

      // 如果有目標玩家，執行互換
      if (targetPlayerId) {
        const targetLocation_orig = findPlayerLocation(targetPlayerId, gameState);
        if (!targetLocation_orig) {
          console.error('找不到目標玩家位置');
          return false;
        }

        // 記錄原始位置索引（重要！保持順序）
        let sourceIndex = -1;
        let targetIndex = -1;

        if (sourceLocation.type === 'waiting') {
          sourceIndex = waitingQueue.indexOf(playerId);
        }
        if (targetLocation_orig.type === 'waiting') {
          targetIndex = waitingQueue.indexOf(targetPlayerId);
        }

        // 執行互換 - 保持順序
        if (sourceLocation.type === 'waiting' && targetLocation_orig.type === 'waiting') {
          // 排隊區內互換 - 保持順序
          setWaitingQueue(prev => {
            const newQueue = [...prev];
            if (sourceIndex !== -1 && targetIndex !== -1) {
              // 直接交換位置
              [newQueue[sourceIndex], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[sourceIndex]];
            }
            return newQueue;
          });
          return true;
        } else if (sourceLocation.type === 'court' && targetLocation_orig.type === 'court') {
          // 場地間互換 - 保持位置
          setCourts(prev => prev.map(court => {
            const newCourt = { ...court };
            
            // 處理源場地
            if (court.id === sourceLocation.courtId) {
              if (sourceLocation.team === 'teamA') {
                const idx = court.teamA.indexOf(playerId);
                if (idx !== -1 && court.id === targetLocation_orig.courtId && targetLocation_orig.team === 'teamA') {
                  // 同場地同隊伍
                  const targetIdx = court.teamA.indexOf(targetPlayerId);
                  if (targetIdx !== -1) {
                    newCourt.teamA = [...court.teamA];
                    [newCourt.teamA[idx], newCourt.teamA[targetIdx]] = [newCourt.teamA[targetIdx], newCourt.teamA[idx]];
                  }
                } else {
                  newCourt.teamA = court.teamA.map(id => id === playerId ? targetPlayerId : id);
                }
              } else {
                const idx = court.teamB.indexOf(playerId);
                if (idx !== -1 && court.id === targetLocation_orig.courtId && targetLocation_orig.team === 'teamB') {
                  // 同場地同隊伍
                  const targetIdx = court.teamB.indexOf(targetPlayerId);
                  if (targetIdx !== -1) {
                    newCourt.teamB = [...court.teamB];
                    [newCourt.teamB[idx], newCourt.teamB[targetIdx]] = [newCourt.teamB[targetIdx], newCourt.teamB[idx]];
                  }
                } else {
                  newCourt.teamB = court.teamB.map(id => id === playerId ? targetPlayerId : id);
                }
              }
            }
            
            // 處理目標場地（如果不同）
            if (court.id === targetLocation_orig.courtId && court.id !== sourceLocation.courtId) {
              if (targetLocation_orig.team === 'teamA') {
                newCourt.teamA = court.teamA.map(id => id === targetPlayerId ? playerId : id);
              } else {
                newCourt.teamB = court.teamB.map(id => id === targetPlayerId ? playerId : id);
              }
            }
            
            return newCourt;
          }));
          return true;
        } else {
          // 不同類型位置間的互換
          // 先移除兩個玩家
          setWaitingQueue(prev => prev.filter(id => id !== playerId && id !== targetPlayerId));
          setRestArea(prev => prev.filter(id => id !== playerId && id !== targetPlayerId));
          setCourts(prev => prev.map(court => ({
            ...court,
            teamA: court.teamA.filter(id => id !== playerId && id !== targetPlayerId),
            teamB: court.teamB.filter(id => id !== playerId && id !== targetPlayerId)
          })));

          // 交換位置
          setTimeout(() => {
            // 將playerId放到targetPlayerId的原位置
            if (targetLocation_orig.type === 'waiting') {
              setWaitingQueue(prev => {
                const newQueue = [...prev];
                newQueue.splice(targetIndex !== -1 ? targetIndex : prev.length, 0, playerId);
                return newQueue;
              });
            } else if (targetLocation_orig.type === 'rest') {
              setRestArea(prev => [...prev, playerId]);
            } else if (targetLocation_orig.type === 'court') {
              setCourts(prev => prev.map(court => 
                court.id === targetLocation_orig.courtId 
                  ? { ...court, [targetLocation_orig.team]: [...court[targetLocation_orig.team], playerId] }
                  : court
              ));
            }

            // 將targetPlayerId放到playerId的原位置
            if (sourceLocation.type === 'waiting') {
              setWaitingQueue(prev => {
                const newQueue = [...prev];
                newQueue.splice(sourceIndex !== -1 ? sourceIndex : prev.length, 0, targetPlayerId);
                return newQueue;
              });
            } else if (sourceLocation.type === 'rest') {
              setRestArea(prev => [...prev, targetPlayerId]);
            } else if (sourceLocation.type === 'court') {
              setCourts(prev => prev.map(court => 
                court.id === sourceLocation.courtId 
                  ? { ...court, [sourceLocation.team]: [...court[sourceLocation.team], targetPlayerId] }
                  : court
              ));
            }
          }, 10);
          return true;
        }
      }

      // 普通移動（非互換）
      // 從原位置移除
      if (sourceLocation.type === 'waiting') {
        setWaitingQueue(prev => prev.filter(id => id !== playerId));
      } else if (sourceLocation.type === 'rest') {
        setRestArea(prev => prev.filter(id => id !== playerId));
      } else if (sourceLocation.type === 'court') {
        setCourts(prev => prev.map(court => 
          court.id === sourceLocation.courtId 
            ? { ...court, [sourceLocation.team]: court[sourceLocation.team].filter(id => id !== playerId) }
            : court
        ));
      }

      // 添加到新位置
      if (targetLocation.type === 'waiting') {
        setWaitingQueue(prev => [...prev, playerId]);
        return true;
      } else if (targetLocation.type === 'rest') {
        setRestArea(prev => [...prev, playerId]);
        return true;
      } else if (targetLocation.type === 'court') {
        let moveSuccess = false;
        setCourts(prev => prev.map(court => {
          if (court.id === targetLocation.courtId) {
            const targetTeam = targetLocation.team;
            const currentTeam = court[targetTeam];
            
            if (currentTeam.length < DEFAULT_SETTINGS.maxPlayersPerTeam) {
              moveSuccess = true;
              return {
                ...court,
                [targetTeam]: [...currentTeam, playerId]
              };
            } else {
              alert('該隊伍已滿（最多2人）');
              // 放回原位置
              setTimeout(() => {
                if (sourceLocation.type === 'waiting') {
                  setWaitingQueue(prev => [...prev, playerId]);
                } else if (sourceLocation.type === 'rest') {
                  setRestArea(prev => [...prev, playerId]);
                } else if (sourceLocation.type === 'court') {
                  setCourts(prev => prev.map(c => 
                    c.id === sourceLocation.courtId 
                      ? { ...c, [sourceLocation.team]: [...c[sourceLocation.team], playerId] }
                      : c
                  ));
                }
              }, 10);
              return court;
            }
          }
          return court;
        }));
        return moveSuccess;
      }

      return false;
    } catch (error) {
      console.error('移動玩家時發生錯誤:', error);
      return false;
    }
  }, [waitingQueue, restArea, courts, setWaitingQueue, setRestArea, setCourts]);

  // 玩家互換功能 - 移到 movePlayer 之後
  const swapPlayers = useCallback((playerId1, playerId2) => {
    try {
      const gameState = { waitingQueue, restArea, courts };
      const location1 = findPlayerLocation(playerId1, gameState);
      const location2 = findPlayerLocation(playerId2, gameState);
      
      if (!location1 || !location2) {
        console.error('無法找到玩家位置');
        return false;
      }

      // 執行互換 - 使用 targetPlayerId 參數
      return movePlayer(playerId1, location2, playerId2);
    } catch (error) {
      console.error('互換玩家時發生錯誤:', error);
      return false;
    }
  }, [waitingQueue, restArea, courts, movePlayer]);

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
    swapPlayers // 新增互換方法
  };
};