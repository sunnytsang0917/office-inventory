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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const XLSX = __importStar(require("xlsx"));
const ExcelService_1 = __importStar(require("../../services/ExcelService"));
(0, vitest_1.describe)('ExcelService', () => {
    let excelService;
    (0, vitest_1.beforeEach)(() => {
        excelService = new ExcelService_1.default();
    });
    const createExcelBuffer = (data) => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    };
    (0, vitest_1.describe)('parseItemsExcel', () => {
        (0, vitest_1.it)('应该成功解析有效的物品Excel文件', async () => {
            const excelData = [
                ['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值'],
                ['测试物品1', '办公用品', 'A4规格', '包', '550e8400-e29b-41d4-a716-446655440001', '10'],
                ['测试物品2', '电子设备', '标准规格', '台', '550e8400-e29b-41d4-a716-446655440002', '5']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseItemsExcel(buffer);
            (0, vitest_1.expect)(result.data).toHaveLength(2);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.data[0]).toEqual({
                name: '测试物品1',
                category: '办公用品',
                specification: 'A4规格',
                unit: '包',
                defaultLocationId: '550e8400-e29b-41d4-a716-446655440001',
                lowStockThreshold: 10
            });
            (0, vitest_1.expect)(result.data[1]).toEqual({
                name: '测试物品2',
                category: '电子设备',
                specification: '标准规格',
                unit: '台',
                defaultLocationId: '550e8400-e29b-41d4-a716-446655440002',
                lowStockThreshold: 5
            });
        });
        (0, vitest_1.it)('应该处理缺少可选字段的情况', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseItemsExcel(buffer);
            (0, vitest_1.expect)(result.data).toHaveLength(1);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.data[0]).toEqual({
                name: '测试物品',
                category: '办公用品',
                unit: '包',
                lowStockThreshold: 0
            });
        });
        (0, vitest_1.it)('应该在缺少必需列时抛出错误', async () => {
            const excelData = [
                ['物品名称', '类别'],
                ['测试物品', '办公用品']
            ];
            const buffer = createExcelBuffer(excelData);
            await (0, vitest_1.expect)(excelService.parseItemsExcel(buffer))
                .rejects.toThrow('缺少必需的列: 单位');
        });
        (0, vitest_1.it)('应该验证数据并报告错误', async () => {
            const excelData = [
                ['物品名称', '类别', '单位', '低库存阈值'],
                ['', '办公用品', '包', '10'],
                ['测试物品', '', '包', 'abc'],
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseItemsExcel(buffer);
            (0, vitest_1.expect)(result.data).toHaveLength(0);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.errors.some(error => error.row === 2)).toBe(true);
            (0, vitest_1.expect)(result.errors.some(error => error.row === 3)).toBe(true);
        });
        (0, vitest_1.it)('应该在Excel文件为空时抛出错误', async () => {
            const excelData = [
                ['物品名称', '类别', '单位']
            ];
            const buffer = createExcelBuffer(excelData);
            await (0, vitest_1.expect)(excelService.parseItemsExcel(buffer))
                .rejects.toThrow('Excel文件至少需要包含标题行和一行数据');
        });
    });
    (0, vitest_1.describe)('parseInboundTransactionsExcel', () => {
        (0, vitest_1.it)('应该成功解析有效的入库交易Excel文件', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A', '批量采购'],
                ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '50', '2024-01-02', '李四', '供应商B', '补充库存']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseInboundTransactionsExcel(buffer);
            (0, vitest_1.expect)(result.data).toHaveLength(2);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.data[0]).toEqual({
                itemId: '550e8400-e29b-41d4-a716-446655440001',
                locationId: '550e8400-e29b-41d4-a716-446655440011',
                type: 'inbound',
                quantity: 100,
                date: new Date('2024-01-01'),
                operator: '张三',
                supplier: '供应商A',
                notes: '批量采购'
            });
        });
        (0, vitest_1.it)('应该在缺少入库必需列时抛出错误', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三']
            ];
            const buffer = createExcelBuffer(excelData);
            await (0, vitest_1.expect)(excelService.parseInboundTransactionsExcel(buffer))
                .rejects.toThrow('缺少必需的列: 供应商');
        });
    });
    (0, vitest_1.describe)('parseOutboundTransactionsExcel', () => {
        (0, vitest_1.it)('应该成功解析有效的出库交易Excel文件', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五', '办公使用', '正常领用'],
                ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '5', '2024-01-02', '李四', '赵六', '项目需要', '紧急领用']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseOutboundTransactionsExcel(buffer);
            (0, vitest_1.expect)(result.data).toHaveLength(2);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.data[0]).toEqual({
                itemId: '550e8400-e29b-41d4-a716-446655440001',
                locationId: '550e8400-e29b-41d4-a716-446655440011',
                type: 'outbound',
                quantity: 10,
                date: new Date('2024-01-01'),
                operator: '张三',
                recipient: '王五',
                purpose: '办公使用',
                notes: '正常领用'
            });
        });
        (0, vitest_1.it)('应该在缺少出库必需列时抛出错误', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五']
            ];
            const buffer = createExcelBuffer(excelData);
            await (0, vitest_1.expect)(excelService.parseOutboundTransactionsExcel(buffer))
                .rejects.toThrow('缺少必需的列: 用途');
        });
    });
    (0, vitest_1.describe)('模板生成功能', () => {
        (0, vitest_1.it)('应该生成物品导入模板', () => {
            const buffer = excelService.generateItemTemplate();
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('物品导入模板');
            const worksheet = workbook.Sheets['物品导入模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值']);
        });
        (0, vitest_1.it)('应该生成入库交易模板', () => {
            const buffer = excelService.generateInboundTemplate();
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('入库交易模板');
            const worksheet = workbook.Sheets['入库交易模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注']);
        });
        (0, vitest_1.it)('应该生成出库交易模板', () => {
            const buffer = excelService.generateOutboundTemplate();
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('出库交易模板');
            const worksheet = workbook.Sheets['出库交易模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注']);
        });
    });
    (0, vitest_1.describe)('exportToExcel', () => {
        (0, vitest_1.it)('应该导出数据到Excel', () => {
            const testData = [
                { id: '1', name: '物品1', category: '类别1', quantity: 100 },
                { id: '2', name: '物品2', category: '类别2', quantity: 50 }
            ];
            const headers = [
                { key: 'id', title: 'ID', width: 10 },
                { key: 'name', title: '名称', width: 20 },
                { key: 'category', title: '类别', width: 15 },
                { key: 'quantity', title: '数量', width: 10 }
            ];
            const buffer = excelService.exportToExcel(testData, headers, '测试数据');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('测试数据');
            const worksheet = workbook.Sheets['测试数据'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['ID', '名称', '类别', '数量']);
            (0, vitest_1.expect)(data[1]).toEqual(['1', '物品1', '类别1', 100]);
            (0, vitest_1.expect)(data[2]).toEqual(['2', '物品2', '类别2', 50]);
        });
        (0, vitest_1.it)('应该在没有数据时抛出错误', () => {
            const headers = [
                { key: 'id', title: 'ID' }
            ];
            (0, vitest_1.expect)(() => excelService.exportToExcel([], headers))
                .toThrow('没有数据可导出');
        });
    });
    (0, vitest_1.describe)('validateExcelTemplate', () => {
        (0, vitest_1.it)('应该验证Excel模板格式正确', () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.actualHeaders).toEqual(['物品名称', '类别', '单位']);
        });
        (0, vitest_1.it)('应该检测缺少的必需列', () => {
            const excelData = [
                ['物品名称', '类别'],
                ['测试物品', '办公用品']
            ];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('缺少必需的列: 单位'))).toBe(true);
        });
        (0, vitest_1.it)('应该检测额外的列', () => {
            const excelData = [
                ['物品名称', '类别', '单位', '额外列'],
                ['测试物品', '办公用品', '包', '额外数据']
            ];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('发现额外的列'))).toBe(true);
        });
    });
    (0, vitest_1.describe)('错误处理', () => {
        (0, vitest_1.it)('应该处理无效的Excel文件', async () => {
            const invalidBuffer = Buffer.from('这不是一个Excel文件');
            await (0, vitest_1.expect)(excelService.parseItemsExcel(invalidBuffer))
                .rejects.toThrow(ExcelService_1.ExcelParseError);
        });
        (0, vitest_1.it)('应该处理过大的文件', async () => {
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
            await (0, vitest_1.expect)(excelService.parseItemsExcel(largeBuffer))
                .rejects.toThrow('Excel文件大小不能超过10MB');
        });
        (0, vitest_1.it)('应该处理日期格式错误', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '无效日期', '张三', '供应商A']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseInboundTransactionsExcel(buffer);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.errors.some(error => error.message.includes('日期格式不正确'))).toBe(true);
        });
        (0, vitest_1.it)('应该处理数字格式错误', async () => {
            const excelData = [
                ['物品名称', '类别', '单位', '低库存阈值'],
                ['测试物品', '办公用品', '包', '不是数字']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await excelService.parseItemsExcel(buffer);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.errors.some(error => error.message.includes('必须是数字'))).toBe(true);
        });
    });
});
//# sourceMappingURL=ExcelService.test.js.map