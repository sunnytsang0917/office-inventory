import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

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

describe('Report API', () => {
  let app: express.Application;
  let mockClient: any;
  let mockPool: any;

  beforeAll(async () => {
    app = createTestApp();
    
    // 获取模拟的数据库连接池
    const { pool } = await import('../config/database');
    mockPool = pool;

    // 设置模拟客户端
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    mockPool.connect.mockResolvedValue(mockClient);
  });

  afterAll(async () => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/reports/types', () => {
    it('应该返回可用的报表类型', async () => {
      const response = await request(app)
        .get('/api/v1/reports/types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const reportTypes = response.body.data.map((report: any) => report.type);
      expect(reportTypes).toContain('monthly-stats');
      expect(reportTypes).toContain('item-usage');
      expect(reportTypes).toContain('inventory-status');
      expect(reportTypes).toContain('transaction-history');
    });
  });

  describe('GET /api/v1/reports/monthly-stats', () => {
    it('应该返回月度统计数据', async () => {
      // 模拟月度统计查询结果
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            month: '2024-01',
            inbound_total: '80',
            outbound_total: '30',
            net_change: '50',
            item_count: '2'
          }
        ]
      });

      const response = await request(app)
        .get('/api/v1/reports/monthly-stats')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-02-28'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      const monthlyData = response.body.data[0];
      expect(monthlyData).toHaveProperty('month');
      expect(monthlyData).toHaveProperty('inboundTotal');
      expect(monthlyData).toHaveProperty('outboundTotal');
      expect(monthlyData).toHaveProperty('netChange');
      expect(monthlyData).toHaveProperty('itemCount');
    });

    it('应该验证日期范围', async () => {
      const response = await request(app)
        .get('/api/v1/reports/monthly-stats')
        .query({
          startDate: '2024-02-01',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('开始日期不能晚于结束日期');
    });
  });

  describe('GET /api/v1/reports/item-usage', () => {
    it('应该返回物品使用排行数据', async () => {
      // 模拟物品使用排行查询结果
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            item_name: '测试物品A',
            category: '办公用品',
            total_outbound: '20',
            frequency: '1',
            last_used_date: '2024-01-20'
          }
        ]
      });

      const response = await request(app)
        .get('/api/v1/reports/item-usage')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-02-28'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      if (response.body.data.length > 0) {
        const usageData = response.body.data[0];
        expect(usageData).toHaveProperty('itemName');
        expect(usageData).toHaveProperty('category');
        expect(usageData).toHaveProperty('totalOutbound');
        expect(usageData).toHaveProperty('frequency');
        expect(usageData).toHaveProperty('lastUsedDate');
      }
    });
  });

  describe('报表导出功能', () => {
    it('应该支持导出月度统计CSV', async () => {
      // 模拟月度统计查询结果
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            month: '2024-01',
            inbound_total: '80',
            outbound_total: '30',
            net_change: '50',
            item_count: '2'
          }
        ]
      });

      const response = await request(app)
        .get('/api/v1/reports/monthly-stats/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-02-28',
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(typeof response.text).toBe('string');
      expect(response.text).toContain('月份'); // 检查CSV包含中文表头
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的日期格式', async () => {
      const response = await request(app)
        .get('/api/v1/reports/monthly-stats')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-02-28'
        });

      // 由于日期验证可能在不同层级处理，我们检查是否返回了错误
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该处理无效的导出格式', async () => {
      const response = await request(app)
        .get('/api/v1/reports/monthly-stats/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-02-28',
          format: 'invalid-format'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});