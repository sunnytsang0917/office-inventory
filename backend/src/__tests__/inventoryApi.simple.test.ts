import request from 'supertest';
import { app } from '../index';
import { pool } from '../config/database';

describe('Inventory API Simple Tests', () => {
  let testItemId: string;
  let testLocationId: string;

  beforeAll(async () => {
    // 清理测试数据
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM items WHERE 1=1');
    await pool.query('DELETE FROM locations WHERE 1=1');

    // 创建测试位置
    const locationResult = await pool.query(`
      INSERT INTO locations (code, name, description, level, is_active)
      VALUES ('TEST-A-01', '测试位置A-01', '测试用位置A-01', 0, true)
      RETURNING id
    `);
    testLocationId = locationResult.rows[0].id;

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
      VALUES ($1, $2, 'inbound', 50, CURRENT_DATE, '测试操作员', '测试供应商')
    `, [testItemId, testLocationId]);
  });

  afterAll(async () => {
    // 清理测试数据
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM items WHERE 1=1');
    await pool.query('DELETE FROM locations WHERE 1=1');
    await pool.end();
  });

  describe('Basic Inventory API Tests', () => {
    it('应该返回库存状态列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存状态获取成功');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该返回库存统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('库存统计信息获取成功');
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalLocations');
      expect(response.body.data).toHaveProperty('totalStock');
    });

    it('应该返回低库存预警列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('低库存预警列表获取成功');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});