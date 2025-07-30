"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const database_1 = require("../config/database");
describe('Inventory API Simple Tests', () => {
    let testItemId;
    let testLocationId;
    beforeAll(async () => {
        await database_1.pool.query('DELETE FROM transactions WHERE 1=1');
        await database_1.pool.query('DELETE FROM items WHERE 1=1');
        await database_1.pool.query('DELETE FROM locations WHERE 1=1');
        const locationResult = await database_1.pool.query(`
      INSERT INTO locations (code, name, description, level, is_active)
      VALUES ('TEST-A-01', '测试位置A-01', '测试用位置A-01', 0, true)
      RETURNING id
    `);
        testLocationId = locationResult.rows[0].id;
        const itemResult = await database_1.pool.query(`
      INSERT INTO items (name, category, specification, unit, default_location_id, low_stock_threshold)
      VALUES ('测试物品', '办公用品', '测试规格', '个', $1, 10)
      RETURNING id
    `, [testLocationId]);
        testItemId = itemResult.rows[0].id;
        await database_1.pool.query(`
      INSERT INTO transactions (item_id, location_id, type, quantity, date, operator, supplier)
      VALUES ($1, $2, 'inbound', 50, CURRENT_DATE, '测试操作员', '测试供应商')
    `, [testItemId, testLocationId]);
    });
    afterAll(async () => {
        await database_1.pool.query('DELETE FROM transactions WHERE 1=1');
        await database_1.pool.query('DELETE FROM items WHERE 1=1');
        await database_1.pool.query('DELETE FROM locations WHERE 1=1');
        await database_1.pool.end();
    });
    describe('Basic Inventory API Tests', () => {
        it('应该返回库存状态列表', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/api/v1/inventory')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('库存状态获取成功');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        it('应该返回库存统计信息', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/api/v1/inventory/statistics')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('库存统计信息获取成功');
            expect(response.body.data).toHaveProperty('totalItems');
            expect(response.body.data).toHaveProperty('totalLocations');
            expect(response.body.data).toHaveProperty('totalStock');
        });
        it('应该返回低库存预警列表', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/api/v1/inventory/low-stock')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('低库存预警列表获取成功');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
//# sourceMappingURL=inventoryApi.simple.test.js.map