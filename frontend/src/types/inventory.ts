// 库存相关类型定义

export interface InventoryStatus {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  currentStock: number;
  minStock: number;
  isLowStock: boolean;
  lastTransactionDate?: string;
}

export interface InventoryFilter {
  itemName?: string;
  category?: string;
  locationId?: string;
  locationName?: string;
  lowStockOnly?: boolean;
}

export interface InventoryGroupByLocation {
  locationId: string;
  locationName: string;
  locationCode: string;
  items: InventoryStatus[];
  totalItems: number;
  lowStockItems: number;
}

export interface InventoryDetail {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  minStock: number;
  locations: {
    locationId: string;
    locationName: string;
    locationCode: string;
    currentStock: number;
    isLowStock: boolean;
  }[];
  totalStock: number;
  totalLowStockLocations: number;
}

export interface InventorySummary {
  totalItems: number;
  totalLocations: number;
  lowStockItems: number;
  outOfStockItems: number;
}