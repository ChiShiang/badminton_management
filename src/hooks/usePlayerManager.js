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

  // 從指定位置移除玩家
  const removePlayerFromLocation = useCallback((playerId, location) => {
    if (location.type === 'waiting') {
      setWaitingQueue(prev => prev.filter(id => id !== playerId));
    } else if (location.type === 'rest') {
      setRestArea(prev => prev.filter(id => id !== playerId));
    } else if (location.type === 'court') {
      setCourts(prev => prev.map(court => 
        court.id === location.courtId 
          ? { ...court, [location.team]: court[location.team].filter(id => id !== playerId) }
          : court
      ));
    }
  }, [setWaitingQueue, setRestArea, setCourts]);

  // 添加玩家到指定位置
  const addPlayerToLocation = useCallback((playerId, targetLocation) => {
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
            throw new Error('該隊伍已滿');
          }
        }
        return court;
      }));
    }
  }, [setWaitingQueue, setRestArea, setCourts]);

  // 智能玩家互換邏輯
  const swapPlayers = useCallback((playerId1, playerId2) => {
    const gameState = { waitingQueue, restArea, courts };
    const location1 = findPlayerLocation(playerId1, gameState);
    const location2 = findPlayerLocation(playerId2, gameState);
    
    if (!location1 || !location2) {
      console.warn('無法找到玩家位置');
      return false;
    }

    try {
      // 創建臨時狀態來測試交換是否可行
      // let tempSuccess = true;
      
      // 同時移除兩個玩家
      removePlayerFromLocation(playerId1, location1);
      removePlayerFromLocation(playerId2, location2);

      // 立即嘗試交換位置
      try {
        addPlayerToLocation(playerId1, location2);
        addPlayerToLocation(playerId2, location1);
        return true;
      } catch (error) {
        // 如果交換失敗，恢復原位置
        console.warn('交換失敗，恢復原位置:', error.message);
        addPlayerToLocation(playerId1, location1);
        addPlayerToLocation(playerId2, location2);
        return false;
      }
    } catch (error) {
      console.error('交換操作失敗:', error);
      return false;
    }
  }, [waitingQueue, restArea, courts, removePlayerFromLocation, addPlayerToLocation]);

  // 移動玩家（包含替換邏輯）
  const movePlayer = useCallback((playerId, targetLocation, targetPlayerId = null) => {
    const gameState = { waitingQueue, restArea, courts };
    const sourceLocation = findPlayerLocation(playerId, gameState);
    
    if (!sourceLocation) {
      console.warn('無法找到源玩家位置');
      return false;
    }

    // 如果有目標玩家，執行互換
    if (targetPlayerId) {
      return swapPlayers(playerId, targetPlayerId);
    }

    // 檢查目標位置是否已滿
    let isTargetFull = false;
    if (targetLocation.type === 'court') {
      const targetCourt = courts.find(c => c.id === targetLocation.courtId);
      if (targetCourt) {
        const targetTeam = targetCourt[targetLocation.team];
        isTargetFull = targetTeam.length >= DEFAULT_SETTINGS.maxPlayersPerTeam;
      }
    }

    // 如果目標位置已滿，返回false讓UI處理替換選擇
    if (isTargetFull) {
      return false;
    }

    try {
      // 普通移動
      removePlayerFromLocation(playerId, sourceLocation);
      addPlayerToLocation(playerId, targetLocation);
      return true;
    } catch (error) {
      // 如果移動失敗，恢復原位置
      console.warn('移動失敗，恢復原位置:', error.message);
      try {
        addPlayerToLocation(playerId, sourceLocation);
      } catch (restoreError) {
        console.error('恢復原位置失敗:', restoreError);
      }
      return false;
    }
  }, [waitingQueue, restArea, courts, removePlayerFromLocation, addPlayerToLocation, swapPlayers]);

  // 替換玩家（新增函數，專門處理替換邏輯）
  const replacePlayer = useCallback((newPlayerId, targetPlayerId) => {
    const gameState = { waitingQueue, restArea, courts };
    const newPlayerLocation = findPlayerLocation(newPlayerId, gameState);
    const targetPlayerLocation = findPlayerLocation(targetPlayerId, gameState);
    
    if (!newPlayerLocation || !targetPlayerLocation) {
      console.warn('無法找到玩家位置');
      return false;
    }

    try {
      // 移除兩個玩家
      removePlayerFromLocation(newPlayerId, newPlayerLocation);
      removePlayerFromLocation(targetPlayerId, targetPlayerLocation);
      
      // 將新玩家放到目標位置，將目標玩家放到新玩家的原位置
      addPlayerToLocation(newPlayerId, targetPlayerLocation);
      addPlayerToLocation(targetPlayerId, newPlayerLocation);
      
      return true;
    } catch (error) {
      console.error('替換操作失敗:', error);
      // 嘗試恢復原狀態
      try {
        addPlayerToLocation(newPlayerId, newPlayerLocation);
        addPlayerToLocation(targetPlayerId, targetPlayerLocation);
      } catch (restoreError) {
        console.error('恢復原狀態失敗:', restoreError);
      }
      return false;
    }
  }, [waitingQueue, restArea, courts, removePlayerFromLocation, addPlayerToLocation]);

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
    replacePlayer
  };
};