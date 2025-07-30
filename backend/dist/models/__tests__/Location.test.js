"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Location_1 = __importDefault(require("../Location"));
(0, vitest_1.describe)('LocationModel', () => {
    let validLocationData;
    let validChildLocationData;
    (0, vitest_1.beforeEach)(() => {
        validLocationData = {
            code: 'A-01',
            name: 'A区1号位置',
            description: '主仓库A区第1个位置',
            level: 0,
            isActive: true,
        };
        validChildLocationData = {
            code: 'A-01-01',
            name: 'A区1号位置货架1',
            description: 'A区1号位置的第1个货架',
            parentId: '123e4567-e89b-12d3-a456-426614174000',
            level: 1,
            isActive: true,
        };
    });
    (0, vitest_1.describe)('数据验证', () => {
        (0, vitest_1.describe)('创建验证', () => {
            (0, vitest_1.it)('应该接受有效的根级位置数据', () => {
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(validLocationData)).not.toThrow();
                const validated = Location_1.default.validateCreate(validLocationData);
                (0, vitest_1.expect)(validated.code).toBe(validLocationData.code);
                (0, vitest_1.expect)(validated.name).toBe(validLocationData.name);
                (0, vitest_1.expect)(validated.level).toBe(0);
                (0, vitest_1.expect)(validated.isActive).toBe(true);
            });
            (0, vitest_1.it)('应该接受有效的子级位置数据', () => {
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(validChildLocationData)).not.toThrow();
                const validated = Location_1.default.validateCreate(validChildLocationData);
                (0, vitest_1.expect)(validated.parentId).toBe(validChildLocationData.parentId);
                (0, vitest_1.expect)(validated.level).toBe(1);
            });
            (0, vitest_1.it)('应该拒绝空的位置编码', () => {
                const invalidData = { ...validLocationData, code: '' };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置编码不能为空');
            });
            (0, vitest_1.it)('应该拒绝过长的位置编码', () => {
                const invalidData = { ...validLocationData, code: 'A'.repeat(51) };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置编码不能超过50个字符');
            });
            (0, vitest_1.it)('应该拒绝无效格式的位置编码', () => {
                const invalidData = { ...validLocationData, code: 'A区-01@#' };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置编码只能包含字母、数字、连字符和下划线');
            });
            (0, vitest_1.it)('应该拒绝空的位置名称', () => {
                const invalidData = { ...validLocationData, name: '' };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置名称不能为空');
            });
            (0, vitest_1.it)('应该拒绝过长的位置名称', () => {
                const invalidData = { ...validLocationData, name: 'A'.repeat(101) };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置名称不能超过100个字符');
            });
            (0, vitest_1.it)('应该拒绝无效的父级位置ID', () => {
                const invalidData = { ...validChildLocationData, parentId: 'invalid-uuid' };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('父级位置ID格式不正确');
            });
            (0, vitest_1.it)('应该拒绝负数层级', () => {
                const invalidData = { ...validLocationData, level: -1 };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow();
            });
            (0, vitest_1.it)('应该拒绝过高的层级', () => {
                const invalidData = { ...validLocationData, level: 11 };
                (0, vitest_1.expect)(() => Location_1.default.validateCreate(invalidData)).toThrow('位置层级不能超过10级');
            });
            (0, vitest_1.it)('应该设置默认值', () => {
                const minimalData = {
                    code: 'TEST',
                    name: '测试位置',
                };
                const validated = Location_1.default.validateCreate(minimalData);
                (0, vitest_1.expect)(validated.level).toBe(0);
                (0, vitest_1.expect)(validated.isActive).toBe(true);
            });
        });
        (0, vitest_1.describe)('更新验证', () => {
            (0, vitest_1.it)('应该接受部分更新数据', () => {
                const updateData = {
                    name: '更新后的名称',
                    description: '更新后的描述',
                };
                (0, vitest_1.expect)(() => Location_1.default.validateUpdate(updateData)).not.toThrow();
                const validated = Location_1.default.validateUpdate(updateData);
                (0, vitest_1.expect)(validated.name).toBe(updateData.name);
                (0, vitest_1.expect)(validated.description).toBe(updateData.description);
            });
            (0, vitest_1.it)('应该接受空的更新数据', () => {
                (0, vitest_1.expect)(() => Location_1.default.validateUpdate({})).not.toThrow();
            });
            (0, vitest_1.it)('应该拒绝无效的更新数据', () => {
                const invalidData = { code: '' };
                (0, vitest_1.expect)(() => Location_1.default.validateUpdate(invalidData)).toThrow();
            });
        });
    });
    (0, vitest_1.describe)('模型实例', () => {
        (0, vitest_1.it)('应该正确创建位置实例', () => {
            const location = new Location_1.default(validLocationData);
            (0, vitest_1.expect)(location.code).toBe(validLocationData.code);
            (0, vitest_1.expect)(location.name).toBe(validLocationData.name);
            (0, vitest_1.expect)(location.description).toBe(validLocationData.description);
            (0, vitest_1.expect)(location.level).toBe(validLocationData.level);
            (0, vitest_1.expect)(location.isActive).toBe(validLocationData.isActive);
        });
        (0, vitest_1.it)('应该正确识别根级位置', () => {
            const rootLocation = new Location_1.default(validLocationData);
            const childLocation = new Location_1.default(validChildLocationData);
            (0, vitest_1.expect)(rootLocation.isRoot()).toBe(true);
            (0, vitest_1.expect)(childLocation.isRoot()).toBe(false);
        });
        (0, vitest_1.it)('应该正确判断是否可以有子级', () => {
            const location = new Location_1.default(validLocationData);
            const maxLevelLocation = new Location_1.default({
                ...validLocationData,
                level: 10,
            });
            (0, vitest_1.expect)(location.canHaveChildren()).toBe(true);
            (0, vitest_1.expect)(maxLevelLocation.canHaveChildren()).toBe(false);
        });
        (0, vitest_1.it)('应该正确更新数据', () => {
            const location = new Location_1.default(validLocationData);
            const updateData = {
                name: '更新后的名称',
                description: '更新后的描述',
            };
            location.update(updateData);
            (0, vitest_1.expect)(location.name).toBe(updateData.name);
            (0, vitest_1.expect)(location.description).toBe(updateData.description);
            (0, vitest_1.expect)(location.code).toBe(validLocationData.code);
        });
        (0, vitest_1.it)('应该正确转换为JSON', () => {
            const locationData = {
                ...validLocationData,
                id: '123e4567-e89b-12d3-a456-426614174000',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const location = new Location_1.default(locationData);
            const json = location.toJSON();
            (0, vitest_1.expect)(json).toHaveProperty('id', locationData.id);
            (0, vitest_1.expect)(json).toHaveProperty('code', locationData.code);
            (0, vitest_1.expect)(json).toHaveProperty('name', locationData.name);
            (0, vitest_1.expect)(json).toHaveProperty('description', locationData.description);
            (0, vitest_1.expect)(json).toHaveProperty('level', locationData.level);
            (0, vitest_1.expect)(json).toHaveProperty('isActive', locationData.isActive);
            (0, vitest_1.expect)(json).toHaveProperty('createdAt', locationData.createdAt);
            (0, vitest_1.expect)(json).toHaveProperty('updatedAt', locationData.updatedAt);
        });
        (0, vitest_1.it)('应该正确从数据库数据创建实例', () => {
            const dbData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                code: 'A-01',
                name: 'A区1号位置',
                description: '测试位置',
                parent_id: null,
                level: 0,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };
            const location = Location_1.default.fromDatabase(dbData);
            (0, vitest_1.expect)(location.id).toBe(dbData.id);
            (0, vitest_1.expect)(location.code).toBe(dbData.code);
            (0, vitest_1.expect)(location.name).toBe(dbData.name);
            (0, vitest_1.expect)(location.parentId).toBe(dbData.parent_id);
            (0, vitest_1.expect)(location.level).toBe(dbData.level);
            (0, vitest_1.expect)(location.isActive).toBe(dbData.is_active);
        });
        (0, vitest_1.it)('应该正确转换为数据库格式', () => {
            const locationData = {
                ...validLocationData,
                id: '123e4567-e89b-12d3-a456-426614174000',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const location = new Location_1.default(locationData);
            const dbFormat = location.toDatabaseFormat();
            (0, vitest_1.expect)(dbFormat).toHaveProperty('id', locationData.id);
            (0, vitest_1.expect)(dbFormat).toHaveProperty('code', locationData.code);
            (0, vitest_1.expect)(dbFormat).toHaveProperty('name', locationData.name);
            (0, vitest_1.expect)(dbFormat).toHaveProperty('parent_id', locationData.parentId);
            (0, vitest_1.expect)(dbFormat).toHaveProperty('level', locationData.level);
            (0, vitest_1.expect)(dbFormat).toHaveProperty('is_active', locationData.isActive);
        });
    });
    (0, vitest_1.describe)('层级结构验证', () => {
        (0, vitest_1.it)('应该接受有效的根级位置', () => {
            const rootLocationData = { ...validLocationData, level: 0 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(rootLocationData)).not.toThrow();
        });
        (0, vitest_1.it)('应该拒绝层级不为0的根级位置', () => {
            const invalidRootData = { ...validLocationData, level: 1 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(invalidRootData)).toThrow('根级位置的层级必须为0');
        });
        (0, vitest_1.it)('应该接受有效的子级位置', () => {
            const parentData = { ...validLocationData, id: '123', level: 0 };
            const childData = { ...validChildLocationData, level: 1 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(childData, parentData)).not.toThrow();
        });
        (0, vitest_1.it)('应该拒绝父级位置未激活的子级位置', () => {
            const inactiveParentData = { ...validLocationData, id: '123', level: 0, isActive: false };
            const childData = { ...validChildLocationData, level: 1 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(childData, inactiveParentData))
                .toThrow('不能在非激活的父级位置下创建子位置');
        });
        (0, vitest_1.it)('应该拒绝层级不正确的子级位置', () => {
            const parentData = { ...validLocationData, id: '123', level: 0 };
            const invalidChildData = { ...validChildLocationData, level: 2 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(invalidChildData, parentData))
                .toThrow('子位置层级应该是1，但提供的是2');
        });
        (0, vitest_1.it)('应该拒绝在最大层级位置下创建子级', () => {
            const maxLevelParentData = { ...validLocationData, id: '123', level: 10 };
            const childData = { ...validChildLocationData, level: 11 };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(childData, maxLevelParentData))
                .toThrow('父级位置已达到最大层级，不能创建子位置');
        });
        (0, vitest_1.it)('应该拒绝指定父级但未提供父级信息', () => {
            const childData = { ...validChildLocationData };
            (0, vitest_1.expect)(() => Location_1.default.validateHierarchy(childData))
                .toThrow('指定了父级位置但未提供父级位置信息');
        });
    });
    (0, vitest_1.describe)('层级结构构建', () => {
        (0, vitest_1.it)('应该正确构建层级结构', () => {
            const locations = [
                new Location_1.default({ ...validLocationData, id: '1', code: 'A', name: 'A区', level: 0 }),
                new Location_1.default({ ...validLocationData, id: '2', code: 'A-01', name: 'A区1号', parentId: '1', level: 1 }),
                new Location_1.default({ ...validLocationData, id: '3', code: 'A-02', name: 'A区2号', parentId: '1', level: 1 }),
                new Location_1.default({ ...validLocationData, id: '4', code: 'B', name: 'B区', level: 0 }),
            ];
            const hierarchy = Location_1.default.buildHierarchy(locations);
            (0, vitest_1.expect)(hierarchy).toHaveLength(2);
            (0, vitest_1.expect)(hierarchy[0].children).toHaveLength(2);
            (0, vitest_1.expect)(hierarchy[1].children).toHaveLength(0);
        });
        (0, vitest_1.it)('应该正确获取所有子级ID', () => {
            const locations = [
                new Location_1.default({ ...validLocationData, id: '1', code: 'A', name: 'A区', level: 0 }),
                new Location_1.default({ ...validLocationData, id: '2', code: 'A-01', name: 'A区1号', parentId: '1', level: 1 }),
                new Location_1.default({ ...validLocationData, id: '3', code: 'A-01-01', name: 'A区1号货架1', parentId: '2', level: 2 }),
                new Location_1.default({ ...validLocationData, id: '4', code: 'A-02', name: 'A区2号', parentId: '1', level: 1 }),
            ];
            const childrenIds = Location_1.default.getAllChildrenIds('1', locations);
            (0, vitest_1.expect)(childrenIds).toContain('2');
            (0, vitest_1.expect)(childrenIds).toContain('3');
            (0, vitest_1.expect)(childrenIds).toContain('4');
            (0, vitest_1.expect)(childrenIds).toHaveLength(3);
        });
    });
});
//# sourceMappingURL=Location.test.js.map