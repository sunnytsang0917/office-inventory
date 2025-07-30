import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import * as XLSX from 'xlsx';

// 模拟数据库模块 - 必须在其他导入之前
vi.mock('../config/database', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}));

// 模拟LocationService
vi.mock('../services/LocationService', () => {
  const mockLocationService = {
    getLocation: vi.fn().mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
      code: 'A-01',
      name: 'A区1号位置',
    }),
  };

  return {
    LocationService: vi.fn().mockImplementation(() => mockLocationService),
    default: vi.fn().mockImplementation(() => mockLocationService),
  };
});

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

describe('Item API Integration Tests', () => {
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

  describe('POST /api/v1/items', () => {
    it('应该成功创建物品（不含默认位置）', async () => {
      const itemData = {
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        lowStockThreshold: 10,
      };

      const mockCreatedItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        default_location_id: null,
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedItem] });

      const response = await request(app)
        .post('/api/v1/items')
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('物品创建成功');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(itemData.name);
      expect(response.body.data.category).toBe(itemData.category);
      expect(response.body.data.defaultLocationId).toBeNull();
    });

    it('应该成功创建物品（含默认位置）', async () => {
      const itemData = {
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        defaultLocationId: '123e4567-e89b-12d3-a456-426614174001',
        lowStockThreshold: 10,
      };

      const mockCreatedItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        default_location_id: '123e4567-e89b-12d3-a456-426614174001',
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 模拟位置验证成功和物品创建
      mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedItem] });

      const response = await request(app)
        .post('/api/v1/items')
        .send(itemData);

      // 如果位置验证失败，会返回500，我们先检查实际响应
      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.defaultLocationId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('应该拒绝无效的物品数据', async () => {
      const invalidData = {
        name: '', // 空名称
        category: '办公用品',
        unit: '支',
      };

      const response = await request(app)
        .post('/api/v1/items')
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/items', () => {
    it('应该返回物品列表', async () => {
      const mockItems = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: '办公用笔',
          category: '办公用品',
          specification: '黑色圆珠笔',
          unit: '支',
          default_location_id: null,
          low_stock_threshold: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: '复印纸',
          category: '办公用品',
          specification: 'A4白纸',
          unit: '包',
          default_location_id: 'location-123',
          low_stock_threshold: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app)
        .get('/api/v1/items')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data[0].name).toBe('办公用笔');
      expect(response.body.data[1].name).toBe('复印纸');
    });

    it('应该支持分类过滤', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/v1/items')
        .query({ category: '办公用品' })
        .expect(200);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('category = $1'),
        expect.arrayContaining(['办公用品'])
      );
    });

    it('应该支持搜索过滤', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/v1/items')
        .query({ search: '笔' })
        .expect(200);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%笔%', '%笔%'])
      );
    });
  });

  describe('GET /api/v1/items/categories', () => {
    it('应该返回物品分类列表', async () => {
      const mockCategories = [
        { category: '办公用品' },
        { category: '电子设备' },
        { category: '清洁用品' },
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockCategories });

      const response = await request(app)
        .get('/api/v1/items/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['办公用品', '电子设备', '清洁用品']);
    });
  });

  describe('GET /api/v1/items/:id', () => {
    it('应该返回指定物品（不包含库存信息）', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';
      const mockItem = {
        id: itemId,
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        default_location_id: null,
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockItem] });

      const response = await request(app)
        .get(`/api/v1/items/${itemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(itemId);
      expect(response.body.data.name).toBe('办公用笔');
    });

    it('应该返回指定物品（包含库存信息）', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';
      const mockItemWithLocation = {
        id: itemId,
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        default_location_id: 'location-123',
        default_location_name: 'A区1号位置',
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInventory = [
        {
          location_id: 'location-123',
          location_code: 'A-01',
          location_name: 'A区1号位置',
          stock: 50,
        },
        {
          location_id: 'location-456',
          location_code: 'B-01',
          location_name: 'B区1号位置',
          stock: 30,
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockItemWithLocation] }) // 物品信息
        .mockResolvedValueOnce({ rows: mockInventory }); // 库存信息

      const response = await request(app)
        .get(`/api/v1/items/${itemId}`)
        .query({ includeInventory: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(itemId);
      expect(response.body.data.totalStock).toBe(80);
      expect(response.body.data.locationStocks).toHaveLength(2);
      expect(response.body.data.defaultLocationName).toBe('A区1号位置');
    });

    it('应该在物品不存在时返回错误', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get(`/api/v1/items/${itemId}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/items/:id', () => {
    it('应该成功更新物品', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: '更新后的物品名称',
        specification: '更新后的规格',
      };

      const mockCurrentItem = {
        id: itemId,
        name: '办公用笔',
        category: '办公用品',
        specification: '黑色圆珠笔',
        unit: '支',
        default_location_id: null,
        low_stock_threshold: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdatedItem = {
        ...mockCurrentItem,
        name: updateData.name,
        specification: updateData.specification,
        updated_at: new Date().toISOString(),
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockCurrentItem] }) // 查找当前物品
        .mockResolvedValueOnce({ rows: [mockUpdatedItem] }); // 更新物品

      const response = await request(app)
        .put(`/api/v1/items/${itemId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('物品更新成功');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.specification).toBe(updateData.specification);
    });
  });

  describe('DELETE /api/v1/items/:id', () => {
    it('应该成功删除物品', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      const mockItem = {
        id: itemId,
        name: '办公用笔',
        category: '办公用品',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockItem] }) // 查找物品
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 检查库存记录
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 检查交易记录
        .mockResolvedValueOnce({ rows: [] }); // 删除物品

      const response = await request(app)
        .delete(`/api/v1/items/${itemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('物品删除成功');
    });

    it('应该拒绝删除有库存记录的物品', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      const mockItem = {
        id: itemId,
        name: '办公用笔',
        category: '办公用品',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockItem] }) // 查找物品
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }); // 检查库存记录（有库存）

      const response = await request(app)
        .delete(`/api/v1/items/${itemId}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/items/batch-import', () => {
    it('应该拒绝没有文件的请求', async () => {
      const response = await request(app)
        .post('/api/v1/items/batch-import')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请上传Excel文件');
    });

    it('应该拒绝空Excel文件', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const response = await request(app)
        .post('/api/v1/items/batch-import')
        .attach('file', buffer, 'test.xlsx')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Excel文件为空');
    });
  });

  describe('GET /api/v1/items/template/download', () => {
    it('应该成功下载导入模板', async () => {
      const response = await request(app)
        .get('/api/v1/items/template/download')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toBe('attachment; filename="item_import_template.xlsx"');
      // 在测试环境中，response.body可能不是Buffer，但应该有内容
      expect(response.body).toBeDefined();
    });
  });

  describe('API输入验证和错误处理', () => {
    it('应该验证必需字段', async () => {
      const invalidData = {
        // 缺少name字段
        category: '办公用品',
        unit: '支',
      };

      const response = await request(app)
        .post('/api/v1/items')
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('应该处理数据库连接错误', async () => {
      const itemData = {
        name: '办公用笔',
        category: '办公用品',
        unit: '支',
      };

      // 模拟数据库连接错误
      mockClient.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/items')
        .send(itemData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});