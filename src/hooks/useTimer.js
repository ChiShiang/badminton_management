import { useEffect, useCallback } from 'react';

export const useTimer = (courts, setCourts) => {
  // 計時器更新邏輯
  const updateTimers = useCallback(() => {
    setCourts(prevCourts => 
      prevCourts.map(court => {
        let newCourt = { ...court };
        
        // 熱身計時器
        if (court.isWarmupActive && court.warmupTime > 0) {
          newCourt.warmupTime = Math.max(0, court.warmupTime - 1);
          if (newCourt.warmupTime === 0) {
            newCourt.isWarmupActive = false;
          }
        }
        
        // 比賽計時器
        if (court.isGameActive) {
          newCourt.gameTime = court.gameTime + 1;
        }
        
        return newCourt;
      })
    );
  }, [setCourts]);

  // 啟動計時器
  useEffect(() => {
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [updateTimers]);

  // 設定熱身時間
  const setWarmupTime = useCallback((courtId, minutes) => {
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            warmupTime: minutes * 60, 
            warmupOriginalTime: minutes * 60,
            isWarmupActive: false 
          }
        : court
    ));
  }, [setCourts]);

  // 開始熱身
  const startWarmup = useCallback((courtId) => {
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { ...court, isWarmupActive: true }
        : court
    ));
  }, [setCourts]);

  // 暫停熱身
  const pauseWarmup = useCallback((courtId) => {
    setCourts(courts => courts.map(court => 
      court.id === courtId 
        ? { ...court, isWarmupActive: false }
        : court
    ));
  }, [setCourts]);

  // 重置熱身
  const resetWarmup = useCallback((courtId) => {
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