import { ApiClient } from './api';
import { Item } from '../types/item';

// 物品相关类型定义
export interface CreateItemRequest {
  name: string;
  category: string;
  specification: string;
  unit: string;
  defaultLocationId?: string;
  minStock: number;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {}

export interface ItemFilter {
  name?: string;
  category?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

export interface BatchImportResult {
  success: boolean;
  totalCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// 物品API服务
export class ItemApi {
  // 创建物品
  static async createItem(item: CreateItemRequest): Promise<Item> {
    return ApiClient.post<Item>('/items', item);
  }

  // 获取物品列表
  static async getItems(filter?: ItemFilter): Promise<Item[]> {
    const params = new URLSearchParams();
    
    if (filter?.name) params.append('name', filter.name);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.locationId) params.append('locationId', filter.locationId);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/items?${queryString}` : '/items';
    
    return ApiClient.get<Item[]>(url);
  }

  // 获取物品详情
  static async getItem(id: string): Promise<Item> {
    return ApiClient.get<Item>(`/items/${id}`);
  }

  // 更新物品
  static async updateItem(id: string, item: UpdateItemRequest): Promise<Item> {
    return ApiClient.put<Item>(`/items/${id}`, item);
  }

  // 删除物品
  static async deleteItem(id: string): Promise<void> {
    return ApiClient.delete(`/items/${id}`);
  }

  // 获取物品类别列表
  static async getCategories(): Promise<string[]> {
    return ApiClient.get<string[]>('/items/categories');
  }

  // 批量导入物品
  static async batchImportItems(file: File): Promise<BatchImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return ApiClient.upload<BatchImportResult>('/items/batch-import', formData);
  }

  // 下载导入模板
  static async downloadTemplate(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/items/template/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return response.blob();
  }

  // 搜索物品
  static async searchItems(query: string): Promise<Item[]> {
    return this.getItems({ name: query });
  }

  // 获取物品的库存信息
  static async getItemStock(id: string): Promise<{
    itemId: string;
    totalStock: number;
    locations: Array<{
      locationId: string;
      locationName: string;
      locationCode: string;
      currentStock: number;
      isLowStock: boolean;
    }>;
  }> {
    return ApiClient.get(`/inventory/items/${id}`);
  }
}