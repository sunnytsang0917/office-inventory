"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemModel = exports.UpdateItemSchema = exports.CreateItemSchema = exports.ItemSchema = void 0;
const zod_1 = require("zod");
exports.ItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '物品名称不能为空').max(100, '物品名称不能超过100个字符'),
    category: zod_1.z.string().min(1, '物品类别不能为空').max(50, '物品类别不能超过50个字符'),
    specification: zod_1.z.string().optional(),
    unit: zod_1.z.string().min(1, '计量单位不能为空').max(20, '计量单位不能超过20个字符'),
    defaultLocationId: zod_1.z.string().uuid('默认位置ID格式不正确').optional(),
    lowStockThreshold: zod_1.z.number().int().min(0, '低库存阈值不能为负数').default(0),
});
exports.CreateItemSchema = exports.ItemSchema;
exports.UpdateItemSchema = exports.ItemSchema.partial();
class ItemModel {
    constructor(data) {
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
    static fromDatabase(row) {
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
    static validate(data) {
        return exports.ItemSchema.parse(data);
    }
    static validateUpdate(data) {
        return exports.UpdateItemSchema.parse(data);
    }
    isLowStock(currentStock) {
        return currentStock <= this.lowStockThreshold;
    }
}
exports.ItemModel = ItemModel;
exports.default = ItemModel;
//# sourceMappingURL=Item.js.map