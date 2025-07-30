import { z } from 'zod';

// Location数据验证模式
export const LocationCreateSchema = z.object({
  code: z.string()
    .min(1, '位置编码不能为空')
    .max(50, '位置编码不能超过50个字符')
    .regex(/^[A-Za-z0-9\-_]+$/, '位置编码只能包含字母、数字、连字符和下划线'),
  name: z.string()
    .min(1, '位置名称不能为空')
    .max(100, '位置名称不能超过100个字符'),
  description: z.string().max(500, '位置描述不能超过500个字符').optional(),
  parentId: z.string().uuid('父级位置ID格式不正确').optional(),
  level: z.number().int().min(0).max(10, '位置层级不能超过10级').default(0),
  isActive: z.boolean().default(true),
});

export const LocationUpdateSchema = LocationCreateSchema.partial();

export const LocationQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
  level: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  includeInactive: z.boolean().default(false),
});

// Location接口
export interface LocationData {
  id?: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationWithChildren extends LocationData {
  children?: LocationWithChildren[];
}

export interface LocationInventory {
  locationId: string;
  locationCode: string;
  locationName: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  lastTransactionDate?: Date;
}

export interface LocationFilter {
  parentId?: string;
  level?: number;
  isActive?: boolean;
  includeInactive?: boolean;
  search?: string;
}

// Location模型类
export class LocationModel {
  private data: LocationData;

  constructor(data: LocationData) {
    this.data = { ...data };
  }

  // 静态验证方法
  static validateCreate(data: unknown): LocationData {
    const result = LocationCreateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues || [];
      if (errors.length > 0) {
        throw new Error(errors[0].message);
      } else {
        throw new Error('位置数据验证失败');
      }
    }
    return result.data;
  }

  static validateUpdate(data: unknown): Partial<LocationData> {
    const result = LocationUpdateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues || [];
      if (errors.length > 0) {
        throw new Error(errors[0].message);
      } else {
        throw new Error('位置更新数据验证失败');
      }
    }
    return result.data;
  }

  static validateQuery(data: unknown): LocationFilter {
    const result = LocationQuerySchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues || [];
      if (errors.length > 0) {
        throw new Error(errors[0].message);
      } else {
        throw new Error('位置查询参数验证失败');
      }
    }
    return result.data;
  }

  // Getter方法
  get id(): string | undefined {
    return this.data.id;
  }

  get code(): string {
    return this.data.code;
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get parentId(): string | undefined {
    return this.data.parentId;
  }

  get level(): number {
    return this.data.level;
  }

  get isActive(): boolean {
    return this.data.isActive;
  }

  get createdAt(): Date | undefined {
    return this.data.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.data.updatedAt;
  }

  // 业务逻辑方法
  isRoot(): boolean {
    return !this.data.parentId;
  }

  canHaveChildren(): boolean {
    return this.data.level < 10; // 最大层级限制
  }

  getFullPath(): string {
    // 这个方法需要在有父级信息时才能完整实现
    return this.data.code;
  }

  // 验证层级结构
  static validateHierarchy(location: LocationData, parentLocation?: LocationData): void {
    if (!location.parentId) {
      // 根级位置，层级应该是0
      if (location.level !== 0) {
        throw new Error('根级位置的层级必须为0');
      }
      return;
    }

    if (!parentLocation) {
      throw new Error('指定了父级位置但未提供父级位置信息');
    }

    // 检查父级位置是否激活
    if (!parentLocation.isActive) {
      throw new Error('不能在非激活的父级位置下创建子位置');
    }

    // 检查层级是否正确
    if (location.level !== parentLocation.level + 1) {
      throw new Error(`子位置层级应该是${parentLocation.level + 1}，但提供的是${location.level}`);
    }

    // 检查父级是否可以有子级
    if (parentLocation.level >= 10) {
      throw new Error('父级位置已达到最大层级，不能创建子位置');
    }
  }

  // 更新数据
  update(updateData: Partial<LocationData>): void {
    // 验证更新数据
    const validatedData = LocationModel.validateUpdate(updateData);
    
    // 合并数据
    this.data = {
      ...this.data,
      ...validatedData,
      updatedAt: new Date(),
    };
  }

  // 转换为JSON
  toJSON(): LocationData {
    return {
      id: this.data.id,
      code: this.data.code,
      name: this.data.name,
      description: this.data.description,
      parentId: this.data.parentId,
      level: this.data.level,
      isActive: this.data.isActive,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    };
  }

  // 从数据库数据创建实例
  static fromDatabase(dbData: any): LocationModel {
    const locationData: LocationData = {
      id: dbData.id,
      code: dbData.code,
      name: dbData.name,
      description: dbData.description,
      parentId: dbData.parent_id,
      level: dbData.level,
      isActive: dbData.is_active,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
    };

    return new LocationModel(locationData);
  }

  // 转换为数据库格式
  toDatabaseFormat(): any {
    return {
      id: this.data.id,
      code: this.data.code,
      name: this.data.name,
      description: this.data.description,
      parent_id: this.data.parentId,
      level: this.data.level,
      is_active: this.data.isActive,
      created_at: this.data.createdAt,
      updated_at: this.data.updatedAt,
    };
  }

  // 构建层级树结构
  static buildHierarchy(locations: LocationModel[]): LocationWithChildren[] {
    const locationMap = new Map<string, LocationWithChildren>();
    const rootLocations: LocationWithChildren[] = [];

    // 首先创建所有位置的映射
    locations.forEach(location => {
      const locationData: LocationWithChildren = {
        ...location.toJSON(),
        children: [],
      };
      locationMap.set(location.id!, locationData);
    });

    // 然后构建层级关系
    locations.forEach(location => {
      const locationData = locationMap.get(location.id!);
      if (!locationData) return;

      if (location.parentId) {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children!.push(locationData);
        }
      } else {
        rootLocations.push(locationData);
      }
    });

    return rootLocations;
  }

  // 获取所有子级位置ID（递归）
  static getAllChildrenIds(locationId: string, locations: LocationModel[]): string[] {
    const childrenIds: string[] = [];
    const directChildren = locations.filter(loc => loc.parentId === locationId);
    
    directChildren.forEach(child => {
      if (child.id) {
        childrenIds.push(child.id);
        // 递归获取子级的子级
        const grandChildren = LocationModel.getAllChildrenIds(child.id, locations);
        childrenIds.push(...grandChildren);
      }
    });

    return childrenIds;
  }
}

export default LocationModel;