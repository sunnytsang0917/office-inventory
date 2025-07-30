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
const ReportService_1 = __importDefault(require("../../services/ReportService"));
vitest_1.vi.mock('../../config/database', () => ({
    pool: {
        connect: vitest_1.vi.fn(),
        query: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('ReportService', () => {
    let reportService;
    let mockClient;
    (0, vitest_1.beforeEach)(async () => {
        reportService = new ReportService_1.default();
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn(),
        };
        const { pool } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
        pool.connect.mockResolvedValue(mockClient);
    });
    (0, vitest_1.describe)('getMonthlyStats', () => {
        (0, vitest_1.it)('应该返回月度统计数据', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [
                    {
                        month: '2024-01',
                        inbound_total: '100',
                        outbound_total: '50',
                        net_change: '50',
                        item_count: '5'
                    },
                    {
                        month: '2024-02',
                        inbound_total: '80',
                        outbound_total: '30',
                        net_change: '50',
                        item_count: '3'
                    }
                ]
            });
            const filter = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-02-28')
            };
            const result = await reportService.getMonthlyStats(filter);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0]).toEqual({
                month: '2024-01',
                inboundTotal: 100,
                outboundTotal: 50,
                netChange: 50,
                itemCount: 5
            });
            (0, vitest_1.expect)(result[1]).toEqual({
                month: '2024-02',
                inboundTotal: 80,
                outboundTotal: 30,
                netChange: 50,
                itemCount: 3
            });
        });
    });
    (0, vitest_1.describe)('getItemUsageRanking', () => {
        (0, vitest_1.it)('应该返回物品使用排行数据', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [
                    {
                        item_name: '办公椅',
                        category: '办公家具',
                        total_outbound: '25',
                        frequency: '5',
                        last_used_date: '2024-01-20'
                    },
                    {
                        item_name: '打印纸',
                        category: '办公用品',
                        total_outbound: '100',
                        frequency: '10',
                        last_used_date: '2024-01-25'
                    }
                ]
            });
            const filter = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                limit: 10
            };
            const result = await reportService.getItemUsageRanking(filter);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0]).toEqual({
                itemName: '办公椅',
                category: '办公家具',
                totalOutbound: 25,
                frequency: 5,
                lastUsedDate: '2024-01-20'
            });
            (0, vitest_1.expect)(result[1]).toEqual({
                itemName: '打印纸',
                category: '办公用品',
                totalOutbound: 100,
                frequency: 10,
                lastUsedDate: '2024-01-25'
            });
        });
    });
    (0, vitest_1.describe)('getInventoryStatus', () => {
        (0, vitest_1.it)('应该返回库存状态数据', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [
                    {
                        item_name: '办公椅',
                        category: '办公家具',
                        location_name: 'A区货架01',
                        current_stock: '5',
                        low_stock_threshold: '10',
                        status: 'low',
                        last_transaction_date: '2024-01-20'
                    },
                    {
                        item_name: '打印纸',
                        category: '办公用品',
                        location_name: 'B区货架01',
                        current_stock: '50',
                        low_stock_threshold: '20',
                        status: 'normal',
                        last_transaction_date: '2024-01-25'
                    }
                ]
            });
            const filter = {};
            const result = await reportService.getInventoryStatus(filter);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0]).toEqual({
                itemName: '办公椅',
                category: '办公家具',
                locationName: 'A区货架01',
                currentStock: 5,
                lowStockThreshold: 10,
                status: 'low',
                lastTransactionDate: '2024-01-20'
            });
            (0, vitest_1.expect)(result[1]).toEqual({
                itemName: '打印纸',
                category: '办公用品',
                locationName: 'B区货架01',
                currentStock: 50,
                lowStockThreshold: 20,
                status: 'normal',
                lastTransactionDate: '2024-01-25'
            });
        });
    });
    (0, vitest_1.describe)('getTransactionHistory', () => {
        (0, vitest_1.it)('应该返回交易历史数据', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [{ total: '2' }]
            });
            mockClient.query.mockResolvedValueOnce({
                rows: [
                    {
                        date: '2024-01-20',
                        item_name: '办公椅',
                        location_name: 'A区货架01',
                        type: 'outbound',
                        quantity: '2',
                        operator: '张三',
                        supplier: null,
                        recipient: '李四',
                        purpose: '办公使用'
                    },
                    {
                        date: '2024-01-15',
                        item_name: '打印纸',
                        location_name: 'B区货架01',
                        type: 'inbound',
                        quantity: '100',
                        operator: '王五',
                        supplier: '供应商A',
                        recipient: null,
                        purpose: null
                    }
                ]
            });
            const filter = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                limit: 10,
                offset: 0
            };
            const result = await reportService.getTransactionHistory(filter);
            (0, vitest_1.expect)(result.total).toBe(2);
            (0, vitest_1.expect)(result.data).toHaveLength(2);
            (0, vitest_1.expect)(result.data[0]).toEqual({
                date: '2024-01-20',
                itemName: '办公椅',
                locationName: 'A区货架01',
                type: 'outbound',
                quantity: 2,
                operator: '张三',
                supplier: undefined,
                recipient: '李四',
                purpose: '办公使用'
            });
            (0, vitest_1.expect)(result.data[1]).toEqual({
                date: '2024-01-15',
                itemName: '打印纸',
                locationName: 'B区货架01',
                type: 'inbound',
                quantity: 100,
                operator: '王五',
                supplier: '供应商A',
                recipient: undefined,
                purpose: undefined
            });
        });
    });
    (0, vitest_1.describe)('getAvailableReports', () => {
        (0, vitest_1.it)('应该返回可用的报表类型', () => {
            const result = reportService.getAvailableReports();
            (0, vitest_1.expect)(result).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
            const reportTypes = result.map(report => report.type);
            (0, vitest_1.expect)(reportTypes).toContain('monthly-stats');
            (0, vitest_1.expect)(reportTypes).toContain('item-usage');
            (0, vitest_1.expect)(reportTypes).toContain('inventory-status');
            (0, vitest_1.expect)(reportTypes).toContain('transaction-history');
            (0, vitest_1.expect)(reportTypes).toContain('custom-range');
            result.forEach(report => {
                (0, vitest_1.expect)(report).toHaveProperty('type');
                (0, vitest_1.expect)(report).toHaveProperty('name');
                (0, vitest_1.expect)(report).toHaveProperty('description');
                (0, vitest_1.expect)(report).toHaveProperty('supportedFormats');
                (0, vitest_1.expect)(report.supportedFormats).toContain('xlsx');
                (0, vitest_1.expect)(report.supportedFormats).toContain('csv');
            });
        });
    });
});
//# sourceMappingURL=ReportService.test.js.map