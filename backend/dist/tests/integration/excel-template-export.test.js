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
const ExcelService_1 = __importDefault(require("../../services/ExcelService"));
const ReportExportService_1 = __importDefault(require("../../services/ReportExportService"));
(0, vitest_1.describe)('Excel模板和导出功能集成测试', () => {
    (0, vitest_1.describe)('模板生成和下载功能', () => {
        (0, vitest_1.it)('应该生成完整的物品导入模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('items');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('物品信息导入模板');
            const worksheet = workbook.Sheets['物品信息导入模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值']);
            (0, vitest_1.expect)(data.length).toBeGreaterThan(1);
            (0, vitest_1.expect)(data[1]).toEqual(['办公椅', '办公家具', '人体工学椅', '把', 'WH001', 5]);
        });
        (0, vitest_1.it)('应该生成完整的入库交易模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('inbound');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('入库记录导入模板');
            const worksheet = workbook.Sheets['入库记录导入模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注']);
            (0, vitest_1.expect)(data.length).toBeGreaterThan(1);
        });
        (0, vitest_1.it)('应该生成完整的出库交易模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('outbound');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('出库记录导入模板');
            const worksheet = workbook.Sheets['出库记录导入模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注']);
            (0, vitest_1.expect)(data.length).toBeGreaterThan(1);
        });
    });
    (0, vitest_1.describe)('报表导出功能', () => {
        (0, vitest_1.it)('应该导出完整的月度统计报表', () => {
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
            const excelBuffer = ReportExportService_1.default.exportMonthlyStats(testData);
            (0, vitest_1.expect)(excelBuffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(excelBuffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('月度统计');
            const worksheet = workbook.Sheets['月度统计'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['月份', '入库总量', '出库总量', '净变化', '涉及物品数']);
            (0, vitest_1.expect)(data[1]).toEqual(['2024-01', 1000, 800, 200, 50]);
            const csvData = ReportExportService_1.default.exportMonthlyStatsToCSV(testData);
            (0, vitest_1.expect)(csvData).toContain('月份,入库总量,出库总量,净变化,涉及物品数');
            (0, vitest_1.expect)(csvData).toContain('2024-01,1000,800,200,50');
        });
        (0, vitest_1.it)('应该导出完整的库存状态报表', () => {
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
            const excelBuffer = ReportExportService_1.default.exportInventoryStatus(testData);
            (0, vitest_1.expect)(excelBuffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(excelBuffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('库存状态');
            const worksheet = workbook.Sheets['库存状态'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
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
            const csvData = ReportExportService_1.default.exportInventoryStatusToCSV(testData);
            (0, vitest_1.expect)(csvData).toContain('物品名称,物品类别,库房位置,当前库存,低库存阈值,库存状态,最后交易日期');
            (0, vitest_1.expect)(csvData).toContain('A4纸,办公用品,A区-1层-货架01,100,50,normal,2024-01-15');
        });
        (0, vitest_1.it)('应该导出完整的交易历史报表', () => {
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
            const excelBuffer = ReportExportService_1.default.exportTransactionHistory(testData);
            (0, vitest_1.expect)(excelBuffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(excelBuffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('交易历史');
            const worksheet = workbook.Sheets['交易历史'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
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
            const csvData = ReportExportService_1.default.exportTransactionHistoryToCSV(testData);
            (0, vitest_1.expect)(csvData).toContain('日期,物品名称,库房位置,交易类型,数量,操作人,供应商,领用人,用途');
            (0, vitest_1.expect)(csvData).toContain('2024-01-15,A4纸,A区-1层-货架01,inbound,100,张三,办公用品公司,,');
        });
    });
    (0, vitest_1.describe)('文件名生成功能', () => {
        (0, vitest_1.it)('应该生成正确格式的文件名', () => {
            const excelFilename = ReportExportService_1.default.getExportFilename('monthly-stats', 'xlsx');
            const csvFilename = ReportExportService_1.default.getExportFilename('inventory-status', 'csv');
            (0, vitest_1.expect)(excelFilename).toMatch(/^月度统计报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
            (0, vitest_1.expect)(csvFilename).toMatch(/^库存状态报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
        });
    });
    (0, vitest_1.describe)('数据处理功能', () => {
        (0, vitest_1.it)('应该正确处理特殊字符和格式', () => {
            const testData = [
                {
                    itemName: '办公用品,A4纸',
                    category: '纸张"高级"类',
                    locationName: 'A区,1层,货架01',
                    currentStock: 100,
                    lowStockThreshold: 50,
                    status: 'normal',
                    lastTransactionDate: '2024-01-15'
                }
            ];
            const csvData = ReportExportService_1.default.exportInventoryStatusToCSV(testData);
            (0, vitest_1.expect)(csvData).toContain('"办公用品,A4纸"');
            (0, vitest_1.expect)(csvData).toContain('"A区,1层,货架01"');
            (0, vitest_1.expect)(csvData).toContain('"纸张""高级""类"');
        });
        (0, vitest_1.it)('应该正确处理空值和布尔值', () => {
            const testData = [
                { name: '物品1', active: true, count: null, description: undefined },
                { name: '物品2', active: false, count: 0, description: '' }
            ];
            const headers = [
                { key: 'name', title: '名称' },
                { key: 'active', title: '状态' },
                { key: 'count', title: '数量' },
                { key: 'description', title: '描述' }
            ];
            const csvData = ReportExportService_1.default.exportToCSV(testData, headers);
            const lines = csvData.split('\n');
            (0, vitest_1.expect)(lines[0]).toBe('名称,状态,数量,描述');
            (0, vitest_1.expect)(lines[1]).toBe('物品1,true,,');
            (0, vitest_1.expect)(lines[2]).toBe('物品2,false,0,');
        });
    });
});
//# sourceMappingURL=excel-template-export.test.js.map