// 库房位置相关类型定义

export interface Location {
  id: string;
  code: string;           // 位置编码，如 "A-1-01"
  name: string;           // 位置名称，如 "A区1层货架01"
  description?: string;   // 位置描述
  parentId?: string;      // 父级位置ID，支持层级结构
  level: number;          // 层级深度 (0=仓库, 1=区域, 2=楼层, 3=货架, 4=具体位置)
  isActive: boolean;      // 是否启用
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationDto {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
}

export interface UpdateLocationDto {
  code?: string;
  name?: string;
  description?: string;
  parentId?: string;
  level?: number;
  isActive?: boolean;
}

export interface LocationFilter {
  name?: string;
  code?: string;
  level?: number;
  isActive?: boolean;
  parentId?: string;
}

export interface LocationInventory {
  locationId: string;
  locationName: string;
  locationCode: string;
  itemId: string;
  itemName: string;
  currentStock: number;
}

// 位置层级类型
export const LOCATION_LEVELS = {
  WAREHOUSE: 0,    // 仓库
  AREA: 1,         // 区域
  FLOOR: 2,        // 楼层
  SHELF: 3,        // 货架
  POSITION: 4,     // 具体位置
} as const;

export const LOCATION_LEVEL_NAMES = {
  [LOCATION_LEVELS.WAREHOUSE]: '仓库',
  [LOCATION_LEVELS.AREA]: '区域',
  [LOCATION_LEVELS.FLOOR]: '楼层',
  [LOCATION_LEVELS.SHELF]: '货架',
  [LOCATION_LEVELS.POSITION]: '具体位置',
} as const;