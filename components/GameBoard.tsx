import React from 'react';
import { Tile, Player, TileType, VisualEffect } from '../types';
import { Building2, Landmark, DollarSign, Ban, Dices, Bot } from 'lucide-react';
import Dice3D from './Dice3D';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  currentPlayerId: string;
  upgradingTileId?: number | null;
  onRollDice?: () => void;
  isAiRolling?: boolean;
  visualEffects?: VisualEffect[];
  // New props for 3D dice logic
  diceValue?: number | null;
  isDiceRolling?: boolean;
  onDiceAnimationComplete?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
    tiles, 
    players, 
    currentPlayerId, 
    upgradingTileId, 
    onRollDice, 
    visualEffects = [],
    diceValue,
    isDiceRolling = false,
    onDiceAnimationComplete
}) => {
  const getGridStyle = (index: number) => {
    // 0  1  2  3  4
    // 15          5
    // 14          6
    // 13          7
    // 12 11 10 9  8
    if (index >= 0 && index <= 4) return { gridRow: 1, gridColumn: index + 1 };
    if (index >= 5 && index <= 7) return { gridRow: index - 3, gridColumn: 5 };
    if (index >= 8 && index <= 12) return { gridRow: 5, gridColumn: 5 - (index - 8) };
    if (index >= 13 && index <= 15) return { gridRow: 5 - (index - 12), gridColumn: 1 };
    return {};
  };

  const renderIcon = (type: TileType, name: string) => {
    if (type === TileType.START) return <span className="text-3xl filter drop-shadow">🏁</span>;
    if (type === TileType.BANK) return <DollarSign className="w-8 h-8 text-green-700 drop-shadow-sm" />;
    if (type === TileType.CHANCE) return <span className="text-3xl filter drop-shadow">❓</span>;
    if (type === TileType.JAIL) return <Ban className="w-8 h-8 text-gray-600 drop-shadow-sm" />;
    if (name.includes('东方明珠') || name.includes('中心')) return <Landmark className="w-8 h-8 text-red-700 drop-shadow-md" />;
    return <Building2 className="w-8 h-8 text-gray-600 opacity-60" />;
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHumanTurn = currentPlayer && !currentPlayer.isAi;
  const showDice = isDiceRolling || (diceValue !== null && diceValue !== undefined);

  // Background gradients for tile types
  const getTileBackground = (tile: Tile) => {
      if (tile.type === TileType.START) return 'bg-gradient-to-br from-green-100 to-green-300';
      if (tile.type === TileType.BANK) return 'bg-gradient-to-br from-yellow-100 to-yellow-300';
      if (tile.type === TileType.CHANCE) return 'bg-gradient-to-br from-indigo-100 to-indigo-300';
      if (tile.type === TileType.JAIL) return 'bg-gradient-to-br from-gray-200 to-gray-400';
      
      // Properties
      if (tile.color?.includes('pink')) return 'bg-gradient-to-br from-pink-100 to-pink-300';
      if (tile.color?.includes('blue')) return 'bg-gradient-to-br from-blue-100 to-blue-300';
      if (tile.color?.includes('purple')) return 'bg-gradient-to-br from-purple-100 to-purple-300';
      if (tile.color?.includes('orange')) return 'bg-gradient-to-br from-orange-100 to-orange-300';
      if (tile.color?.includes('red')) return 'bg-gradient-to-br from-red-100 to-red-300';
      
      return 'bg-white';
  };

  return (
    <div 
      className="relative w-full max-w-3xl aspect-square mx-auto p-4 rounded-[2rem] shadow-2xl border-8 border-white/50 ring-4 ring-blue-200 bg-cover bg-center transition-all duration-500"
      style={{
        // Using a high-quality stylized city map/illustration placeholder that matches the vibe
        backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop')`, // City skyline abstract
        backgroundBlendMode: 'overlay',
        backgroundColor: 'rgba(230, 242, 255, 0.85)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/40 to-white/60 rounded-[1.5rem] backdrop-blur-[2px]"></div>

      <div className="grid grid-cols-5 grid-rows-5 gap-3 h-full w-full relative z-10">
        {/* Center Logo Area & Button / Dice */}
        <div className="col-start-2 col-end-5 row-start-2 row-end-5 bg-white/70 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-white/60">
            
            {/* Title - Only show if dice is NOT rolling to reduce clutter */}
            {!showDice && (
              <>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-wider drop-shadow-sm mb-2">上海大冒险</h1>
                <p className="text-slate-500 font-bold mb-6 text-sm tracking-widest">MATH TYCOON</p>
                
                <div className={`mb-8 px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-colors duration-300 flex items-center
                  ${currentPlayer?.isAi ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                  当前回合: {currentPlayer?.name || '...'}
                </div>
              </>
            )}

            {/* Interaction Area */}
            <div className="z-10 w-full flex justify-center items-center relative" style={{ minHeight: '120px' }}>
                
                {/* 3D Dice - Always Rendered but hidden to preserve rotation state */}
                <div className={`transform transition-all duration-500 absolute inset-0 flex flex-col items-center justify-center
                   ${showDice ? 'opacity-100 scale-125 z-20' : 'opacity-0 scale-50 z-0 pointer-events-none'}`}>
                    <Dice3D 
                      value={diceValue || 1} 
                      isRolling={isDiceRolling} 
                      onComplete={onDiceAnimationComplete}
                    />
                    {!isDiceRolling && diceValue && (
                       <div className="mt-6 text-2xl font-black text-blue-600 animate-bounce">
                          {diceValue} 点!
                       </div>
                    )}
                </div>

                {/* Buttons / Status - Only shown when Dice is NOT shown */}
                <div className={`transition-all duration-300 ${!showDice ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    {currentPlayer?.isAi ? (
                        <div className="flex flex-col items-center justify-center h-20 w-52 bg-white/80 rounded-2xl shadow-lg border border-white/50 backdrop-blur animate-pulse">
                            <div className="flex items-center space-x-3 text-slate-500">
                                <Bot className="w-8 h-8" />
                                <span className="font-medium">准备投掷...</span>
                            </div>
                        </div>
                    ) : (
                        <button
                        onClick={onRollDice}
                        disabled={!isHumanTurn}
                        className={`
                            group relative flex items-center justify-center px-12 py-6 rounded-2xl transition-all duration-300
                            ${isHumanTurn 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-105 hover:shadow-2xl cursor-pointer animate-bounce-subtle' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'}
                        `}
                        >
                        <div className={`absolute inset-0 rounded-2xl bg-white transition-opacity ${isHumanTurn ? 'opacity-0 group-hover:opacity-20' : 'opacity-0'}`} />
                        <Dices className={`w-8 h-8 mr-3 ${isHumanTurn ? 'animate-spin-slow' : ''}`} />
                        <span className="text-2xl font-black tracking-widest">{isHumanTurn ? '掷骰子' : '等待中'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Tiles */}
        {tiles.map((tile) => {
            const style = getGridStyle(tile.id);
            // Filter out bankrupt players from rendering on the board
            const playerHere = players.filter(p => p.position === tile.id && !p.isBankrupt);
            const isUpgrading = tile.id === upgradingTileId;
            // Determine owner color class
            let ownerBorderClass = 'border-white/50';
            if (tile.owner === 'P1') ownerBorderClass = 'border-blue-500';
            else if (tile.owner === 'P2') ownerBorderClass = 'border-green-500';
            else if (tile.owner === 'AI') ownerBorderClass = 'border-purple-500';

            // Find visual effects for this tile
            const effects = visualEffects.filter(e => e.position === tile.id);

            return (
              <div
                key={tile.id}
                style={style}
                className={`relative rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border-b-4 flex flex-col items-center justify-between p-1 transition-all overflow-visible group
                  ${getTileBackground(tile)} ${ownerBorderClass}
                  ${playerHere.length > 0 ? 'scale-[1.02] z-20 shadow-xl' : 'hover:scale-105 hover:z-20'}
                `}
              >
                {/* Floating Visual Effects */}
                {effects.map(effect => (
                  <div key={effect.id} className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-floatUp">
                     <span className={`
                       text-xl font-black px-3 py-1 rounded-full shadow-lg border-2 border-white
                       ${effect.type === 'money-gain' ? 'bg-green-500 text-white' : ''}
                       ${effect.type === 'money-loss' ? 'bg-red-500 text-white' : ''}
                       ${effect.type === 'upgrade' ? 'bg-yellow-400 text-yellow-900' : ''}
                       ${effect.type === 'buy' ? 'bg-blue-500 text-white' : ''}
                       ${effect.type === 'bankrupt' ? 'bg-gray-800 text-white' : ''}
                     `}>
                       {effect.text}
                     </span>
                  </div>
                ))}

                {/* Upgrade Animation Overlay */}
                {isUpgrading && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-yellow-400/30 animate-pulse rounded-lg" />
                    <div className="absolute -inset-4 border-4 border-yellow-500/50 rounded-2xl animate-ping" />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                       <span className="text-4xl animate-bounce filter drop-shadow-lg">✨</span>
                    </div>
                  </div>
                )}

                {/* Tile Name */}
                <div className="w-full text-center bg-white/40 backdrop-blur-sm rounded-t-lg py-1.5 z-10">
                    <span className="text-[10px] md:text-xs font-bold text-slate-800 leading-tight block truncate px-1">
                        {tile.name}
                    </span>
                </div>
                
                {/* Icon/Content */}
                <div className="flex-1 flex items-center justify-center z-10 transform group-hover:scale-110 transition-transform">
                    {renderIcon(tile.type, tile.name)}
                </div>

                {/* Price/Rent info */}
                {tile.price && (
                    <div className="text-[10px] font-mono font-bold text-slate-600 bg-white/50 px-2 py-0.5 rounded-full mb-1 z-10 shadow-sm border border-white/50">
                        ¥{tile.price}
                    </div>
                )}

                {/* Owner Marker - Improved visuals */}
                {tile.owner && (
                    <div className={`absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full shadow-lg border-2 border-white z-20
                        ${tile.owner === 'P1' ? 'bg-blue-500' : tile.owner === 'P2' ? 'bg-green-500' : 'bg-purple-500'}
                    `}>
                        <span className="text-xs text-white">
                           {tile.owner === 'P1' ? '🐼' : tile.owner === 'P2' ? '🐰' : '🤖'}
                        </span>
                    </div>
                )}

                {/* Building Levels - Stars */}
                {tile.level && tile.level > 1 && (
                    <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-10">
                        {[...Array(tile.level - 1)].map((_, i) => (
                            <span key={i} className="text-[10px] filter drop-shadow">⭐</span>
                        ))}
                    </div>
                )}

                {/* Player Tokens - 3D Look */}
                {playerHere.length > 0 && (
                    <div className="absolute -bottom-3 flex -space-x-2 justify-center w-full z-30 px-2">
                        {playerHere.map(p => (
                            <div key={p.id} className="relative w-10 h-10 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] border-2 border-white flex items-center justify-center text-lg transform transition-all hover:z-40 hover:-translate-y-2">
                                <span className="filter drop-shadow-sm">{p.avatar}</span>
                                <div className="absolute -bottom-1 w-6 h-1 bg-black/20 rounded-full blur-[2px]" />
                            </div>
                        ))}
                    </div>
                )}
              </div>
            );
        })}
      </div>
       <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0); opacity: 0; scale: 0.5; }
          20% { transform: translate(-50%, -20px); opacity: 1; scale: 1.2; }
          100% { transform: translate(-50%, -60px); opacity: 0; scale: 1; }
        }
        .animate-floatUp {
          animation: floatUp 1.5s ease-out forwards;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-bounce-subtle {
           animation: bounce-subtle 2s infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(-3%); }
          50% { transform: translateY(3%); }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;