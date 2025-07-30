import request from 'supertest';
import { app } from '../index';
import { pool } from '../config/database';

describe('Inventory API Integration Tests', () => {
  let testItemId: string;
  let testLocationId: string;
  let testLocation2Id: string;

  beforeAll(async () => {
    // 清理测试数据
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM items WHERE 1=1');
    await pool.query('DELETE FROM locations WHERE 1=1');

    // 创建测试位置
    const location1Result = await pool.query(`
      INSERT INTO locations (code, name, description, level, is_active)
      VALUES ('TEST-A-01', '测试位置A-01', '测试用位置A-01', 0, true)
      RETURNING id
    `);
    testLocationId = location1Result.rows[0].id;

    const location2Result = await pool.query(`
      INSERT INTO locations (code, name, description, level, is_active)
      VALUES ('TEST-B-01', '测试位置B-01', '测试用位置B-01', 0, true)
      RETURNING id
    `);
    testLocation2Id = location2Result.rows[0].id;

    // 创建测试物品
    const itemResult = await pool.query(`
      INSERT INTO items (name, category, specification, unit, default_location_id, low_stock_threshold)
      VALUES ('测试物品', '办公用品', '测试规格', '个', $1, 10)
      RETURNING id
    `, [testLocationId]);
    testItemId = itemResult.rows[0].id;

    // 创建测试交易记录
    await pool.query(`
      INSERT INTO transactions (item_id, location_id, type, quantity, date, operator, supplier)
      VALUES 
        ($1, $2, 'inbound', 50, CURRENT_DATE - INTERVAL '5 days', '测试操作员', '测试供应商'),
        ($1, $2, 'outbound', 15, CURRENT_DATE - INTERVAL '3 days', '测试操作员', NULL),
        ($1, $3, 'inbound', 30, CURRENT_DATE - INTERVAL '2 days', '测试操作员', '测试供应商'),
        ($1, $3, 'outbound', 5, CURRENT_DATE - INTERVAL '1 day', '测试操作员', NULL)
    `, [testItemId, testLocationId, testLocation2Id]);
  });

  afterAll(async () => {
    // 清理测试数据
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM items WHERE 1=1');
    await pool.query('DELETE FROM locations WHERE 1=1');
    await pool.end();
  });

  describe('GET /api/v1/inventory', () => {
    it('应该返回库存状态列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存状态获取成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const inventoryItem = response.body.data[0];
      expect(inventoryItem).toHaveProperty('itemId');
      expect(inventoryItem).toHaveProperty('itemName');
      expect(inventoryItem).toHaveProperty('category');
      expect(inventoryItem).toHaveProperty('unit');
      expect(inventoryItem).toHaveProperty('locationId');
      expect(inventoryItem).toHaveProperty('locationCode');
      expect(inventoryItem).toHaveProperty('locationName');
      expect(inventoryItem).toHaveProperty('currentStock');
      expect(inventoryItem).toHaveProperty('lowStockThreshold');
      expect(inventoryItem).toHaveProperty('isLowStock');
    });

    it('应该支持按类别筛选', async () => {
      const response = await request(app)
        .get('/api/v1/inventory?category=办公用品')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('办公用品');
      });
    });

    it('应该支持按位置筛选', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory?locationId=${testLocationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.locationId).toBe(testLocationId);
      });
    });

    it('应该支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/v1/inventory?search=测试物品')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.itemName).toContain('测试物品');
      });
    });

    it('应该支持低库存筛选', async () => {
      const response = await request(app)
        .get('/api/v1/inventory?isLowStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.isLowStock).toBe(true);
      });
    });

    it('应该支持有库存筛选', async () => {
      const response = await request(app)
        .get('/api/v1/inventory?hasStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.currentStock).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/inventory/search', () => {
    it('应该返回搜索结果', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/search?q=测试')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存搜索成功');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该在缺少搜索关键词时返回错误', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('搜索关键词不能为空');
    });
  });

  describe('GET /api/v1/inventory/low-stock', () => {
    it('应该返回低库存预警列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('低库存预警列表获取成功');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const lowStockItem = response.body.data[0];
        expect(lowStockItem).toHaveProperty('itemId');
        expect(lowStockItem).toHaveProperty('itemName');
        expect(lowStockItem).toHaveProperty('category');
        expect(lowStockItem).toHaveProperty('unit');
        expect(lowStockItem).toHaveProperty('locationId');
        expect(lowStockItem).toHaveProperty('locationCode');
        expect(lowStockItem).toHaveProperty('locationName');
        expect(lowStockItem).toHaveProperty('currentStock');
        expect(lowStockItem).toHaveProperty('lowStockThreshold');
        expect(lowStockItem).toHaveProperty('stockDeficit');
        expect(lowStockItem.currentStock).toBeLessThanOrEqual(lowStockItem.lowStockThreshold);
      }
    });

    it('应该支持自定义阈值', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/low-stock?threshold=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该在阈值无效时返回错误', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/low-stock?threshold=-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('阈值必须是非负整数');
    });
  });

  describe('GET /api/v1/inventory/items/:itemId', () => {
    it('应该返回物品库存详情', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/items/${testItemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('物品库存详情获取成功');
      expect(response.body.data).toHaveProperty('itemId', testItemId);
      expect(response.body.data).toHaveProperty('itemName');
      expect(response.body.data).toHaveProperty('category');
      expect(response.body.data).toHaveProperty('unit');
      expect(response.body.data).toHaveProperty('lowStockThreshold');
      expect(response.body.data).toHaveProperty('totalStock');
      expect(response.body.data).toHaveProperty('locationStocks');
      expect(response.body.data).toHaveProperty('recentTransactions');

      expect(Array.isArray(response.body.data.locationStocks)).toBe(true);
      expect(Array.isArray(response.body.data.recentTransactions)).toBe(true);

      if (response.body.data.locationStocks.length > 0) {
        const locationStock = response.body.data.locationStocks[0];
        expect(locationStock).toHaveProperty('locationId');
        expect(locationStock).toHaveProperty('locationCode');
        expect(locationStock).toHaveProperty('locationName');
        expect(locationStock).toHaveProperty('stock');
        expect(locationStock).toHaveProperty('isLowStock');
      }

      if (response.body.data.recentTransactions.length > 0) {
        const transaction = response.body.data.recentTransactions[0];
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('quantity');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('operator');
        expect(transaction).toHaveProperty('locationName');
        expect(transaction).toHaveProperty('locationCode');
      }
    });

    it('应该在物品不存在时返回404', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/inventory/items/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取物品库存详情失败');
    });
  });

  describe('GET /api/v1/inventory/items/:itemId/history', () => {
    it('应该返回库存变化历史', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/items/${testItemId}/history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存变化历史获取成功');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const historyItem = response.body.data[0];
        expect(historyItem).toHaveProperty('date');
        expect(historyItem).toHaveProperty('inbound');
        expect(historyItem).toHaveProperty('outbound');
        expect(historyItem).toHaveProperty('netChange');
        expect(historyItem).toHaveProperty('runningStock');
      }
    });

    it('应该支持指定位置的历史', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/items/${testItemId}/history?locationId=${testLocationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该支持自定义天数', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/items/${testItemId}/history?days=7`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该在天数无效时返回错误', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/items/${testItemId}/history?days=0`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('天数必须是1-365之间的整数');
    });
  });

  describe('GET /api/v1/inventory/locations/:locationId', () => {
    it('应该返回位置库存汇总', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/locations/${testLocationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('位置库存汇总获取成功');
      expect(response.body.data).toHaveProperty('locationInfo');
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalStock');
      expect(response.body.data).toHaveProperty('lowStockItems');
      expect(response.body.data).toHaveProperty('items');

      expect(response.body.data.locationInfo).toHaveProperty('id', testLocationId);
      expect(response.body.data.locationInfo).toHaveProperty('code');
      expect(response.body.data.locationInfo).toHaveProperty('name');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('应该在位置不存在时返回404', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/inventory/locations/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取位置库存汇总失败');
    });
  });

  describe('GET /api/v1/inventory/statistics', () => {
    it('应该返回库存统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存统计信息获取成功');
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalLocations');
      expect(response.body.data).toHaveProperty('totalStock');
      expect(response.body.data).toHaveProperty('lowStockAlerts');
      expect(response.body.data).toHaveProperty('zeroStockItems');
      expect(response.body.data).toHaveProperty('topCategories');
      expect(response.body.data).toHaveProperty('topLocations');

      expect(Array.isArray(response.body.data.topCategories)).toBe(true);
      expect(Array.isArray(response.body.data.topLocations)).toBe(true);
    });
  });

  describe('GET /api/v1/inventory/overview', () => {
    it('应该返回库存概览', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存概览获取成功');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('lowStockCount');
      expect(response.body.data).toHaveProperty('criticalLowStock');
      expect(response.body.data).toHaveProperty('activeLocationsWithStock');
      expect(response.body.data).toHaveProperty('totalStockValue');
      expect(response.body.data).toHaveProperty('recentActivity');
    });
  });

  describe('POST /api/v1/inventory/check-availability', () => {
    it('应该检查库存可用性', async () => {
      const checkData = {
        items: [
          {
            itemId: testItemId,
            locationId: testLocationId,
            quantity: 10
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/inventory/check-availability')
        .send(checkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('allAvailable');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('unavailableCount');
      expect(response.body.data).toHaveProperty('unavailableItems');

      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.results.length).toBe(1);

      const result = response.body.data.results[0];
      expect(result).toHaveProperty('itemId', testItemId);
      expect(result).toHaveProperty('itemName');
      expect(result).toHaveProperty('locationId', testLocationId);
      expect(result).toHaveProperty('requestedQuantity', 10);
      expect(result).toHaveProperty('currentStock');
      expect(result).toHaveProperty('isAvailable');
      expect(result).toHaveProperty('shortage');
    });

    it('应该在物品列表为空时返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/check-availability')
        .send({ items: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('物品列表不能为空');
    });

    it('应该在物品信息格式不正确时返回错误', async () => {
      const checkData = {
        items: [
          {
            itemId: testItemId,
            // 缺少 locationId 和 quantity
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/inventory/check-availability')
        .send(checkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('物品信息格式不正确，需要包含itemId、locationId和quantity');
    });

    it('应该检测库存不足的情况', async () => {
      const checkData = {
        items: [
          {
            itemId: testItemId,
            locationId: testLocationId,
            quantity: 1000 // 超过实际库存
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/inventory/check-availability')
        .send(checkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.allAvailable).toBe(false);
      expect(response.body.data.unavailableCount).toBe(1);
      expect(response.body.data.results[0].isAvailable).toBe(false);
      expect(response.body.data.results[0].shortage).toBeGreaterThan(0);
    });
  });
});