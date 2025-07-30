import { z } from 'zod';

// 物品数据验证模式
export const ItemSchema = z.object({
  name: z.string().min(1, '物品名称不能为空').max(100, '物品名称不能超过100个字符'),
  category: z.string().min(1, '物品类别不能为空').max(50, '物品类别不能超过50个字符'),
  specification: z.string().optional(),
  unit: z.string().min(1, '计量单位不能为空').max(20, '计量单位不能超过20个字符'),
  defaultLocationId: z.string().uuid('默认位置ID格式不正确').optional(),
  lowStockThreshold: z.number().int().min(0, '低库存阈值不能为负数').default(0),
});

export const CreateItemSchema = ItemSchema;
export const UpdateItemSchema = ItemSchema.partial();

// 物品数据接口
export interface ItemData {
  name: string;
  category: string;
  specification?: string;
  unit: string;
  defaultLocationId?: string;
  lowStockThreshold: number;
}

// 物品过滤器接口
export interface ItemFilter {
  category?: string;
  search?: string;
  defaultLocationId?: string;
  hasDefaultLocation?: boolean;
}

// 物品详情接口（包含库存信息）
export interface ItemWithInventory {
  id: string;
  name: string;
  category: string;
  specification?: string;
  unit: string;
  defaultLocationId?: string;
  defaultLocationName?: string;
  lowStockThreshold: number;
  totalStock: number;
  locationStocks: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    stock: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// 物品模型类
export class ItemModel {
  public readonly id: string;
  public readonly name: string;
  public readonly category: string;
  public readonly specification?: string;
  public readonly unit: string;
  public readonly defaultLocationId?: string;
  public readonly lowStockThreshold: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: {
    id: string;
    name: string;
    category: string;
    specification?: string;
    unit: string;
    defaultLocationId?: string;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.specification = data.specification;
    this.unit = data.unit;
    this.defaultLocationId = data.defaultLocationId;
    this.lowStockThreshold = data.lowStockThreshold;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // 从数据库行创建模型实例
  static fromDatabase(row: any): ItemModel {
    return new ItemModel({
      id: row.id,
      name: row.name,
      category: row.category,
      specification: row.specification,
      unit: row.unit,
      defaultLocationId: row.default_location_id,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  // 转换为JSON对象
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      specification: this.specification,
      unit: this.unit,
      defaultLocationId: this.defaultLocationId,
      lowStockThreshold: this.lowStockThreshold,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // 验证物品数据
  static validate(data: any): ItemData {
    return ItemSchema.parse(data);
  }

  // 验证更新数据
  static validateUpdate(data: any): Partial<ItemData> {
    return UpdateItemSchema.parse(data);
  }

  // 检查是否为低库存
  isLowStock(currentStock: number): boolean {
    return currentStock <= this.lowStockThreshold;
  }
}

export default ItemModel;