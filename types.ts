
export enum TileType {
  START = 'START',
  PROPERTY = 'PROPERTY', // 可购买的地产
  CHANCE = 'CHANCE',     // 机会/命运
  JAIL = 'JAIL',         // 禁闭/休息
  BANK = 'BANK',         // 银行/奖励
}

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  price?: number;       // 购买价格
  rent?: number;        // 基础租金
  owner?: string | null; // Changed from explicit union to string to support P1, P2, AI
  level?: number;       // 建筑等级 1-3
  color?: string;       // 地块颜色
}

export interface Player {
  id: string; // 'P1', 'P2', 'AI'
  name: string;
  money: number;
  position: number; // Index on the board
  isJailed: boolean;
  isBankrupt: boolean; // New field for bankruptcy status
  properties: number[]; // Array of Tile IDs
  avatar: string;
  isAi: boolean; // Flag to identify if this player is a bot
}

export interface VisualEffect {
  id: number;
  position: number; // Tile index where effect happens
  text: string;     // "+100", "Level Up!", "Sold!"
  type: 'money-gain' | 'money-loss' | 'upgrade' | 'bankrupt' | 'buy';
}

export interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
  type: 'ADD' | 'SUB' | 'MUL' | 'DIV';
  difficulty: number;
  explanation?: string;
}

export interface WrongAnswerLog {
  id: string;
  question: MathQuestion;
  wrongOption: number;
  timestamp: number;
}

export interface GameLog {
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface MistakeRecord {
  questionType: string;
  timestamp: number;
  count: number;
}
