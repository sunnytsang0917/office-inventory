"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const XLSX = __importStar(require("xlsx"));
vitest_1.vi.mock('../config/database', () => ({
    pool: {
        connect: vitest_1.vi.fn(),
        query: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../services/LocationService', () => {
    const mockLocationService = {
        getLocation: vitest_1.vi.fn().mockResolvedValue({
            id: '123e4567-e89b-12d3-a456-426614174001',
            code: 'A-01',
            name: 'A区1号位置',
        }),
    };
    return {
        LocationService: vitest_1.vi.fn().mockImplementation(() => mockLocationService),
        default: vitest_1.vi.fn().mockImplementation(() => mockLocationService),
    };
});
const routes_1 = __importDefault(require("../routes"));
const errorHandler_1 = require("../middleware/errorHandler");
const createTestApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/', routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
};
(0, vitest_1.describe)('Item API Integration Tests', () => {
    let app;
    let mockClient;
    let mockPool;
    (0, vitest_1.beforeAll)(async () => {
        app = createTestApp();
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        mockPool = pool;
    });
    (0, vitest_1.beforeEach)(() => {
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn(),
        };
        vitest_1.vi.mocked(mockPool.connect).mockResolvedValue(mockClient);
        vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /api/v1/items', () => {
        (0, vitest_1.it)('应该成功创建物品（不含默认位置）', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items')
                .send(itemData)
                .expect(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('物品创建成功');
            (0, vitest_1.expect)(response.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(response.body.data.name).toBe(itemData.name);
            (0, vitest_1.expect)(response.body.data.category).toBe(itemData.category);
            (0, vitest_1.expect)(response.body.data.defaultLocationId).toBeNull();
        });
        (0, vitest_1.it)('应该成功创建物品（含默认位置）', async () => {
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
            mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedItem] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items')
                .send(itemData);
            if (response.status !== 201) {
                console.log('Response status:', response.status);
                console.log('Response body:', response.body);
            }
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.defaultLocationId).toBe('123e4567-e89b-12d3-a456-426614174001');
        });
        (0, vitest_1.it)('应该拒绝无效的物品数据', async () => {
            const invalidData = {
                name: '',
                category: '办公用品',
                unit: '支',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items')
                .send(invalidData)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/items', () => {
        (0, vitest_1.it)('应该返回物品列表', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/items')
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toHaveLength(2);
            (0, vitest_1.expect)(response.body.total).toBe(2);
            (0, vitest_1.expect)(response.body.data[0].name).toBe('办公用笔');
            (0, vitest_1.expect)(response.body.data[1].name).toBe('复印纸');
        });
        (0, vitest_1.it)('应该支持分类过滤', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            await (0, supertest_1.default)(app)
                .get('/api/v1/items')
                .query({ category: '办公用品' })
                .expect(200);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('category = $1'), vitest_1.expect.arrayContaining(['办公用品']));
        });
        (0, vitest_1.it)('应该支持搜索过滤', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            await (0, supertest_1.default)(app)
                .get('/api/v1/items')
                .query({ search: '笔' })
                .expect(200);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('ILIKE'), vitest_1.expect.arrayContaining(['%笔%', '%笔%']));
        });
    });
    (0, vitest_1.describe)('GET /api/v1/items/categories', () => {
        (0, vitest_1.it)('应该返回物品分类列表', async () => {
            const mockCategories = [
                { category: '办公用品' },
                { category: '电子设备' },
                { category: '清洁用品' },
            ];
            mockClient.query.mockResolvedValueOnce({ rows: mockCategories });
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/items/categories')
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toEqual(['办公用品', '电子设备', '清洁用品']);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/items/:id', () => {
        (0, vitest_1.it)('应该返回指定物品（不包含库存信息）', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/items/${itemId}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.id).toBe(itemId);
            (0, vitest_1.expect)(response.body.data.name).toBe('办公用笔');
        });
        (0, vitest_1.it)('应该返回指定物品（包含库存信息）', async () => {
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
                .mockResolvedValueOnce({ rows: [mockItemWithLocation] })
                .mockResolvedValueOnce({ rows: mockInventory });
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/items/${itemId}`)
                .query({ includeInventory: 'true' })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.id).toBe(itemId);
            (0, vitest_1.expect)(response.body.data.totalStock).toBe(80);
            (0, vitest_1.expect)(response.body.data.locationStocks).toHaveLength(2);
            (0, vitest_1.expect)(response.body.data.defaultLocationName).toBe('A区1号位置');
        });
        (0, vitest_1.it)('应该在物品不存在时返回错误', async () => {
            const itemId = '123e4567-e89b-12d3-a456-426614174000';
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/items/${itemId}`)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('PUT /api/v1/items/:id', () => {
        (0, vitest_1.it)('应该成功更新物品', async () => {
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
                .mockResolvedValueOnce({ rows: [mockCurrentItem] })
                .mockResolvedValueOnce({ rows: [mockUpdatedItem] });
            const response = await (0, supertest_1.default)(app)
                .put(`/api/v1/items/${itemId}`)
                .send(updateData)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('物品更新成功');
            (0, vitest_1.expect)(response.body.data.name).toBe(updateData.name);
            (0, vitest_1.expect)(response.body.data.specification).toBe(updateData.specification);
        });
    });
    (0, vitest_1.describe)('DELETE /api/v1/items/:id', () => {
        (0, vitest_1.it)('应该成功删除物品', async () => {
            const itemId = '123e4567-e89b-12d3-a456-426614174000';
            const mockItem = {
                id: itemId,
                name: '办公用笔',
                category: '办公用品',
            };
            mockClient.query
                .mockResolvedValueOnce({ rows: [mockItem] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/v1/items/${itemId}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('物品删除成功');
        });
        (0, vitest_1.it)('应该拒绝删除有库存记录的物品', async () => {
            const itemId = '123e4567-e89b-12d3-a456-426614174000';
            const mockItem = {
                id: itemId,
                name: '办公用笔',
                category: '办公用品',
            };
            mockClient.query
                .mockResolvedValueOnce({ rows: [mockItem] })
                .mockResolvedValueOnce({ rows: [{ count: '5' }] });
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/v1/items/${itemId}`)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('POST /api/v1/items/batch-import', () => {
        (0, vitest_1.it)('应该拒绝没有文件的请求', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items/batch-import')
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toBe('请上传Excel文件');
        });
        (0, vitest_1.it)('应该拒绝空Excel文件', async () => {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet([]);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items/batch-import')
                .attach('file', buffer, 'test.xlsx')
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toBe('Excel文件为空');
        });
    });
    (0, vitest_1.describe)('GET /api/v1/items/template/download', () => {
        (0, vitest_1.it)('应该成功下载导入模板', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/items/template/download')
                .expect(200);
            (0, vitest_1.expect)(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            (0, vitest_1.expect)(response.headers['content-disposition']).toBe('attachment; filename="item_import_template.xlsx"');
            (0, vitest_1.expect)(response.body).toBeDefined();
        });
    });
    (0, vitest_1.describe)('API输入验证和错误处理', () => {
        (0, vitest_1.it)('应该验证必需字段', async () => {
            const invalidData = {
                category: '办公用品',
                unit: '支',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items')
                .send(invalidData)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
        (0, vitest_1.it)('应该处理数据库连接错误', async () => {
            const itemData = {
                name: '办公用笔',
                category: '办公用品',
                unit: '支',
            };
            mockClient.query.mockRejectedValueOnce(new Error('Database connection failed'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/items')
                .send(itemData)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=itemApi.test.js.map