import React from 'react';
import { Tile, Player, TileType, VisualEffect } from '../types';
import { Building2, Landmark, DollarSign, Ban, Dices, Bot, FerrisWheel, Trees, Palmtree } from 'lucide-react';
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
  // Logic for a 9x9 Grid (32 Tiles)
  // Grid Indices: 1 to 9
  const getGridStyle = (index: number) => {
    // Top Row (0-8): Row 1, Col 1 -> 9
    if (index >= 0 && index <= 8) {
        return { gridRow: 1, gridColumn: index + 1 };
    }
    // Right Col (9-15): Col 9, Row 2 -> 8
    if (index >= 9 && index <= 15) {
        return { gridRow: index - 7, gridColumn: 9 };
    }
    // Bottom Row (16-24): Row 9, Col 9 -> 1
    if (index >= 16 && index <= 24) {
        return { gridRow: 9, gridColumn: 9 - (index - 16) };
    }
    // Left Col (25-31): Col 1, Row 8 -> 2
    if (index >= 25 && index <= 31) {
        return { gridRow: 9 - (index - 24), gridColumn: 1 };
    }
    return {};
  };

  const renderIcon = (type: TileType, name: string) => {
    if (type === TileType.START) return <span className="text-3xl filter drop-shadow">🏁</span>;
    if (type === TileType.BANK) return <DollarSign className="w-6 h-6 text-green-700 drop-shadow-sm" />;
    if (type === TileType.CHANCE) return <span className="text-2xl filter drop-shadow">❓</span>;
    if (type === TileType.JAIL) return <Ban className="w-6 h-6 text-gray-600 drop-shadow-sm" />;
    
    // Landmarks
    if (name.includes('东方明珠') || name.includes('中心') || name.includes('大厦')) return <Landmark className="w-6 h-6 text-red-700 drop-shadow-md" />;
    if (name.includes('迪士尼') || name.includes('乐园') || name.includes('欢乐谷')) return <FerrisWheel className="w-6 h-6 text-purple-600 drop-shadow-md" />;
    if (name.includes('公园') || name.includes('动物园')) return <Trees className="w-6 h-6 text-green-600 drop-shadow-md" />;
    if (name.includes('外滩') || name.includes('海')) return <Palmtree className="w-6 h-6 text-blue-600 drop-shadow-md" />;
    
    return <Building2 className="w-6 h-6 text-gray-500 opacity-60" />;
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
      
      // Properties - Match colors from constants
      if (tile.color?.includes('orange')) return 'bg-gradient-to-br from-orange-100 to-orange-200';
      if (tile.color?.includes('pink')) return 'bg-gradient-to-br from-pink-100 to-pink-200';
      if (tile.color?.includes('purple')) return 'bg-gradient-to-br from-purple-100 to-purple-200';
      if (tile.color?.includes('blue')) return 'bg-gradient-to-br from-blue-100 to-blue-200';
      if (tile.color?.includes('red')) return 'bg-gradient-to-br from-red-100 to-red-200';
      if (tile.color?.includes('cyan')) return 'bg-gradient-to-br from-cyan-100 to-cyan-200';
      if (tile.color?.includes('green')) return 'bg-gradient-to-br from-emerald-100 to-emerald-200';
      if (tile.color?.includes('indigo')) return 'bg-gradient-to-br from-violet-100 to-violet-300';
      
      return 'bg-white';
  };

  return (
    <div 
      className="relative w-full max-w-4xl aspect-square mx-auto p-4 rounded-[2rem] shadow-2xl border-8 border-white/50 ring-4 ring-blue-200 bg-cover bg-center transition-all duration-500"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1548919973-5cef591cdbc9?q=80&w=2000&auto=format&fit=crop')`, // Shanghai Skyline
        backgroundBlendMode: 'overlay',
        backgroundColor: 'rgba(230, 242, 255, 0.9)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/40 to-white/60 rounded-[1.5rem] backdrop-blur-[2px]"></div>

      {/* Grid Update: 9 cols x 9 rows for 32 tiles */}
      <div className="grid grid-cols-9 grid-rows-9 gap-1.5 h-full w-full relative z-10">
        
        {/* Center Logo Area & Button / Dice - Expanded to fit the hole (Cols 2-8, Rows 2-8) */}
        <div className="col-start-2 col-end-9 row-start-2 row-end-9 bg-white/70 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-white/60">
            
            {/* Title - Only show if dice is NOT rolling */}
            {!showDice && (
              <>
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-wider drop-shadow-sm mb-2">上海大冒险</h1>
                <p className="text-slate-500 font-bold mb-6 text-xs md:text-sm tracking-widest">完整版 32格大地图</p>
                
                <div className={`mb-4 md:mb-8 px-6 py-2 rounded-full text-xs md:text-sm font-bold shadow-sm transition-colors duration-300 flex items-center
                  ${currentPlayer?.isAi ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                  当前回合: {currentPlayer?.name || '...'}
                </div>
              </>
            )}

            {/* Interaction Area */}
            <div className="z-10 w-full flex justify-center items-center relative" style={{ minHeight: '120px' }}>
                
                {/* 3D Dice */}
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

                {/* Buttons / Status */}
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
                            group relative flex items-center justify-center px-10 py-5 rounded-2xl transition-all duration-300
                            ${isHumanTurn 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-105 hover:shadow-2xl cursor-pointer animate-bounce-subtle' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'}
                        `}
                        >
                        <div className={`absolute inset-0 rounded-2xl bg-white transition-opacity ${isHumanTurn ? 'opacity-0 group-hover:opacity-20' : 'opacity-0'}`} />
                        <Dices className={`w-8 h-8 mr-3 ${isHumanTurn ? 'animate-spin-slow' : ''}`} />
                        <span className="text-xl md:text-2xl font-black tracking-widest">{isHumanTurn ? '掷骰子' : '等待中'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Tiles */}
        {tiles.map((tile) => {
            const style = getGridStyle(tile.id);
            const playerHere = players.filter(p => p.position === tile.id && !p.isBankrupt);
            const isUpgrading = tile.id === upgradingTileId;
            let ownerBorderClass = 'border-white/50';
            if (tile.owner === 'P1') ownerBorderClass = 'border-blue-500';
            else if (tile.owner === 'P2') ownerBorderClass = 'border-green-500';
            else if (tile.owner === 'AI') ownerBorderClass = 'border-purple-500';

            const effects = visualEffects.filter(e => e.position === tile.id);

            return (
              <div
                key={tile.id}
                style={style}
                className={`relative rounded-lg shadow-sm border-b-2 flex flex-col items-center justify-between p-0.5 transition-all overflow-visible group
                  ${getTileBackground(tile)} ${ownerBorderClass}
                  ${playerHere.length > 0 ? 'scale-[1.05] z-20 shadow-lg ring-2 ring-white' : 'hover:scale-110 hover:z-20'}
                `}
              >
                {/* Floating Visual Effects */}
                {effects.map(effect => (
                  <div key={effect.id} className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-floatUp">
                     <span className={`
                       text-sm font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white
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

                {/* Upgrade Animation */}
                {isUpgrading && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-yellow-400/30 animate-pulse rounded-lg" />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                       <span className="text-2xl animate-bounce filter drop-shadow-lg">✨</span>
                    </div>
                  </div>
                )}

                {/* Tile Name - Improved wrapping */}
                <div className="w-full h-8 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-t z-10 px-0.5">
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-800 leading-[1.1] text-center whitespace-normal break-words line-clamp-2">
                        {tile.name}
                    </span>
                </div>
                
                {/* Icon */}
                <div className="flex-1 flex items-center justify-center z-10 transform group-hover:scale-110 transition-transform">
                    {renderIcon(tile.type, tile.name)}
                </div>

                {/* Price */}
                {tile.price && (
                    <div className="text-[8px] font-mono font-bold text-slate-600 bg-white/50 px-1.5 py-0.5 rounded-full mb-0.5 z-10 shadow-sm border border-white/50">
                        ¥{tile.price}
                    </div>
                )}

                {/* Owner Marker - Smaller dots */}
                {tile.owner && (
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full shadow-md border border-white z-20
                        ${tile.owner === 'P1' ? 'bg-blue-500' : tile.owner === 'P2' ? 'bg-green-500' : 'bg-purple-500'}
                    `}>
                        <span className="text-[8px] text-white">
                           {tile.owner === 'P1' ? '🐼' : tile.owner === 'P2' ? '🐰' : '🤖'}
                        </span>
                    </div>
                )}

                {/* Stars */}
                {tile.level && tile.level > 1 && (
                    <div className="absolute top-0.5 left-0.5 flex flex-col gap-0 z-10">
                        {[...Array(tile.level - 1)].map((_, i) => (
                            <span key={i} className="text-[8px] filter drop-shadow">⭐</span>
                        ))}
                    </div>
                )}

                {/* Player Tokens - Compact */}
                {playerHere.length > 0 && (
                    <div className="absolute -bottom-2 flex -space-x-1 justify-center w-full z-30 px-1">
                        {playerHere.map(p => (
                            <div key={p.id} className="relative w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-md border border-white flex items-center justify-center text-sm md:text-base transform transition-all hover:z-40 hover:-translate-y-2">
                                <span className="filter drop-shadow-sm">{p.avatar}</span>
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