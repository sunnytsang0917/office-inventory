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
const XLSX = __importStar(require("xlsx"));
const ReportExportService_1 = __importDefault(require("../../services/ReportExportService"));
(0, vitest_1.describe)('ReportExportService', () => {
    const validateExcelBuffer = (buffer, expectedSheetName) => {
        (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
        (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        (0, vitest_1.expect)(workbook.SheetNames).toContain(expectedSheetName);
        const worksheet = workbook.Sheets[expectedSheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    };
    (0, vitest_1.describe)('Excel导出功能', () => {
        (0, vitest_1.it)('应该导出月度统计报表为Excel', () => {
            const testData = [
                {
                    month: '2024-01',
                    inboundTotal: 1000,
                    outboundTotal: 800,
                    netChange: 200,
                    itemCount: 50
                },
                {
                    month: '2024-02',
                    inboundTotal: 1200,
                    outboundTotal: 900,
                    netChange: 300,
                    itemCount: 55
                }
            ];
            const buffer = ReportExportService_1.default.exportMonthlyStats(testData);
            const data = validateExcelBuffer(buffer, '月度统计');
            (0, vitest_1.expect)(data[0]).toEqual(['月份', '入库总量', '出库总量', '净变化', '涉及物品数']);
            (0, vitest_1.expect)(data[1]).toEqual(['2024-01', 1000, 800, 200, 50]);
            (0, vitest_1.expect)(data[2]).toEqual(['2024-02', 1200, 900, 300, 55]);
        });
        (0, vitest_1.it)('应该导出物品使用排行报表为Excel', () => {
            const testData = [
                {
                    itemName: 'A4纸',
                    category: '办公用品',
                    totalOutbound: 500,
                    frequency: 25,
                    lastUsedDate: '2024-01-15'
                },
                {
                    itemName: '办公椅',
                    category: '办公家具',
                    totalOutbound: 10,
                    frequency: 5,
                    lastUsedDate: '2024-01-10'
                }
            ];
            const buffer = ReportExportService_1.default.exportItemUsageRanking(testData);
            const data = validateExcelBuffer(buffer, '使用排行');
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '物品类别', '总出库量', '使用频次', '最后使用日期']);
            (0, vitest_1.expect)(data[1]).toEqual(['A4纸', '办公用品', 500, 25, '2024-01-15']);
            (0, vitest_1.expect)(data[2]).toEqual(['办公椅', '办公家具', 10, 5, '2024-01-10']);
        });
        (0, vitest_1.it)('应该导出库存状态报表为Excel', () => {
            const testData = [
                {
                    itemName: 'A4纸',
                    category: '办公用品',
                    locationName: 'A区-1层-货架01',
                    currentStock: 100,
                    lowStockThreshold: 50,
                    status: 'normal',
                    lastTransactionDate: '2024-01-15'
                },
                {
                    itemName: '办公椅',
                    category: '办公家具',
                    locationName: 'B区-2层-货架02',
                    currentStock: 5,
                    lowStockThreshold: 10,
                    status: 'low',
                    lastTransactionDate: '2024-01-10'
                }
            ];
            const buffer = ReportExportService_1.default.exportInventoryStatus(testData);
            const data = validateExcelBuffer(buffer, '库存状态');
            (0, vitest_1.expect)(data[0]).toEqual([
                '物品名称', '物品类别', '库房位置', '当前库存',
                '低库存阈值', '库存状态', '最后交易日期'
            ]);
            (0, vitest_1.expect)(data[1]).toEqual([
                'A4纸', '办公用品', 'A区-1层-货架01', 100, 50, '正常', '2024-01-15'
            ]);
            (0, vitest_1.expect)(data[2]).toEqual([
                '办公椅', '办公家具', 'B区-2层-货架02', 5, 10, '低库存', '2024-01-10'
            ]);
        });
        (0, vitest_1.it)('应该导出交易历史报表为Excel', () => {
            const testData = [
                {
                    date: '2024-01-15',
                    itemName: 'A4纸',
                    locationName: 'A区-1层-货架01',
                    type: 'inbound',
                    quantity: 100,
                    operator: '张三',
                    supplier: '办公用品公司',
                    recipient: undefined,
                    purpose: undefined
                },
                {
                    date: '2024-01-16',
                    itemName: 'A4纸',
                    locationName: 'A区-1层-货架01',
                    type: 'outbound',
                    quantity: 20,
                    operator: '李四',
                    supplier: undefined,
                    recipient: '王五',
                    purpose: '日常办公'
                }
            ];
            const buffer = ReportExportService_1.default.exportTransactionHistory(testData);
            const data = validateExcelBuffer(buffer, '交易历史');
            (0, vitest_1.expect)(data[0]).toEqual([
                '日期', '物品名称', '库房位置', '交易类型', '数量',
                '操作人', '供应商', '领用人', '用途'
            ]);
            (0, vitest_1.expect)(data[1]).toEqual([
                '2024-01-15', 'A4纸', 'A区-1层-货架01', '入库', 100,
                '张三', '办公用品公司', '', ''
            ]);
            (0, vitest_1.expect)(data[2]).toEqual([
                '2024-01-16', 'A4纸', 'A区-1层-货架01', '出库', 20,
                '李四', '', '王五', '日常办公'
            ]);
        });
        (0, vitest_1.it)('应该在没有数据时抛出错误', () => {
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportMonthlyStats([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportItemUsageRanking([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportInventoryStatus([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportTransactionHistory([]))
                .toThrow('没有数据可导出');
        });
    });
    (0, vitest_1.describe)('CSV导出功能', () => {
        (0, vitest_1.it)('应该导出月度统计为CSV', () => {
            const testData = [
                {
                    month: '2024-01',
                    inboundTotal: 1000,
                    outboundTotal: 800,
                    netChange: 200,
                    itemCount: 50
                },
                {
                    month: '2024-02',
                    inboundTotal: 1200,
                    outboundTotal: 900,
                    netChange: 300,
                    itemCount: 55
                }
            ];
            const csv = ReportExportService_1.default.exportMonthlyStatsToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('月份,入库总量,出库总量,净变化,涉及物品数');
            (0, vitest_1.expect)(lines[1]).toBe('2024-01,1000,800,200,50');
            (0, vitest_1.expect)(lines[2]).toBe('2024-02,1200,900,300,55');
        });
        (0, vitest_1.it)('应该导出物品使用排行为CSV', () => {
            const testData = [
                {
                    itemName: 'A4纸',
                    category: '办公用品',
                    totalOutbound: 500,
                    frequency: 25,
                    lastUsedDate: '2024-01-15'
                }
            ];
            const csv = ReportExportService_1.default.exportItemUsageRankingToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('物品名称,物品类别,总出库量,使用频次,最后使用日期');
            (0, vitest_1.expect)(lines[1]).toBe('A4纸,办公用品,500,25,2024-01-15');
        });
        (0, vitest_1.it)('应该导出库存状态为CSV', () => {
            const testData = [
                {
                    itemName: 'A4纸',
                    category: '办公用品',
                    locationName: 'A区-1层-货架01',
                    currentStock: 100,
                    lowStockThreshold: 50,
                    status: 'normal',
                    lastTransactionDate: '2024-01-15'
                }
            ];
            const csv = ReportExportService_1.default.exportInventoryStatusToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('物品名称,物品类别,库房位置,当前库存,低库存阈值,库存状态,最后交易日期');
            (0, vitest_1.expect)(lines[1]).toBe('A4纸,办公用品,A区-1层-货架01,100,50,normal,2024-01-15');
        });
        (0, vitest_1.it)('应该导出交易历史为CSV', () => {
            const testData = [
                {
                    date: '2024-01-15',
                    itemName: 'A4纸',
                    locationName: 'A区-1层-货架01',
                    type: 'inbound',
                    quantity: 100,
                    operator: '张三',
                    supplier: '办公用品公司',
                    recipient: undefined,
                    purpose: undefined
                }
            ];
            const csv = ReportExportService_1.default.exportTransactionHistoryToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('日期,物品名称,库房位置,交易类型,数量,操作人,供应商,领用人,用途');
            (0, vitest_1.expect)(lines[1]).toBe('2024-01-15,A4纸,A区-1层-货架01,inbound,100,张三,办公用品公司,,');
        });
        (0, vitest_1.it)('应该处理包含逗号的数据', () => {
            const testData = [
                {
                    itemName: '办公用品,A4纸',
                    category: '纸张类',
                    locationName: 'A区,1层,货架01',
                    currentStock: 100,
                    lowStockThreshold: 50,
                    status: 'normal',
                    lastTransactionDate: '2024-01-15'
                }
            ];
            const csv = ReportExportService_1.default.exportInventoryStatusToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[1]).toContain('"办公用品,A4纸"');
            (0, vitest_1.expect)(lines[1]).toContain('"A区,1层,货架01"');
        });
        (0, vitest_1.it)('应该处理包含引号的数据', () => {
            const testData = [
                {
                    itemName: '办公椅"豪华版"',
                    category: '家具',
                    locationName: 'B区',
                    currentStock: 10,
                    lowStockThreshold: 5,
                    status: 'normal',
                    lastTransactionDate: '2024-01-15'
                }
            ];
            const csv = ReportExportService_1.default.exportInventoryStatusToCSV(testData);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[1]).toContain('"办公椅""豪华版"""');
        });
        (0, vitest_1.it)('应该在没有数据时抛出错误', () => {
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportMonthlyStatsToCSV([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportItemUsageRankingToCSV([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportInventoryStatusToCSV([]))
                .toThrow('没有数据可导出');
            (0, vitest_1.expect)(() => ReportExportService_1.default.exportTransactionHistoryToCSV([]))
                .toThrow('没有数据可导出');
        });
    });
    (0, vitest_1.describe)('通用CSV导出功能', () => {
        (0, vitest_1.it)('应该导出通用数据为CSV', () => {
            const testData = [
                { name: '物品1', count: 100, active: true },
                { name: '物品2', count: 200, active: false }
            ];
            const headers = [
                { key: 'name', title: '名称' },
                { key: 'count', title: '数量' },
                { key: 'active', title: '状态' }
            ];
            const csv = ReportExportService_1.default.exportToCSV(testData, headers);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('名称,数量,状态');
            (0, vitest_1.expect)(lines[1]).toBe('物品1,100,true');
            (0, vitest_1.expect)(lines[2]).toBe('物品2,200,false');
        });
        (0, vitest_1.it)('应该处理空值和未定义值', () => {
            const testData = [
                { name: '物品1', count: null, active: undefined },
                { name: '', count: 0, active: false }
            ];
            const headers = [
                { key: 'name', title: '名称' },
                { key: 'count', title: '数量' },
                { key: 'active', title: '状态' }
            ];
            const csv = ReportExportService_1.default.exportToCSV(testData, headers);
            const lines = csv.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('名称,数量,状态');
            (0, vitest_1.expect)(lines[1]).toBe('物品1,,');
            (0, vitest_1.expect)(lines[2]).toBe(',0,false');
        });
    });
    (0, vitest_1.describe)('文件名生成功能', () => {
        (0, vitest_1.it)('应该生成正确的Excel文件名', () => {
            const filename = ReportExportService_1.default.getExportFilename('monthly-stats', 'xlsx');
            (0, vitest_1.expect)(filename).toMatch(/^月度统计报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
        });
        (0, vitest_1.it)('应该生成正确的CSV文件名', () => {
            const filename = ReportExportService_1.default.getExportFilename('item-usage', 'csv');
            (0, vitest_1.expect)(filename).toMatch(/^物品使用排行_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
        });
        (0, vitest_1.it)('应该处理未知的报表类型', () => {
            const filename = ReportExportService_1.default.getExportFilename('unknown-type', 'xlsx');
            (0, vitest_1.expect)(filename).toMatch(/^报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
        });
        (0, vitest_1.it)('应该默认使用xlsx格式', () => {
            const filename = ReportExportService_1.default.getExportFilename('inventory-status');
            (0, vitest_1.expect)(filename).toMatch(/^库存状态报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
        });
    });
});
//# sourceMappingURL=ReportExportService.test.js.map