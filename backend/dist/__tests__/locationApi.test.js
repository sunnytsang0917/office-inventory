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
vitest_1.vi.mock('../config/database', () => ({
    pool: {
        connect: vitest_1.vi.fn(),
        query: vitest_1.vi.fn(),
    },
}));
const routes_1 = __importDefault(require("../routes"));
const errorHandler_1 = require("../middleware/errorHandler");
const createTestApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/', routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
};
(0, vitest_1.describe)('Location API Integration Tests', () => {
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
    (0, vitest_1.describe)('POST /api/v1/locations', () => {
        (0, vitest_1.it)('应该成功创建根级位置', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockCreatedLocation] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations')
                .send(locationData)
                .expect(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置创建成功');
            (0, vitest_1.expect)(response.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(response.body.data.code).toBe(locationData.code);
            (0, vitest_1.expect)(response.body.data.name).toBe(locationData.name);
        });
        (0, vitest_1.it)('应该成功创建子级位置', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockParentLocation] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockCreatedLocation] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations')
                .send(locationData)
                .expect(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.parentId).toBe(parentId);
            (0, vitest_1.expect)(response.body.data.level).toBe(1);
        });
        (0, vitest_1.it)('应该拒绝无效的位置数据', async () => {
            const invalidData = {
                code: '',
                name: 'A区1号位置',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations')
                .send(invalidData)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
        (0, vitest_1.it)('应该拒绝重复的位置编码', async () => {
            const locationData = {
                code: 'A-01',
                name: 'A区1号位置',
                level: 0,
            };
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations')
                .send(locationData)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/locations', () => {
        (0, vitest_1.it)('应该返回位置列表', async () => {
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
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: mockLocations });
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/locations')
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置列表获取成功');
            (0, vitest_1.expect)(response.body.data).toHaveLength(2);
            (0, vitest_1.expect)(response.body.data[0].code).toBe('A-01');
            (0, vitest_1.expect)(response.body.data[1].code).toBe('A-02');
        });
        (0, vitest_1.it)('应该支持查询参数过滤', async () => {
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });
            await (0, supertest_1.default)(app)
                .get('/api/v1/locations')
                .query({
                level: '0',
                isActive: 'true',
                search: 'A区',
            })
                .expect(200);
            (0, vitest_1.expect)(vitest_1.vi.mocked(mockPool.query)).toHaveBeenCalledWith(vitest_1.expect.stringContaining('level = $'), vitest_1.expect.arrayContaining([0, '%A区%']));
        });
    });
    (0, vitest_1.describe)('GET /api/v1/locations/hierarchy', () => {
        (0, vitest_1.it)('应该返回层级结构', async () => {
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
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: mockLocations });
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/locations/hierarchy')
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置层级结构获取成功');
            (0, vitest_1.expect)(response.body.data).toHaveLength(1);
            (0, vitest_1.expect)(response.body.data[0].children).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/locations/:id', () => {
        (0, vitest_1.it)('应该返回指定位置', async () => {
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
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: [mockLocation] });
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/locations/${locationId}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置获取成功');
            (0, vitest_1.expect)(response.body.data.id).toBe(locationId);
            (0, vitest_1.expect)(response.body.data.code).toBe('A-01');
        });
        (0, vitest_1.it)('应该在位置不存在时返回404', async () => {
            const locationId = '123e4567-e89b-12d3-a456-426614174000';
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/locations/${locationId}`)
                .expect(404);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toBe('位置不存在');
        });
    });
    (0, vitest_1.describe)('PUT /api/v1/locations/:id', () => {
        (0, vitest_1.it)('应该成功更新位置', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockCurrentLocation] })
                .mockResolvedValueOnce({ rows: [mockUpdatedLocation] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .put(`/api/v1/locations/${locationId}`)
                .send(updateData)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置更新成功');
            (0, vitest_1.expect)(response.body.data.name).toBe(updateData.name);
            (0, vitest_1.expect)(response.body.data.description).toBe(updateData.description);
        });
    });
    (0, vitest_1.describe)('DELETE /api/v1/locations/:id', () => {
        (0, vitest_1.it)('应该成功删除位置', async () => {
            const locationId = '123e4567-e89b-12d3-a456-426614174000';
            const mockLocation = {
                id: locationId,
                code: 'A-01',
                name: 'A区1号位置',
                parent_id: null,
                level: 0,
                is_active: true,
            };
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockLocation] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/v1/locations/${locationId}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置删除成功');
        });
        (0, vitest_1.it)('应该拒绝删除有子级位置的位置', async () => {
            const locationId = '123e4567-e89b-12d3-a456-426614174000';
            const mockLocation = {
                id: locationId,
                code: 'A-01',
                name: 'A区1号位置',
            };
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockLocation] })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/v1/locations/${locationId}`)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/locations/:id/inventory', () => {
        (0, vitest_1.it)('应该返回位置库存信息', async () => {
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
            vitest_1.vi.mocked(mockPool.query).mockResolvedValue({ rows: mockInventory });
            const response = await (0, supertest_1.default)(app)
                .get(`/api/v1/locations/${locationId}/inventory`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('位置库存信息获取成功');
            (0, vitest_1.expect)(response.body.data).toHaveLength(1);
            (0, vitest_1.expect)(response.body.data[0].locationId).toBe(locationId);
            (0, vitest_1.expect)(response.body.data[0].currentStock).toBe(100);
        });
    });
    (0, vitest_1.describe)('POST /api/v1/locations/set-default', () => {
        (0, vitest_1.it)('应该成功设置物品默认位置', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockLocation] })
                .mockResolvedValueOnce({ rows: [mockItem] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations/set-default')
                .send(requestData)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('物品默认位置设置成功');
        });
        (0, vitest_1.it)('应该拒绝缺少参数的请求', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/locations/set-default')
                .send({ itemId: '456e7890-e89b-12d3-a456-426614174000' })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toBe('物品ID和位置ID都是必需的');
        });
    });
});
//# sourceMappingURL=locationApi.test.js.map