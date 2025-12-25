import React from 'react';
import { Tile, Player, TileType } from '../types';
import { Building2, Landmark, DollarSign, Ban, Dices, Bot } from 'lucide-react';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  currentPlayerId: string;
  upgradingTileId?: number | null;
  onRollDice?: () => void;
  isAiRolling?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, players, currentPlayerId, upgradingTileId, onRollDice, isAiRolling }) => {
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
    if (type === TileType.START) return <span className="text-2xl">🏁</span>;
    if (type === TileType.BANK) return <DollarSign className="w-6 h-6 text-green-700" />;
    if (type === TileType.CHANCE) return <span className="text-2xl">❓</span>;
    if (type === TileType.JAIL) return <Ban className="w-6 h-6 text-gray-600" />;
    if (name.includes('东方明珠') || name.includes('中心')) return <Landmark className="w-6 h-6 text-red-700" />;
    return <Building2 className="w-6 h-6 text-gray-700 opacity-60" />;
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  // Enable button if it is a human player's turn (not AI)
  const isHumanTurn = currentPlayer && !currentPlayer.isAi;

  return (
    <div className="relative w-full max-w-3xl aspect-square mx-auto bg-blue-50 p-4 rounded-3xl shadow-xl border-8 border-blue-200">
      <div className="grid grid-cols-5 grid-rows-5 gap-2 h-full w-full">
        {/* Center Logo Area & Button */}
        <div className="col-start-2 col-end-5 row-start-2 row-end-5 bg-white/50 rounded-xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-wider drop-shadow-sm mb-1">上海大冒险</h1>
            <p className="text-gray-500 font-medium mb-4 text-sm">Math Tycoon</p>
            
            {/* Status Badge */}
            <div className={`mb-6 px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 flex items-center
              ${currentPlayer?.isAi ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
              当前回合: {currentPlayer?.name || '...'}
            </div>

            {/* Roll Dice Button / AI Status */}
            {currentPlayer?.isAi ? (
                <div className="flex flex-col items-center justify-center h-16 w-48 bg-gray-100 rounded-full shadow-inner">
                    {isAiRolling ? (
                        <div className="flex items-center space-x-2 text-purple-600 animate-pulse">
                            <Dices className="w-6 h-6 animate-spin" />
                            <span className="font-bold">机器人投掷中...</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                             <Bot className="w-6 h-6" />
                             <span>思考中...</span>
                        </div>
                    )}
                </div>
            ) : (
                <button
                onClick={onRollDice}
                disabled={!isHumanTurn}
                className={`
                    group relative flex items-center justify-center px-8 py-4 rounded-full transition-all duration-300
                    ${isHumanTurn 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl hover:scale-105 hover:shadow-blue-300/50 cursor-pointer animate-bounce' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}
                `}
                >
                <div className={`absolute inset-0 rounded-full bg-white transition-opacity ${isHumanTurn ? 'opacity-0 group-hover:opacity-10' : 'opacity-0'}`} />
                <Dices className={`w-8 h-8 mr-2 ${isHumanTurn ? 'animate-spin' : ''}`} />
                <span className="text-xl font-black tracking-widest">{isHumanTurn ? '掷骰子' : '等待中'}</span>
                </button>
            )}
        </div>

        {/* Tiles */}
        {tiles.map((tile) => {
            const style = getGridStyle(tile.id);
            // Filter out bankrupt players from rendering on the board
            const playerHere = players.filter(p => p.position === tile.id && !p.isBankrupt);
            const isUpgrading = tile.id === upgradingTileId;
            // Determine owner color class
            let ownerColorClass = 'bg-gray-400';
            if (tile.owner === 'P1') ownerColorClass = 'bg-blue-500';
            else if (tile.owner === 'P2') ownerColorClass = 'bg-green-500';
            else if (tile.owner === 'AI') ownerColorClass = 'bg-purple-500';

            return (
              <div
                key={tile.id}
                style={style}
                className={`relative rounded-lg shadow-md border-2 border-white/50 flex flex-col items-center justify-between p-1 transition-all overflow-hidden
                  ${tile.color} ${playerHere.length > 0 ? 'ring-4 ring-yellow-400 z-10 scale-105' : ''}
                `}
              >
                {/* Upgrade Animation Overlay */}
                {isUpgrading && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-yellow-400/30 animate-pulse rounded-lg" />
                    <div className="absolute -inset-2 border-4 border-yellow-500/50 rounded-xl animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                       <span className="text-4xl animate-bounce filter drop-shadow-lg">✨</span>
                    </div>
                  </div>
                )}

                {/* Tile Name */}
                <div className="w-full text-center bg-white/30 rounded-t-md py-1 z-10">
                    <span className="text-[10px] md:text-xs font-bold text-gray-800 leading-tight block truncate px-1">
                        {tile.name}
                    </span>
                </div>
                
                {/* Icon/Content */}
                <div className="flex-1 flex items-center justify-center z-10">
                    {renderIcon(tile.type, tile.name)}
                </div>

                {/* Price/Rent info */}
                {tile.price && (
                    <div className="text-[10px] font-mono font-bold text-gray-600 bg-white/40 px-1 rounded mb-1 z-10">
                        ¥{tile.price}
                    </div>
                )}

                {/* Owner Marker */}
                {tile.owner && (
                    <div className={`absolute top-0 right-0 p-1 rounded-bl-lg shadow-sm border-l border-b border-white z-10 ${ownerColorClass}`}>
                        <span className="text-xs text-white px-1">
                           {tile.owner === 'P1' ? '🐼' : tile.owner === 'P2' ? '🐰' : '🤖'}
                        </span>
                    </div>
                )}

                {/* Building Levels */}
                {tile.level && tile.level > 1 && (
                    <div className="absolute top-0 left-0 flex space-x-0.5 p-1 z-10">
                        {[...Array(tile.level - 1)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full border border-yellow-600 shadow-sm" />
                        ))}
                    </div>
                )}

                {/* Player Tokens */}
                {playerHere.length > 0 && (
                    <div className="absolute -bottom-2 flex space-x-1 justify-center w-full z-30">
                        {playerHere.map(p => (
                            <div key={p.id} className="w-8 h-8 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-lg transform transition-transform duration-300">
                                {p.avatar}
                            </div>
                        ))}
                    </div>
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default GameBoard;