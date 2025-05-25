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

  // 移動玩家
  const movePlayer = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    const gameState = { waitingQueue, restArea, courts };
    const sourceLocation = findPlayerLocation(playerId, gameState);
    if (!sourceLocation) return;

    // 如果有目標玩家，執行互換
    if (targetPlayerId) {
      const targetLocation_orig = findPlayerLocation(targetPlayerId, gameState);
      if (!targetLocation_orig) return;

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
          setWaitingQueue(prev => [...prev, playerId]);
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
          setWaitingQueue(prev => [...prev, targetPlayerId]);
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
      
      return;
    }

    // 普通移動
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
    }
  }, [waitingQueue, restArea, courts, setWaitingQueue, setRestArea, setCourts]);

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
    movePlayer
  };
};