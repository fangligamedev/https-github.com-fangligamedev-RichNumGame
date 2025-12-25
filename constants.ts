import { Tile, TileType, Badge } from './types';

// 上海地标地图数据 (Simplified for a loop)
export const BOARD_SIZE = 16;

export const INITIAL_MONEY = 2000;

export const GAME_BOARD: Tile[] = [
  { id: 0, name: '起点', type: TileType.START, color: 'bg-green-200' },
  { id: 1, name: '南京路', type: TileType.PROPERTY, price: 200, rent: 40, owner: null, level: 1, color: 'bg-pink-300' },
  { id: 2, name: '静安寺', type: TileType.PROPERTY, price: 250, rent: 50, owner: null, level: 1, color: 'bg-pink-300' },
  { id: 3, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 4, name: '新天地', type: TileType.PROPERTY, price: 300, rent: 60, owner: null, level: 1, color: 'bg-blue-300' },
  { id: 5, name: '豫园', type: TileType.PROPERTY, price: 350, rent: 70, owner: null, level: 1, color: 'bg-blue-300' },
  { id: 6, name: '人民银行', type: TileType.BANK, color: 'bg-green-300' },
  { id: 7, name: '外滩', type: TileType.PROPERTY, price: 400, rent: 80, owner: null, level: 1, color: 'bg-purple-300' },
  { id: 8, name: '休息站', type: TileType.JAIL, color: 'bg-gray-300' },
  { id: 9, name: '陆家嘴', type: TileType.PROPERTY, price: 500, rent: 100, owner: null, level: 1, color: 'bg-purple-300' },
  { id: 10, name: '东方明珠', type: TileType.PROPERTY, price: 600, rent: 120, owner: null, level: 1, color: 'bg-orange-300' },
  { id: 11, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 12, name: '科技馆', type: TileType.PROPERTY, price: 450, rent: 90, owner: null, level: 1, color: 'bg-orange-300' },
  { id: 13, name: '迪士尼', type: TileType.PROPERTY, price: 800, rent: 160, owner: null, level: 1, color: 'bg-red-300' },
  { id: 14, name: '税务局', type: TileType.BANK, color: 'bg-red-200' }, // Pay tax here
  { id: 15, name: '上海中心', type: TileType.PROPERTY, price: 1000, rent: 200, owner: null, level: 1, color: 'bg-red-300' },
];

export const INITIAL_BADGES: Badge[] = [
  { id: 'first_blood', name: '第一桶金', description: '不仅赚到了钱，还买下了第一块地！', icon: '🏠', unlocked: false },
  { id: 'math_genius', name: '速算小能手', description: '连续答对5道数学题！', icon: '⚡', unlocked: false },
  { id: 'tycoon', name: '上海首富', description: '总资产超过5000元！', icon: '💰', unlocked: false },
  { id: 'survivor', name: '绝处逢生', description: '资金低于100元时成功翻盘', icon: '🌱', unlocked: false },
];
