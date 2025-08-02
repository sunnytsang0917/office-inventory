import { ApiClient } from './api';
import { Location } from '../types/location';

// 位置相关类型定义
export interface CreateLocationRequest {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {}

export interface LocationInventory {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  currentStock: number;
  minStock: number;
  isLowStock: boolean;
  lastTransactionDate?: string;
}

export interface SetDefaultLocationRequest {
  itemId: string;
  locationId: string;
}

// 位置API服务
export class LocationApi {
  // 创建位置
  static async createLocation(location: CreateLocationRequest): Promise<Location> {
    return ApiClient.post<Location>('/locations', location);
  }

  // 获取位置列表
  static async getLocations(): Promise<Location[]> {
    return ApiClient.get<Location[]>('/locations');
  }

  // 获取位置详情
  static async getLocation(id: string): Promise<Location> {
    return ApiClient.get<Location>(`/locations/${id}`);
  }

  // 根据编码获取位置
  static async getLocationByCode(code: string): Promise<Location> {
    return ApiClient.get<Location>(`/locations/code/${code}`);
  }

  // 更新位置
  static async updateLocation(id: string, location: UpdateLocationRequest): Promise<Location> {
    return ApiClient.put<Location>(`/locations/${id}`, location);
  }

  // 删除位置
  static async deleteLocation(id: string): Promise<void> {
    return ApiClient.delete(`/locations/${id}`);
  }

  // 获取层级结构
  static async getHierarchy(): Promise<Location[]> {
    return ApiClient.get<Location[]>('/locations/hierarchy');
  }

  // 获取根级位置
  static async getRootLocations(): Promise<Location[]> {
    return ApiClient.get<Location[]>('/locations/root');
  }

  // 获取子级位置
  static async getChildren(parentId: string): Promise<Location[]> {
    return ApiClient.get<Location[]>(`/locations/${parentId}/children`);
  }

  // 获取位置路径
  static async getLocationPath(id: string): Promise<string[]> {
    return ApiClient.get<string[]>(`/locations/${id}/path`);
  }

  // 获取位置库存信息
  static async getLocationInventory(id: string): Promise<LocationInventory[]> {
    return ApiClient.get<LocationInventory[]>(`/locations/${id}/inventory`);
  }

  // 设置物品默认位置
  static async setItemDefaultLocation(data: SetDefaultLocationRequest): Promise<void> {
    return ApiClient.post('/locations/set-default', data);
  }

  // 批量更新位置状态
  static async batchUpdateStatus(locationIds: string[], isActive: boolean): Promise<void> {
    return ApiClient.patch('/locations/batch/status', {
      locationIds,
      isActive,
    });
  }

  // 构建位置树结构（客户端处理）
  static buildLocationTree(locations: Location[]): Location[] {
    const locationMap = new Map<string, Location & { children?: Location[] }>();
    
    // 创建位置映射
    locations.forEach(location => {
      locationMap.set(location.id, { ...location, children: [] });
    });
    
    const tree: Location[] = [];
    
    // 构建树结构
    locations.forEach(location => {
      const locationWithChildren = locationMap.get(location.id)!;
      
      if (location.parentId) {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children!.push(locationWithChildren);
        }
      } else {
        tree.push(locationWithChildren);
      }
    });
    
    return tree;
  }

  // 获取位置的完整路径名称（客户端处理）
  static getLocationFullPath(locationId: string, locations: Location[]): string {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return '';
    
    if (!location.parentId) {
      return location.name;
    }
    
    const parentPath = this.getLocationFullPath(location.parentId, locations);
    return parentPath ? `${parentPath} > ${location.name}` : location.name;
  }

  // 获取位置的所有子位置ID（包括自身）
  static getAllChildLocationIds(locationId: string, locations: Location[]): string[] {
    const result = [locationId];
    const children = locations.filter(loc => loc.parentId === locationId);
    
    children.forEach(child => {
      result.push(...this.getAllChildLocationIds(child.id, locations));
    });
    
    return result;
  }
}