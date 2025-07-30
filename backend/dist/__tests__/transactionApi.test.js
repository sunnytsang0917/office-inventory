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
vitest_1.vi.mock('../services/ItemService', () => {
    const mockItemService = {
        getItem: vitest_1.vi.fn().mockResolvedValue({
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: '测试物品',
            category: '办公用品',
            unit: '个',
        }),
    };
    return {
        ItemService: vitest_1.vi.fn().mockImplementation(() => mockItemService),
        default: vitest_1.vi.fn().mockImplementation(() => mockItemService),
    };
});
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
(0, vitest_1.describe)('Transaction API Integration Tests', () => {
    let app;
    let mockClient;
    let mockPool;
    (0, vitest_1.beforeAll)(async () => {
        app = createTestApp();
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        mockPool = pool;
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn(),
        };
        mockPool.connect.mockResolvedValue(mockClient);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /api/v1/transactions', () => {
        (0, vitest_1.it)('应该成功创建交易记录', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockTransaction] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions')
                .send(transactionData)
                .expect(201);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: '交易记录创建成功',
                data: vitest_1.expect.objectContaining({
                    itemId: transactionData.itemId,
                    locationId: transactionData.locationId,
                    type: transactionData.type,
                    quantity: transactionData.quantity,
                }),
            });
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
        (0, vitest_1.it)('应该验证必填字段', async () => {
            const invalidData = {
                itemId: '123e4567-e89b-12d3-a456-426614174000',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions')
                .send(invalidData)
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('POST /api/v1/transactions/inbound', () => {
        (0, vitest_1.it)('应该成功创建入库记录', async () => {
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
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [mockTransaction] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions/inbound')
                .send(inboundData)
                .expect(201);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: '入库记录创建成功',
                data: vitest_1.expect.objectContaining({
                    type: 'inbound',
                    supplier: inboundData.supplier,
                }),
            });
        });
    });
    (0, vitest_1.describe)('POST /api/v1/transactions/outbound', () => {
        (0, vitest_1.it)('应该成功创建出库记录', async () => {
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
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ stock: 50 }] })
                .mockResolvedValueOnce({ rows: [mockTransaction] });
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions/outbound')
                .send(outboundData)
                .expect(201);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: '出库记录创建成功',
                data: vitest_1.expect.objectContaining({
                    type: 'outbound',
                    recipient: outboundData.recipient,
                    purpose: outboundData.purpose,
                }),
            });
        });
    });
    (0, vitest_1.describe)('GET /api/v1/transactions', () => {
        (0, vitest_1.it)('应该返回交易历史记录', async () => {
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
                .mockResolvedValueOnce({ rows: [{ total: '1' }] })
                .mockResolvedValueOnce({ rows: mockTransactions });
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions')
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                data: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        id: mockTransactions[0].id,
                        type: 'inbound',
                        quantity: 100,
                    }),
                ]),
                pagination: vitest_1.expect.objectContaining({
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                }),
            });
        });
    });
    (0, vitest_1.describe)('GET /api/v1/transactions/:id', () => {
        (0, vitest_1.it)('应该返回交易记录详情', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/123e4567-e89b-12d3-a456-426614174002')
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                data: vitest_1.expect.objectContaining({
                    id: mockTransaction.id,
                    type: 'inbound',
                    quantity: 100,
                }),
            });
        });
    });
    (0, vitest_1.describe)('GET /api/v1/transactions/statistics', () => {
        (0, vitest_1.it)('应该返回交易统计信息', async () => {
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
                .mockResolvedValueOnce({ rows: mockStats })
                .mockResolvedValueOnce({ rows: mockTopItems })
                .mockResolvedValueOnce({ rows: mockTopLocations });
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/statistics')
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                data: vitest_1.expect.objectContaining({
                    totalInbound: 500,
                    totalOutbound: 200,
                    transactionCount: 10,
                    topItems: vitest_1.expect.arrayContaining([
                        vitest_1.expect.objectContaining({
                            itemName: '物品A',
                            totalQuantity: 300,
                        }),
                    ]),
                    topLocations: vitest_1.expect.arrayContaining([
                        vitest_1.expect.objectContaining({
                            locationName: '位置A',
                            totalQuantity: 400,
                        }),
                    ]),
                }),
            });
        });
    });
    (0, vitest_1.describe)('Template Downloads', () => {
        (0, vitest_1.it)('应该下载入库模板', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/inbound/template/download')
                .expect(200);
            (0, vitest_1.expect)(response.headers['content-type']).toContain('spreadsheetml.sheet');
            (0, vitest_1.expect)(response.headers['content-disposition']).toContain('inbound_template.xlsx');
        });
        (0, vitest_1.it)('应该下载出库模板', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/outbound/template/download')
                .expect(200);
            (0, vitest_1.expect)(response.headers['content-type']).toContain('spreadsheetml.sheet');
            (0, vitest_1.expect)(response.headers['content-disposition']).toContain('outbound_template.xlsx');
        });
    });
});
//# sourceMappingURL=transactionApi.test.js.map