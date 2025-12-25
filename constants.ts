import { Tile, TileType, Badge } from './types';

// 上海大冒险：完整版地图数据 (32格, 9x9网格)
export const BOARD_SIZE = 32;

export const INITIAL_MONEY = 4000; // 增加初始资金以适应更大的地图

export const GAME_BOARD: Tile[] = [
  // --- 上边：从左到右 (索引 0-8) ---
  { id: 0, name: '起点', type: TileType.START, color: 'bg-green-200' },
  { id: 1, name: '城隍庙', type: TileType.PROPERTY, price: 200, rent: 30, owner: null, level: 1, color: 'bg-orange-200' },
  { id: 2, name: '豫园', type: TileType.PROPERTY, price: 220, rent: 35, owner: null, level: 1, color: 'bg-orange-200' },
  { id: 3, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 4, name: '田子坊', type: TileType.PROPERTY, price: 260, rent: 40, owner: null, level: 1, color: 'bg-pink-200' },
  { id: 5, name: '新天地', type: TileType.PROPERTY, price: 300, rent: 50, owner: null, level: 1, color: 'bg-pink-200' },
  { id: 6, name: '一大会址', type: TileType.PROPERTY, price: 320, rent: 55, owner: null, level: 1, color: 'bg-pink-200' },
  { id: 7, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 8, name: '静安寺', type: TileType.PROPERTY, price: 400, rent: 60, owner: null, level: 1, color: 'bg-purple-200' },

  // --- 右边：从上到下 (索引 9-15) ---
  { id: 9, name: '南京西路', type: TileType.PROPERTY, price: 450, rent: 70, owner: null, level: 1, color: 'bg-purple-200' },
  { id: 10, name: '人民广场', type: TileType.PROPERTY, price: 500, rent: 80, owner: null, level: 1, color: 'bg-purple-300' },
  { id: 11, name: '上海博物馆', type: TileType.PROPERTY, price: 550, rent: 90, owner: null, level: 1, color: 'bg-purple-300' },
  { id: 12, name: '人民银行', type: TileType.BANK, color: 'bg-green-300' }, // 银行位于中间位置
  { id: 13, name: '南京东路', type: TileType.PROPERTY, price: 600, rent: 100, owner: null, level: 1, color: 'bg-blue-200' },
  { id: 14, name: '和平饭店', type: TileType.PROPERTY, price: 650, rent: 110, owner: null, level: 1, color: 'bg-blue-200' },
  { id: 15, name: '外滩', type: TileType.PROPERTY, price: 700, rent: 120, owner: null, level: 1, color: 'bg-blue-300' },

  // --- 下边：从右到左 (索引 16-24) ---
  { id: 16, name: '休息站', type: TileType.JAIL, color: 'bg-gray-300' },
  { id: 17, name: '东方明珠', type: TileType.PROPERTY, price: 800, rent: 140, owner: null, level: 1, color: 'bg-red-200' },
  { id: 18, name: '金茂大厦', type: TileType.PROPERTY, price: 850, rent: 150, owner: null, level: 1, color: 'bg-red-200' },
  { id: 19, name: '环球金融', type: TileType.PROPERTY, price: 900, rent: 160, owner: null, level: 1, color: 'bg-red-300' },
  { id: 20, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 21, name: '上海中心', type: TileType.PROPERTY, price: 1000, rent: 180, owner: null, level: 1, color: 'bg-red-300' },
  { id: 22, name: '科技馆', type: TileType.PROPERTY, price: 750, rent: 130, owner: null, level: 1, color: 'bg-cyan-200' },
  { id: 23, name: '世纪公园', type: TileType.PROPERTY, price: 700, rent: 120, owner: null, level: 1, color: 'bg-cyan-200' },
  { id: 24, name: '税务局', type: TileType.BANK, color: 'bg-red-200' },

  // --- 左边：从下到上 (索引 25-31) ---
  { id: 25, name: '中华艺术宫', type: TileType.PROPERTY, price: 600, rent: 100, owner: null, level: 1, color: 'bg-cyan-300' },
  { id: 26, name: '野生动物园', type: TileType.PROPERTY, price: 500, rent: 80, owner: null, level: 1, color: 'bg-green-200' },
  { id: 27, name: '欢乐谷', type: TileType.PROPERTY, price: 550, rent: 90, owner: null, level: 1, color: 'bg-green-200' },
  { id: 28, name: '运气卡', type: TileType.CHANCE, color: 'bg-yellow-200' },
  { id: 29, name: '海昌海洋', type: TileType.PROPERTY, price: 650, rent: 110, owner: null, level: 1, color: 'bg-green-300' },
  { id: 30, name: '天文馆', type: TileType.PROPERTY, price: 700, rent: 120, owner: null, level: 1, color: 'bg-indigo-200' },
  { id: 31, name: '迪士尼', type: TileType.PROPERTY, price: 1200, rent: 250, owner: null, level: 1, color: 'bg-indigo-300' },
];

export const INITIAL_BADGES: Badge[] = [
  { id: 'first_blood', name: '第一桶金', description: '不仅赚到了钱，还买下了第一块地！', icon: '🏠', unlocked: false },
  { id: 'math_genius', name: '速算小能手', description: '连续答对5道数学题！', icon: '⚡', unlocked: false },
  { id: 'tycoon', name: '上海首富', description: '总资产超过5000元！', icon: '💰', unlocked: false },
  { id: 'landlord', name: '地产大亨', description: '拥有超过5块地产', icon: '🏗️', unlocked: false },
];