"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationModel = exports.LocationQuerySchema = exports.LocationUpdateSchema = exports.LocationCreateSchema = void 0;
const zod_1 = require("zod");
exports.LocationCreateSchema = zod_1.z.object({
    code: zod_1.z.string()
        .min(1, '位置编码不能为空')
        .max(50, '位置编码不能超过50个字符')
        .regex(/^[A-Za-z0-9\-_]+$/, '位置编码只能包含字母、数字、连字符和下划线'),
    name: zod_1.z.string()
        .min(1, '位置名称不能为空')
        .max(100, '位置名称不能超过100个字符'),
    description: zod_1.z.string().max(500, '位置描述不能超过500个字符').optional(),
    parentId: zod_1.z.string().uuid('父级位置ID格式不正确').optional(),
    level: zod_1.z.number().int().min(0).max(10, '位置层级不能超过10级').default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.LocationUpdateSchema = exports.LocationCreateSchema.partial();
exports.LocationQuerySchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid().optional(),
    level: zod_1.z.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
    includeInactive: zod_1.z.boolean().default(false),
});
class LocationModel {
    constructor(data) {
        this.data = { ...data };
    }
    static validateCreate(data) {
        const result = exports.LocationCreateSchema.safeParse(data);
        if (!result.success) {
            const errors = result.error.issues || [];
            if (errors.length > 0) {
                throw new Error(errors[0].message);
            }
            else {
                throw new Error('位置数据验证失败');
            }
        }
        return result.data;
    }
    static validateUpdate(data) {
        const result = exports.LocationUpdateSchema.safeParse(data);
        if (!result.success) {
            const errors = result.error.issues || [];
            if (errors.length > 0) {
                throw new Error(errors[0].message);
            }
            else {
                throw new Error('位置更新数据验证失败');
            }
        }
        return result.data;
    }
    static validateQuery(data) {
        const result = exports.LocationQuerySchema.safeParse(data);
        if (!result.success) {
            const errors = result.error.issues || [];
            if (errors.length > 0) {
                throw new Error(errors[0].message);
            }
            else {
                throw new Error('位置查询参数验证失败');
            }
        }
        return result.data;
    }
    get id() {
        return this.data.id;
    }
    get code() {
        return this.data.code;
    }
    get name() {
        return this.data.name;
    }
    get description() {
        return this.data.description;
    }
    get parentId() {
        return this.data.parentId;
    }
    get level() {
        return this.data.level;
    }
    get isActive() {
        return this.data.isActive;
    }
    get createdAt() {
        return this.data.createdAt;
    }
    get updatedAt() {
        return this.data.updatedAt;
    }
    isRoot() {
        return !this.data.parentId;
    }
    canHaveChildren() {
        return this.data.level < 10;
    }
    getFullPath() {
        return this.data.code;
    }
    static validateHierarchy(location, parentLocation) {
        if (!location.parentId) {
            if (location.level !== 0) {
                throw new Error('根级位置的层级必须为0');
            }
            return;
        }
        if (!parentLocation) {
            throw new Error('指定了父级位置但未提供父级位置信息');
        }
        if (!parentLocation.isActive) {
            throw new Error('不能在非激活的父级位置下创建子位置');
        }
        if (location.level !== parentLocation.level + 1) {
            throw new Error(`子位置层级应该是${parentLocation.level + 1}，但提供的是${location.level}`);
        }
        if (parentLocation.level >= 10) {
            throw new Error('父级位置已达到最大层级，不能创建子位置');
        }
    }
    update(updateData) {
        const validatedData = LocationModel.validateUpdate(updateData);
        this.data = {
            ...this.data,
            ...validatedData,
            updatedAt: new Date(),
        };
    }
    toJSON() {
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
    static fromDatabase(dbData) {
        const locationData = {
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
    toDatabaseFormat() {
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
    static buildHierarchy(locations) {
        const locationMap = new Map();
        const rootLocations = [];
        locations.forEach(location => {
            const locationData = {
                ...location.toJSON(),
                children: [],
            };
            locationMap.set(location.id, locationData);
        });
        locations.forEach(location => {
            const locationData = locationMap.get(location.id);
            if (!locationData)
                return;
            if (location.parentId) {
                const parent = locationMap.get(location.parentId);
                if (parent) {
                    parent.children.push(locationData);
                }
            }
            else {
                rootLocations.push(locationData);
            }
        });
        return rootLocations;
    }
    static getAllChildrenIds(locationId, locations) {
        const childrenIds = [];
        const directChildren = locations.filter(loc => loc.parentId === locationId);
        directChildren.forEach(child => {
            if (child.id) {
                childrenIds.push(child.id);
                const grandChildren = LocationModel.getAllChildrenIds(child.id, locations);
                childrenIds.push(...grandChildren);
            }
        });
        return childrenIds;
    }
}
exports.LocationModel = LocationModel;
exports.default = LocationModel;
//# sourceMappingURL=Location.js.map