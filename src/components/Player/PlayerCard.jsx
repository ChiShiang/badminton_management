import React from 'react';
import { SKILL_LEVELS, CARD_SIZES } from '../../utils/constants';
import { calculateWinRate } from '../../utils/gameUtils';

const PlayerCard = React.memo(({ 
  player, 
  size = 'normal', 
  onClick = null, 
  isClickable = false 
}) => {
  const skillInfo = SKILL_LEVELS[player.skillLevel];
  const winRate = calculateWinRate(player);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 select-none ${CARD_SIZES[size]} ${
        isClickable 
          ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg' 
          : 'border-gray-200'
      }`}
      style={{ minWidth: size === 'small' ? '90px' : '110px' }}
      onClick={onClick}
    >
      <div className="font-semibold text-gray-800 truncate">
        {player.name}
      </div>
      <div className={`text-xs px-1 py-0.5 rounded mb-1 ${skillInfo.color}`}>
        Lv.{player.skillLevel} {skillInfo.name}
      </div>
      <div className="text-gray-500 text-xs">
        勝率: {winRate}%
      </div>
      {size !== 'small' && (
        <div className="text-gray-400 text-xs">
          {player.wins}勝 {player.losses}敗
        </div>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;