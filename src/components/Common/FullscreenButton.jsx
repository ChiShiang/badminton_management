import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 切換全螢幕
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 監聽全螢幕狀態變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <button
      onClick={toggleFullscreen}
      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
      title="全螢幕模式"
    >
      {isFullscreen ? (
        <>
          <Minimize className="w-4 h-4 mr-2" />
          退出全螢幕
        </>
      ) : (
        <>
          <Maximize className="w-4 h-4 mr-2" />
          全螢幕
        </>
      )}
    </button>
  );
};

export default FullscreenButton;