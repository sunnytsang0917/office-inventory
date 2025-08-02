// 物品相关类型定义

export interface Item {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  location: string;
  currentStock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  name: string;
  category: string;
  specification: string;
  unit: string;
  location: string;
  minStock: number;
}

export interface UpdateItemDto {
  name?: string;
  category?: string;
  specification?: string;
  unit?: string;
  location?: string;
  minStock?: number;
}

export interface ItemFilter {
  name?: string;
  category?: string;
  location?: string;
  lowStock?: boolean;
}