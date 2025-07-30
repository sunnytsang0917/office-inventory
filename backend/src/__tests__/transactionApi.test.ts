import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// 模拟数据库模块 - 必须在其他导入之前
vi.mock('../config/database', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}));

// 模拟ItemService
vi.mock('../services/ItemService', () => {
  const mockItemService = {
    getItem: vi.fn().mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '测试物品',
      category: '办公用品',
      unit: '个',
    }),
  };

  return {
    ItemService: vi.fn().mockImplementation(() => mockItemService),
    default: vi.fn().mockImplementation(() => mockItemService),
  };
});

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

describe('Transaction API Integration Tests', () => {
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
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 创建模拟的数据库客户端
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    
    mockPool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  describe(
'POST /api/v1/transactions', () => {
    it('应该成功创建交易记录', async () => {
      const transactionData = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        locationId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'inbound',
        quantity: 100,
        date: '2024-01-01T00:00:00.000Z',
        operator: '张三',
        supplier: '测试供应商',
        notes: '测试备注'
      };

      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...transactionData,
        created_at: new Date(),
      };

      // 模拟数据库操作
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTransaction] }); // INSERT

      const response = await request(app)
        .post('/api/v1/transactions')
        .send(transactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: '交易记录创建成功',
        data: expect.objectContaining({
          itemId: transactionData.itemId,
          locationId: transactionData.locationId,
          type: transactionData.type,
          quantity: transactionData.quantity,
        }),
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        // 缺少必填字段
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/transactions/inbound', () => {
    it('应该成功创建入库记录', async () => {
      const inboundData = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        locationId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 100,
        date: '2024-01-01T00:00:00.000Z',
        operator: '张三',
        supplier: '测试供应商',
        notes: '入库测试'
      };

      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...inboundData,
        type: 'inbound',
        created_at: new Date(),
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTransaction] }); // INSERT

      const response = await request(app)
        .post('/api/v1/transactions/inbound')
        .send(inboundData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: '入库记录创建成功',
        data: expect.objectContaining({
          type: 'inbound',
          supplier: inboundData.supplier,
        }),
      });
    });
  });

  describe('POST /api/v1/transactions/outbound', () => {
    it('应该成功创建出库记录', async () => {
      const outboundData = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        locationId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 10,
        date: '2024-01-01T00:00:00.000Z',
        operator: '李四',
        recipient: '王五',
        purpose: '办公使用',
        notes: '出库测试'
      };

      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        ...outboundData,
        type: 'outbound',
        created_at: new Date(),
      };

      // 模拟库存检查和交易创建
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ stock: 50 }] }) // 库存检查
        .mockResolvedValueOnce({ rows: [mockTransaction] }); // INSERT

      const response = await request(app)
        .post('/api/v1/transactions/outbound')
        .send(outboundData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: '出库记录创建成功',
        data: expect.objectContaining({
          type: 'outbound',
          recipient: outboundData.recipient,
          purpose: outboundData.purpose,
        }),
      });
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('应该返回交易历史记录', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          item_id: '123e4567-e89b-12d3-a456-426614174000',
          location_id: '123e4567-e89b-12d3-a456-426614174001',
          type: 'inbound',
          quantity: 100,
          date: new Date('2024-01-01'),
          operator: '张三',
          supplier: '测试供应商',
          item_name: '测试物品',
          location_name: 'A区1号位置',
          location_code: 'A-01',
          created_at: new Date(),
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // COUNT
        .mockResolvedValueOnce({ rows: mockTransactions }); // SELECT

      const response = await request(app)
        .get('/api/v1/transactions')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockTransactions[0].id,
            type: 'inbound',
            quantity: 100,
          }),
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
      });
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('应该返回交易记录详情', async () => {
      const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        location_id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'inbound',
        quantity: 100,
        date: new Date('2024-01-01'),
        operator: '张三',
        supplier: '测试供应商',
        item_name: '测试物品',
        location_name: 'A区1号位置',
        location_code: 'A-01',
        created_at: new Date(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockTransaction] });

      const response = await request(app)
        .get('/api/v1/transactions/123e4567-e89b-12d3-a456-426614174002')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: mockTransaction.id,
          type: 'inbound',
          quantity: 100,
        }),
      });
    });
  });

  describe('GET /api/v1/transactions/statistics', () => {
    it('应该返回交易统计信息', async () => {
      const mockStats = [
        { total_inbound: '500', total_outbound: '200', transaction_count: '10' }
      ];
      const mockTopItems = [
        { item_id: '123', item_name: '物品A', total_quantity: '300', transaction_count: '5' }
      ];
      const mockTopLocations = [
        { location_id: '456', location_name: '位置A', total_quantity: '400', transaction_count: '6' }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockStats }) // 基础统计
        .mockResolvedValueOnce({ rows: mockTopItems }) // 热门物品
        .mockResolvedValueOnce({ rows: mockTopLocations }); // 热门位置

      const response = await request(app)
        .get('/api/v1/transactions/statistics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalInbound: 500,
          totalOutbound: 200,
          transactionCount: 10,
          topItems: expect.arrayContaining([
            expect.objectContaining({
              itemName: '物品A',
              totalQuantity: 300,
            }),
          ]),
          topLocations: expect.arrayContaining([
            expect.objectContaining({
              locationName: '位置A',
              totalQuantity: 400,
            }),
          ]),
        }),
      });
    });
  });

  describe('Template Downloads', () => {
    it('应该下载入库模板', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/inbound/template/download')
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('inbound_template.xlsx');
    });

    it('应该下载出库模板', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/outbound/template/download')
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('outbound_template.xlsx');
    });
  });
});