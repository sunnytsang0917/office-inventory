import { ApiClient } from './api';
import { InventoryStatus, InventoryDetail, InventorySummary, InventoryFilter } from '../types/inventory';

// 库存相关类型定义
export interface InventoryOverview {
  totalItems: number;
  totalLocations: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockValue?: number;
}

export interface InventoryStatistics {
  totalItems: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryStats: Array<{
    category: string;
    itemCount: number;
    totalStock: number;
  }>;
  locationStats: Array<{
    locationId: string;
    locationName: string;
    itemCount: number;
    totalStock: number;
  }>;
}

export interface StockAvailabilityRequest {
  items: Array<{
    itemId: string;
    locationId: string;
    quantity: number;
  }>;
}

export interface StockAvailabilityResponse {
  available: boolean;
  items: Array<{
    itemId: string;
    locationId: string;
    requestedQuantity: number;
    availableQuantity: number;
    sufficient: boolean;
  }>;
}

export interface InventoryHistoryItem {
  id: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date: string;
  operator: string;
  supplier?: string;
  recipient?: string;
  purpose?: string;
  locationName: string;
  locationCode: string;
}

// 库存API服务
export class InventoryApi {
  // 获取库存状态
  static async getInventoryStatus(filter?: InventoryFilter): Promise<InventoryStatus[]> {
    const params = new URLSearchParams();
    
    if (filter?.itemName) params.append('itemName', filter.itemName);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.locationId) params.append('locationId', filter.locationId);
    if (filter?.locationName) params.append('locationName', filter.locationName);
    if (filter?.lowStockOnly) params.append('lowStockOnly', 'true');

    const queryString = params.toString();
    const url = queryString ? `/inventory?${queryString}` : '/inventory';
    
    return ApiClient.get<InventoryStatus[]>(url);
  }

  // 搜索库存
  static async searchInventory(query: string): Promise<InventoryStatus[]> {
    return ApiClient.get<InventoryStatus[]>(`/inventory/search?q=${encodeURIComponent(query)}`);
  }

  // 获取库存概览
  static async getInventoryOverview(): Promise<InventoryOverview> {
    return ApiClient.get<InventoryOverview>('/inventory/overview');
  }

  // 获取库存统计信息
  static async getInventoryStatistics(): Promise<InventoryStatistics> {
    return ApiClient.get<InventoryStatistics>('/inventory/statistics');
  }

  // 获取低库存物品
  static async getLowStockItems(threshold?: number): Promise<InventoryStatus[]> {
    const url = threshold ? `/inventory/low-stock?threshold=${threshold}` : '/inventory/low-stock';
    return ApiClient.get<InventoryStatus[]>(url);
  }

  // 获取物品库存详情
  static async getItemInventory(itemId: string): Promise<InventoryDetail> {
    return ApiClient.get<InventoryDetail>(`/inventory/items/${itemId}`);
  }

  // 获取物品库存历史
  static async getInventoryHistory(itemId: string, locationId?: string): Promise<InventoryHistoryItem[]> {
    const url = locationId 
      ? `/inventory/items/${itemId}/history?locationId=${locationId}`
      : `/inventory/items/${itemId}/history`;
    return ApiClient.get<InventoryHistoryItem[]>(url);
  }

  // 获取位置库存汇总
  static async getLocationInventorySummary(locationId: string): Promise<{
    locationId: string;
    locationName: string;
    locationCode: string;
    totalItems: number;
    totalStock: number;
    lowStockItems: number;
    items: InventoryStatus[];
  }> {
    return ApiClient.get(`/inventory/locations/${locationId}`);
  }

  // 检查库存可用性
  static async checkStockAvailability(request: StockAvailabilityRequest): Promise<StockAvailabilityResponse> {
    return ApiClient.post<StockAvailabilityResponse>('/inventory/check-availability', request);
  }

  // 获取库存汇总信息（客户端处理）
  static getInventorySummary(inventoryData: InventoryStatus[]): InventorySummary {
    const uniqueItems = new Set(inventoryData.map(item => item.itemId));
    const uniqueLocations = new Set(inventoryData.map(item => item.locationId));
    const lowStockItems = new Set(inventoryData.filter(item => item.isLowStock).map(item => item.itemId));
    const outOfStockItems = new Set(inventoryData.filter(item => item.currentStock === 0).map(item => item.itemId));

    return {
      totalItems: uniqueItems.size,
      totalLocations: uniqueLocations.size,
      lowStockItems: lowStockItems.size,
      outOfStockItems: outOfStockItems.size,
    };
  }

  // 按位置分组库存数据（客户端处理）
  static groupInventoryByLocation(inventoryData: InventoryStatus[]): Array<{
    locationId: string;
    locationName: string;
    locationCode: string;
    items: InventoryStatus[];
    totalItems: number;
    lowStockItems: number;
  }> {
    const locationMap = new Map<string, {
      locationId: string;
      locationName: string;
      locationCode: string;
      items: InventoryStatus[];
      totalItems: number;
      lowStockItems: number;
    }>();

    inventoryData.forEach(item => {
      if (!locationMap.has(item.locationId)) {
        locationMap.set(item.locationId, {
          locationId: item.locationId,
          locationName: item.locationName,
          locationCode: item.locationCode,
          items: [],
          totalItems: 0,
          lowStockItems: 0,
        });
      }

      const locationGroup = locationMap.get(item.locationId)!;
      locationGroup.items.push(item);
      locationGroup.totalItems++;
      if (item.isLowStock) {
        locationGroup.lowStockItems++;
      }
    });

    return Array.from(locationMap.values()).sort((a, b) => a.locationCode.localeCompare(b.locationCode));
  }

  // 过滤库存数据（客户端处理）
  static filterInventoryData(inventoryData: InventoryStatus[], filter: InventoryFilter): InventoryStatus[] {
    return inventoryData.filter(item => {
      if (filter.itemName && !item.itemName.toLowerCase().includes(filter.itemName.toLowerCase())) {
        return false;
      }
      if (filter.category && item.itemCategory !== filter.category) {
        return false;
      }
      if (filter.locationId && item.locationId !== filter.locationId) {
        return false;
      }
      if (filter.locationName && !item.locationName.toLowerCase().includes(filter.locationName.toLowerCase())) {
        return false;
      }
      if (filter.lowStockOnly && !item.isLowStock) {
        return false;
      }
      return true;
    });
  }
}