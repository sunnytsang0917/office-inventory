import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';

// 模拟数据库模块 - 必须在其他导入之前
vi.mock('../config/database', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}));

import routes from '../routes';
import { errorHandler } from '../middleware/errorHandler';

// 创建测试应用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', routes);
  app.use(errorHandler);
  return app;
};

describe('Location API Integration Tests', () => {
  let app: express.Application;
  let mockClient: any;
  let mockPool: any;

  beforeAll(async () => {
    app = createTestApp();
    // 获取模拟的数据库连接池
    const { pool } = await import('../config/database');
    mockPool = pool;
  });

  beforeEach(() => {
    // 重置模拟
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    
    // 模拟连接池
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient);
    vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/locations', () => {
    it('应该成功创建根级位置', async () => {
      const locationData = {
        code: 'A-01',
        name: 'A区1号位置',
        description: '主仓库A区第1个位置',
        level: 0,
        isActive: true,
      };

      const mockCreatedLocation = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'A-01',
        name: 'A区1号位置',
        description: '主仓库A区第1个位置',
        parent_id: null,
        level: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // 检查编码重复
        .mockResolvedValueOnce({ rows: [mockCreatedLocation] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/v1/locations')
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置创建成功');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.code).toBe(locationData.code);
      expect(response.body.data.name).toBe(locationData.name);
    });

    it('应该成功创建子级位置', async () => {
      const parentId = '123e4567-e89b-12d3-a456-426614174000';
      const locationData = {
        code: 'A-01-01',
        name: 'A区1号位置货架1',
        parentId,
        level: 1,
        isActive: true,
      };

      const mockParentLocation = {
        id: parentId,
        code: 'A-01',
        name: 'A区1号位置',
        parent_id: null,
        level: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockCreatedLocation = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        code: 'A-01-01',
        name: 'A区1号位置货架1',
        parent_id: parentId,
        level: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockParentLocation] }) // 查找父级位置
        .mockResolvedValueOnce({ rows: [] }) // 检查编码重复
        .mockResolvedValueOnce({ rows: [mockCreatedLocation] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/v1/locations')
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parentId).toBe(parentId);
      expect(response.body.data.level).toBe(1);
    });

    it('应该拒绝无效的位置数据', async () => {
      const invalidData = {
        code: '', // 空编码
        name: 'A区1号位置',
      };

      const response = await request(app)
        .post('/api/v1/locations')
        .send(invalidData)
        .expect(500); // 验证错误会被错误处理器捕获

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝重复的位置编码', async () => {
      const locationData = {
        code: 'A-01',
        name: 'A区1号位置',
        level: 0,
      };

      // 模拟编码已存在
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }) // 编码重复检查
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await request(app)
        .post('/api/v1/locations')
        .send(locationData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/locations', () => {
    it('应该返回位置列表', async () => {
      const mockLocations = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          code: 'A-01',
          name: 'A区1号位置',
          description: null,
          parent_id: null,
          level: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          code: 'A-02',
          name: 'A区2号位置',
          description: null,
          parent_id: null,
          level: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({ rows: mockLocations });

      const response = await request(app)
        .get('/api/v1/locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置列表获取成功');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].code).toBe('A-01');
      expect(response.body.data[1].code).toBe('A-02');
    });

    it('应该支持查询参数过滤', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/v1/locations')
        .query({
          level: '0',
          isActive: 'true',
          search: 'A区',
        })
        .expect(200);

      // 验证查询参数被正确传递
      expect(vi.mocked(mockPool.query)).toHaveBeenCalledWith(
        expect.stringContaining('level = $'),
        expect.arrayContaining([0, '%A区%'])
      );
    });
  });

  describe('GET /api/v1/locations/hierarchy', () => {
    it('应该返回层级结构', async () => {
      const mockLocations = [
        {
          id: '1',
          code: 'A',
          name: 'A区',
          description: null,
          parent_id: null,
          level: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          code: 'A-01',
          name: 'A区1号',
          description: null,
          parent_id: '1',
          level: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({ rows: mockLocations });

      const response = await request(app)
        .get('/api/v1/locations/hierarchy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置层级结构获取成功');
      expect(response.body.data).toHaveLength(1); // 一个根级位置
      expect(response.body.data[0].children).toHaveLength(1); // 一个子级位置
    });
  });

  describe('GET /api/v1/locations/:id', () => {
    it('应该返回指定位置', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockLocation = {
        id: locationId,
        code: 'A-01',
        name: 'A区1号位置',
        description: null,
        parent_id: null,
        level: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockPool.query).mockResolvedValue({ rows: [mockLocation] });

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置获取成功');
      expect(response.body.data.id).toBe(locationId);
      expect(response.body.data.code).toBe('A-01');
    });

    it('应该在位置不存在时返回404', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';

      vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('位置不存在');
    });
  });

  describe('PUT /api/v1/locations/:id', () => {
    it('应该成功更新位置', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: '更新后的位置名称',
        description: '更新后的描述',
      };

      const mockCurrentLocation = {
        id: locationId,
        code: 'A-01',
        name: 'A区1号位置',
        description: null,
        parent_id: null,
        level: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdatedLocation = {
        ...mockCurrentLocation,
        name: updateData.name,
        description: updateData.description,
        updated_at: new Date().toISOString(),
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCurrentLocation] }) // 查找当前位置
        .mockResolvedValueOnce({ rows: [mockUpdatedLocation] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .put(`/api/v1/locations/${locationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置更新成功');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/v1/locations/:id', () => {
    it('应该成功删除位置', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';

      const mockLocation = {
        id: locationId,
        code: 'A-01',
        name: 'A区1号位置',
        parent_id: null,
        level: 0,
        is_active: true,
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockLocation] }) // 查找位置
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 检查子级位置
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 检查库存记录
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 检查默认位置使用
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .delete(`/api/v1/locations/${locationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置删除成功');
    });

    it('应该拒绝删除有子级位置的位置', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';

      const mockLocation = {
        id: locationId,
        code: 'A-01',
        name: 'A区1号位置',
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockLocation] }) // 查找位置
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // 检查子级位置（有子级）
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await request(app)
        .delete(`/api/v1/locations/${locationId}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/locations/:id/inventory', () => {
    it('应该返回位置库存信息', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockInventory = [
        {
          location_id: locationId,
          location_code: 'A-01',
          location_name: 'A区1号位置',
          item_id: '456e7890-e89b-12d3-a456-426614174000',
          item_name: '办公用笔',
          current_stock: 100,
          last_transaction_date: new Date().toISOString(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({ rows: mockInventory });

      const response = await request(app)
        .get(`/api/v1/locations/${locationId}/inventory`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置库存信息获取成功');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].locationId).toBe(locationId);
      expect(response.body.data[0].currentStock).toBe(100);
    });
  });

  describe('POST /api/v1/locations/set-default', () => {
    it('应该成功设置物品默认位置', async () => {
      const requestData = {
        itemId: '456e7890-e89b-12d3-a456-426614174000',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockLocation = {
        id: requestData.locationId,
        is_active: true,
      };

      const mockItem = {
        id: requestData.itemId,
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockLocation] }) // 检查位置
        .mockResolvedValueOnce({ rows: [mockItem] }) // 检查物品
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/v1/locations/set-default')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('物品默认位置设置成功');
    });

    it('应该拒绝缺少参数的请求', async () => {
      const response = await request(app)
        .post('/api/v1/locations/set-default')
        .send({ itemId: '456e7890-e89b-12d3-a456-426614174000' }) // 缺少locationId
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('物品ID和位置ID都是必需的');
    });
  });
});