import { describe, it, expect, beforeEach } from 'vitest';
import LocationModel, { LocationData } from '../Location';

describe('LocationModel', () => {
  let validLocationData: LocationData;
  let validChildLocationData: LocationData;

  beforeEach(() => {
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

  describe('数据验证', () => {
    describe('创建验证', () => {
      it('应该接受有效的根级位置数据', () => {
        expect(() => LocationModel.validateCreate(validLocationData)).not.toThrow();
        
        const validated = LocationModel.validateCreate(validLocationData);
        expect(validated.code).toBe(validLocationData.code);
        expect(validated.name).toBe(validLocationData.name);
        expect(validated.level).toBe(0);
        expect(validated.isActive).toBe(true);
      });

      it('应该接受有效的子级位置数据', () => {
        expect(() => LocationModel.validateCreate(validChildLocationData)).not.toThrow();
        
        const validated = LocationModel.validateCreate(validChildLocationData);
        expect(validated.parentId).toBe(validChildLocationData.parentId);
        expect(validated.level).toBe(1);
      });

      it('应该拒绝空的位置编码', () => {
        const invalidData = { ...validLocationData, code: '' };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置编码不能为空');
      });

      it('应该拒绝过长的位置编码', () => {
        const invalidData = { ...validLocationData, code: 'A'.repeat(51) };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置编码不能超过50个字符');
      });

      it('应该拒绝无效格式的位置编码', () => {
        const invalidData = { ...validLocationData, code: 'A区-01@#' };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置编码只能包含字母、数字、连字符和下划线');
      });

      it('应该拒绝空的位置名称', () => {
        const invalidData = { ...validLocationData, name: '' };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置名称不能为空');
      });

      it('应该拒绝过长的位置名称', () => {
        const invalidData = { ...validLocationData, name: 'A'.repeat(101) };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置名称不能超过100个字符');
      });

      it('应该拒绝无效的父级位置ID', () => {
        const invalidData = { ...validChildLocationData, parentId: 'invalid-uuid' };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('父级位置ID格式不正确');
      });

      it('应该拒绝负数层级', () => {
        const invalidData = { ...validLocationData, level: -1 };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow();
      });

      it('应该拒绝过高的层级', () => {
        const invalidData = { ...validLocationData, level: 11 };
        
        expect(() => LocationModel.validateCreate(invalidData)).toThrow('位置层级不能超过10级');
      });

      it('应该设置默认值', () => {
        const minimalData = {
          code: 'TEST',
          name: '测试位置',
        };
        
        const validated = LocationModel.validateCreate(minimalData);
        expect(validated.level).toBe(0);
        expect(validated.isActive).toBe(true);
      });
    });

    describe('更新验证', () => {
      it('应该接受部分更新数据', () => {
        const updateData = {
          name: '更新后的名称',
          description: '更新后的描述',
        };
        
        expect(() => LocationModel.validateUpdate(updateData)).not.toThrow();
        
        const validated = LocationModel.validateUpdate(updateData);
        expect(validated.name).toBe(updateData.name);
        expect(validated.description).toBe(updateData.description);
      });

      it('应该接受空的更新数据', () => {
        expect(() => LocationModel.validateUpdate({})).not.toThrow();
      });

      it('应该拒绝无效的更新数据', () => {
        const invalidData = { code: '' };
        
        expect(() => LocationModel.validateUpdate(invalidData)).toThrow();
      });
    });
  });

  describe('模型实例', () => {
    it('应该正确创建位置实例', () => {
      const location = new LocationModel(validLocationData);
      
      expect(location.code).toBe(validLocationData.code);
      expect(location.name).toBe(validLocationData.name);
      expect(location.description).toBe(validLocationData.description);
      expect(location.level).toBe(validLocationData.level);
      expect(location.isActive).toBe(validLocationData.isActive);
    });

    it('应该正确识别根级位置', () => {
      const rootLocation = new LocationModel(validLocationData);
      const childLocation = new LocationModel(validChildLocationData);
      
      expect(rootLocation.isRoot()).toBe(true);
      expect(childLocation.isRoot()).toBe(false);
    });

    it('应该正确判断是否可以有子级', () => {
      const location = new LocationModel(validLocationData);
      const maxLevelLocation = new LocationModel({
        ...validLocationData,
        level: 10,
      });
      
      expect(location.canHaveChildren()).toBe(true);
      expect(maxLevelLocation.canHaveChildren()).toBe(false);
    });

    it('应该正确更新数据', () => {
      const location = new LocationModel(validLocationData);
      const updateData = {
        name: '更新后的名称',
        description: '更新后的描述',
      };
      
      location.update(updateData);
      
      expect(location.name).toBe(updateData.name);
      expect(location.description).toBe(updateData.description);
      expect(location.code).toBe(validLocationData.code); // 未更新的字段保持不变
    });

    it('应该正确转换为JSON', () => {
      const locationData = {
        ...validLocationData,
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const location = new LocationModel(locationData);
      const json = location.toJSON();
      
      expect(json).toHaveProperty('id', locationData.id);
      expect(json).toHaveProperty('code', locationData.code);
      expect(json).toHaveProperty('name', locationData.name);
      expect(json).toHaveProperty('description', locationData.description);
      expect(json).toHaveProperty('level', locationData.level);
      expect(json).toHaveProperty('isActive', locationData.isActive);
      expect(json).toHaveProperty('createdAt', locationData.createdAt);
      expect(json).toHaveProperty('updatedAt', locationData.updatedAt);
    });

    it('应该正确从数据库数据创建实例', () => {
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
      
      const location = LocationModel.fromDatabase(dbData);
      
      expect(location.id).toBe(dbData.id);
      expect(location.code).toBe(dbData.code);
      expect(location.name).toBe(dbData.name);
      expect(location.parentId).toBe(dbData.parent_id);
      expect(location.level).toBe(dbData.level);
      expect(location.isActive).toBe(dbData.is_active);
    });

    it('应该正确转换为数据库格式', () => {
      const locationData = {
        ...validLocationData,
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const location = new LocationModel(locationData);
      const dbFormat = location.toDatabaseFormat();
      
      expect(dbFormat).toHaveProperty('id', locationData.id);
      expect(dbFormat).toHaveProperty('code', locationData.code);
      expect(dbFormat).toHaveProperty('name', locationData.name);
      expect(dbFormat).toHaveProperty('parent_id', locationData.parentId);
      expect(dbFormat).toHaveProperty('level', locationData.level);
      expect(dbFormat).toHaveProperty('is_active', locationData.isActive);
    });
  });

  describe('层级结构验证', () => {
    it('应该接受有效的根级位置', () => {
      const rootLocationData = { ...validLocationData, level: 0 };
      
      expect(() => LocationModel.validateHierarchy(rootLocationData)).not.toThrow();
    });

    it('应该拒绝层级不为0的根级位置', () => {
      const invalidRootData = { ...validLocationData, level: 1 };
      
      expect(() => LocationModel.validateHierarchy(invalidRootData)).toThrow('根级位置的层级必须为0');
    });

    it('应该接受有效的子级位置', () => {
      const parentData = { ...validLocationData, id: '123', level: 0 };
      const childData = { ...validChildLocationData, level: 1 };
      
      expect(() => LocationModel.validateHierarchy(childData, parentData)).not.toThrow();
    });

    it('应该拒绝父级位置未激活的子级位置', () => {
      const inactiveParentData = { ...validLocationData, id: '123', level: 0, isActive: false };
      const childData = { ...validChildLocationData, level: 1 };
      
      expect(() => LocationModel.validateHierarchy(childData, inactiveParentData))
        .toThrow('不能在非激活的父级位置下创建子位置');
    });

    it('应该拒绝层级不正确的子级位置', () => {
      const parentData = { ...validLocationData, id: '123', level: 0 };
      const invalidChildData = { ...validChildLocationData, level: 2 }; // 应该是1
      
      expect(() => LocationModel.validateHierarchy(invalidChildData, parentData))
        .toThrow('子位置层级应该是1，但提供的是2');
    });

    it('应该拒绝在最大层级位置下创建子级', () => {
      const maxLevelParentData = { ...validLocationData, id: '123', level: 10 };
      const childData = { ...validChildLocationData, level: 11 };
      
      expect(() => LocationModel.validateHierarchy(childData, maxLevelParentData))
        .toThrow('父级位置已达到最大层级，不能创建子位置');
    });

    it('应该拒绝指定父级但未提供父级信息', () => {
      const childData = { ...validChildLocationData };
      
      expect(() => LocationModel.validateHierarchy(childData))
        .toThrow('指定了父级位置但未提供父级位置信息');
    });
  });

  describe('层级结构构建', () => {
    it('应该正确构建层级结构', () => {
      const locations = [
        new LocationModel({ ...validLocationData, id: '1', code: 'A', name: 'A区', level: 0 }),
        new LocationModel({ ...validLocationData, id: '2', code: 'A-01', name: 'A区1号', parentId: '1', level: 1 }),
        new LocationModel({ ...validLocationData, id: '3', code: 'A-02', name: 'A区2号', parentId: '1', level: 1 }),
        new LocationModel({ ...validLocationData, id: '4', code: 'B', name: 'B区', level: 0 }),
      ];
      
      const hierarchy = LocationModel.buildHierarchy(locations);
      
      expect(hierarchy).toHaveLength(2); // A区和B区
      expect(hierarchy[0].children).toHaveLength(2); // A区有2个子级
      expect(hierarchy[1].children).toHaveLength(0); // B区没有子级
    });

    it('应该正确获取所有子级ID', () => {
      const locations = [
        new LocationModel({ ...validLocationData, id: '1', code: 'A', name: 'A区', level: 0 }),
        new LocationModel({ ...validLocationData, id: '2', code: 'A-01', name: 'A区1号', parentId: '1', level: 1 }),
        new LocationModel({ ...validLocationData, id: '3', code: 'A-01-01', name: 'A区1号货架1', parentId: '2', level: 2 }),
        new LocationModel({ ...validLocationData, id: '4', code: 'A-02', name: 'A区2号', parentId: '1', level: 1 }),
      ];
      
      const childrenIds = LocationModel.getAllChildrenIds('1', locations);
      
      expect(childrenIds).toContain('2');
      expect(childrenIds).toContain('3');
      expect(childrenIds).toContain('4');
      expect(childrenIds).toHaveLength(3);
    });
  });
});