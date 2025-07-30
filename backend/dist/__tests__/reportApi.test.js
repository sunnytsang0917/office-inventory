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
(0, vitest_1.describe)('Report API', () => {
    let app;
    let mockClient;
    let mockPool;
    (0, vitest_1.beforeAll)(async () => {
        app = createTestApp();
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        mockPool = pool;
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn(),
        };
        mockPool.connect.mockResolvedValue(mockClient);
    });
    (0, vitest_1.afterAll)(async () => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /api/v1/reports/types', () => {
        (0, vitest_1.it)('应该返回可用的报表类型', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/types')
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeInstanceOf(Array);
            (0, vitest_1.expect)(response.body.data.length).toBeGreaterThan(0);
            const reportTypes = response.body.data.map((report) => report.type);
            (0, vitest_1.expect)(reportTypes).toContain('monthly-stats');
            (0, vitest_1.expect)(reportTypes).toContain('item-usage');
            (0, vitest_1.expect)(reportTypes).toContain('inventory-status');
            (0, vitest_1.expect)(reportTypes).toContain('transaction-history');
        });
    });
    (0, vitest_1.describe)('GET /api/v1/reports/monthly-stats', () => {
        (0, vitest_1.it)('应该返回月度统计数据', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/monthly-stats')
                .query({
                startDate: '2024-01-01',
                endDate: '2024-02-28'
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeInstanceOf(Array);
            (0, vitest_1.expect)(response.body.data.length).toBeGreaterThan(0);
            const monthlyData = response.body.data[0];
            (0, vitest_1.expect)(monthlyData).toHaveProperty('month');
            (0, vitest_1.expect)(monthlyData).toHaveProperty('inboundTotal');
            (0, vitest_1.expect)(monthlyData).toHaveProperty('outboundTotal');
            (0, vitest_1.expect)(monthlyData).toHaveProperty('netChange');
            (0, vitest_1.expect)(monthlyData).toHaveProperty('itemCount');
        });
        (0, vitest_1.it)('应该验证日期范围', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/monthly-stats')
                .query({
                startDate: '2024-02-01',
                endDate: '2024-01-01'
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain('开始日期不能晚于结束日期');
        });
    });
    (0, vitest_1.describe)('GET /api/v1/reports/item-usage', () => {
        (0, vitest_1.it)('应该返回物品使用排行数据', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/item-usage')
                .query({
                startDate: '2024-01-01',
                endDate: '2024-02-28'
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeInstanceOf(Array);
            if (response.body.data.length > 0) {
                const usageData = response.body.data[0];
                (0, vitest_1.expect)(usageData).toHaveProperty('itemName');
                (0, vitest_1.expect)(usageData).toHaveProperty('category');
                (0, vitest_1.expect)(usageData).toHaveProperty('totalOutbound');
                (0, vitest_1.expect)(usageData).toHaveProperty('frequency');
                (0, vitest_1.expect)(usageData).toHaveProperty('lastUsedDate');
            }
        });
    });
    (0, vitest_1.describe)('报表导出功能', () => {
        (0, vitest_1.it)('应该支持导出月度统计CSV', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/monthly-stats/export')
                .query({
                startDate: '2024-01-01',
                endDate: '2024-02-28',
                format: 'csv'
            })
                .expect(200);
            (0, vitest_1.expect)(response.headers['content-type']).toContain('text/csv');
            (0, vitest_1.expect)(response.headers['content-disposition']).toContain('attachment');
            (0, vitest_1.expect)(typeof response.text).toBe('string');
            (0, vitest_1.expect)(response.text).toContain('月份');
        });
    });
    (0, vitest_1.describe)('错误处理', () => {
        (0, vitest_1.it)('应该处理无效的日期格式', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/monthly-stats')
                .query({
                startDate: 'invalid-date',
                endDate: '2024-02-28'
            });
            (0, vitest_1.expect)(response.status).toBeGreaterThanOrEqual(400);
        });
        (0, vitest_1.it)('应该处理无效的导出格式', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/reports/monthly-stats/export')
                .query({
                startDate: '2024-01-01',
                endDate: '2024-02-28',
                format: 'invalid-format'
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=reportApi.test.js.map