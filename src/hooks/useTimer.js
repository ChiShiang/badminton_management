import { useEffect, useCallback, useRef } from 'react';

export const useTimer = (courts, setCourts) => {
  // 使用 useRef 來存儲計時器狀態，避免頻繁更新 courts
  const timersRef = useRef({});

  // 初始化計時器引用
  useEffect(() => {
    courts.forEach(court => {
      if (!timersRef.current[court.id]) {
        timersRef.current[court.id] = {
          warmupTime: court.warmupTime,
          gameTime: court.gameTime,
          isWarmupActive: court.isWarmupActive,
          isGameActive: court.isGameActive,
          warmupOriginalTime: court.warmupOriginalTime
        };
      }
    });
  }, [courts]);

  // 計時器更新邏輯 - 只在必要時更新狀態
  const updateTimers = useCallback(() => {
    let needsUpdate = false;
    const updatedCourts = courts.map(court => {
      const timerState = timersRef.current[court.id];
      if (!timerState) return court;

      let newCourt = { ...court };
      let hasChanged = false;

      // 熱身計時器
      if (timerState.isWarmupActive && timerState.warmupTime > 0) {
        timerState.warmupTime = Math.max(0, timerState.warmupTime - 1);
        newCourt.warmupTime = timerState.warmupTime;
        hasChanged = true;
        
        if (timerState.warmupTime === 0) {
          timerState.isWarmupActive = false;
          newCourt.isWarmupActive = false;
        }
      }
      
      // 比賽計時器
      if (timerState.isGameActive) {
        timerState.gameTime = timerState.gameTime + 1;
        newCourt.gameTime = timerState.gameTime;
        hasChanged = true;
      }

      if (hasChanged) {
        needsUpdate = true;
      }

      return newCourt;
    });

    // 只有在有變化時才更新狀態
    if (needsUpdate) {
      setCourts(updatedCourts);
    }
  }, [courts, setCourts]);

  // 啟動計時器
  useEffect(() => {
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [updateTimers]);

  // 設定熱身時間 - 同步更新 ref 和狀態
  const setWarmupTime = useCallback((courtId, minutes) => {
    const time = minutes * 60;
    
    // 更新 ref
    if (timersRef.current[courtId]) {
      timersRef.current[courtId].warmupTime = time;
      timersRef.current[courtId].warmupOriginalTime = time;
      timersRef.current[courtId].isWarmupActive = false;
    }

    // 更新狀態
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            warmupTime: time, 
            warmupOriginalTime: time,
            isWarmupActive: false 
          }
        : court
    ));
  }, [setCourts]);

  // 開始熱身 - 同步更新 ref 和狀態
  const startWarmup = useCallback((courtId) => {
    // 更新 ref
    if (timersRef.current[courtId]) {
      timersRef.current[courtId].isWarmupActive = true;
    }

    // 更新狀態
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { ...court, isWarmupActive: true }
        : court
    ));
  }, [setCourts]);

  // 暫停熱身 - 同步更新 ref 和狀態
  const pauseWarmup = useCallback((courtId) => {
    // 更新 ref
    if (timersRef.current[courtId]) {
      timersRef.current[courtId].isWarmupActive = false;
    }

    // 更新狀態
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { ...court, isWarmupActive: false }
        : court
    ));
  }, [setCourts]);

  // 重置熱身 - 同步更新 ref 和狀態
  const resetWarmup = useCallback((courtId) => {
    // 更新 ref
    if (timersRef.current[courtId]) {
      timersRef.current[courtId].warmupTime = timersRef.current[courtId].warmupOriginalTime;
      timersRef.current[courtId].isWarmupActive = false;
    }

    // 更新狀態
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            warmupTime: court.warmupOriginalTime,
            isWarmupActive: false 
          }
        : court
    ));
  }, [setCourts]);

  return {
    setWarmupTime,
    startWarmup,
    pauseWarmup,
    resetWarmup
  };
};