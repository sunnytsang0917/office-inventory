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
const BatchImportService_1 = __importDefault(require("../../services/BatchImportService"));
vitest_1.vi.mock('../../services/ItemService');
vitest_1.vi.mock('../../services/TransactionService');
(0, vitest_1.describe)('BatchImportService', () => {
    let batchImportService;
    let mockPool;
    let mockClient;
    let mockItemService;
    let mockTransactionService;
    const createExcelBuffer = (data) => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    };
    (0, vitest_1.beforeEach)(() => {
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn()
        };
        mockPool = {
            connect: vitest_1.vi.fn().mockResolvedValue(mockClient)
        };
        batchImportService = new BatchImportService_1.default(mockPool);
        mockItemService = batchImportService.itemService;
        mockTransactionService = batchImportService.transactionService;
        mockItemService.getItemById = vitest_1.vi.fn();
        mockItemService.createItem = vitest_1.vi.fn();
        mockTransactionService.createTransaction = vitest_1.vi.fn();
    });
    (0, vitest_1.describe)('importItems', () => {
        (0, vitest_1.it)('应该成功批量导入物品', async () => {
            const excelData = [
                ['物品名称', '类别', '单位', '低库存阈值'],
                ['测试物品1', '办公用品', '包', '10'],
                ['测试物品2', '电子设备', '台', '5']
            ];
            const buffer = createExcelBuffer(excelData);
            mockItemService.createItem
                .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
                .mockResolvedValueOnce({ id: 'item-2', name: '测试物品2' });
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            const result = await batchImportService.importItems(buffer);
            (0, vitest_1.expect)(result.success).toBe(2);
            (0, vitest_1.expect)(result.failed).toBe(0);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.importedItems).toEqual(['item-1', 'item-2']);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
        (0, vitest_1.it)('应该处理导入错误并回滚事务', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包'],
                ['测试物品2', '电子设备', '台']
            ];
            const buffer = createExcelBuffer(excelData);
            mockItemService.createItem
                .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
                .mockRejectedValueOnce(new Error('物品创建失败'));
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            await (0, vitest_1.expect)(batchImportService.importItems(buffer))
                .rejects.toThrow('批量导入在第2个物品时失败');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
        (0, vitest_1.it)('应该在skipErrors模式下跳过错误继续处理', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包'],
                ['测试物品2', '电子设备', '台'],
                ['测试物品3', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            mockItemService.createItem
                .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
                .mockRejectedValueOnce(new Error('物品创建失败'))
                .mockResolvedValueOnce({ id: 'item-3', name: '测试物品3' });
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            const result = await batchImportService.importItems(buffer, { skipErrors: true });
            (0, vitest_1.expect)(result.success).toBe(2);
            (0, vitest_1.expect)(result.failed).toBe(1);
            (0, vitest_1.expect)(result.errors).toHaveLength(1);
            (0, vitest_1.expect)(result.errors[0]).toContain('物品创建失败');
            (0, vitest_1.expect)(result.importedItems).toEqual(['item-1', 'item-3']);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
        (0, vitest_1.it)('应该在validateOnly模式下仅验证不执行', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包'],
                ['测试物品2', '电子设备', '台']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await batchImportService.importItems(buffer, { validateOnly: true });
            (0, vitest_1.expect)(result.success).toBe(2);
            (0, vitest_1.expect)(result.failed).toBe(0);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(mockItemService.createItem).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockClient.query).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该处理Excel解析错误', async () => {
            const excelData = [
                ['物品名称', '类别'],
                ['测试物品1', '办公用品']
            ];
            const buffer = createExcelBuffer(excelData);
            await (0, vitest_1.expect)(batchImportService.importItems(buffer))
                .rejects.toThrow('缺少必需的列: 单位');
        });
    });
    (0, vitest_1.describe)('importInboundTransactions', () => {
        (0, vitest_1.it)('应该成功批量导入入库交易', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A', '批量采购'],
                ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '50', '2024-01-02', '李四', '供应商B', '补充库存']
            ];
            const buffer = createExcelBuffer(excelData);
            mockTransactionService.createTransaction
                .mockResolvedValueOnce({ id: 'trans-1' })
                .mockResolvedValueOnce({ id: 'trans-2' });
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            const result = await batchImportService.importInboundTransactions(buffer);
            (0, vitest_1.expect)(result.success).toBe(2);
            (0, vitest_1.expect)(result.failed).toBe(0);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.importedTransactions).toEqual(['trans-1', 'trans-2']);
        });
        (0, vitest_1.it)('应该处理入库交易导入错误', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A']
            ];
            const buffer = createExcelBuffer(excelData);
            mockTransactionService.createTransaction
                .mockRejectedValueOnce(new Error('交易创建失败'));
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            await (0, vitest_1.expect)(batchImportService.importInboundTransactions(buffer))
                .rejects.toThrow('批量导入在第1个交易时失败');
        });
    });
    (0, vitest_1.describe)('importOutboundTransactions', () => {
        (0, vitest_1.it)('应该成功批量导入出库交易', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五', '办公使用', '正常领用'],
                ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '5', '2024-01-02', '李四', '赵六', '项目需要', '紧急领用']
            ];
            const buffer = createExcelBuffer(excelData);
            mockTransactionService.createTransaction
                .mockResolvedValueOnce({ id: 'trans-1' })
                .mockResolvedValueOnce({ id: 'trans-2' });
            mockClient.query
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);
            const result = await batchImportService.importOutboundTransactions(buffer);
            (0, vitest_1.expect)(result.success).toBe(2);
            (0, vitest_1.expect)(result.failed).toBe(0);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.importedTransactions).toEqual(['trans-1', 'trans-2']);
        });
    });
    (0, vitest_1.describe)('validateImportData', () => {
        (0, vitest_1.it)('应该验证物品导入数据', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包'],
                ['', '电子设备', '台'],
                ['测试物品3', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await batchImportService.validateImportData(buffer, 'items');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.totalRows).toBe(3);
            (0, vitest_1.expect)(result.validRows).toBe(2);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('应该验证入库交易导入数据', async () => {
            const excelData = [
                ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
                ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A'],
                ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'abc', '2024-01-02', '李四', '供应商B']
            ];
            const buffer = createExcelBuffer(excelData);
            const result = await batchImportService.validateImportData(buffer, 'inbound');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.totalRows).toBe(2);
            (0, vitest_1.expect)(result.validRows).toBe(1);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('getImportTemplate', () => {
        (0, vitest_1.it)('应该生成物品导入模板', () => {
            const buffer = batchImportService.getImportTemplate('items');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('物品导入模板');
            const worksheet = workbook.Sheets['物品导入模板'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[0]).toEqual(['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值']);
        });
        (0, vitest_1.it)('应该生成入库交易模板', () => {
            const buffer = batchImportService.getImportTemplate('inbound');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('入库交易模板');
        });
        (0, vitest_1.it)('应该生成出库交易模板', () => {
            const buffer = batchImportService.getImportTemplate('outbound');
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('出库交易模板');
        });
        (0, vitest_1.it)('应该在不支持的模板类型时抛出错误', () => {
            (0, vitest_1.expect)(() => batchImportService.getImportTemplate('invalid'))
                .toThrow('不支持的模板类型');
        });
    });
    (0, vitest_1.describe)('checkImportPrerequisites', () => {
        (0, vitest_1.it)('应该检查导入前置条件', async () => {
            const transactions = [
                {
                    itemId: '550e8400-e29b-41d4-a716-446655440001',
                    locationId: '550e8400-e29b-41d4-a716-446655440011',
                    type: 'outbound',
                    quantity: 10,
                    date: new Date('2024-01-01'),
                    operator: '张三',
                    recipient: '王五',
                    purpose: '办公使用',
                    notes: ''
                }
            ];
            mockItemService.getItemById
                .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440001', name: '测试物品' });
            const result = await batchImportService.checkImportPrerequisites(transactions);
            (0, vitest_1.expect)(result.missingItems).toHaveLength(0);
            (0, vitest_1.expect)(mockItemService.getItemById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
        });
        (0, vitest_1.it)('应该检测缺失的物品', async () => {
            const transactions = [
                {
                    itemId: 'non-existent-item',
                    locationId: '550e8400-e29b-41d4-a716-446655440011',
                    type: 'inbound',
                    quantity: 10,
                    date: new Date('2024-01-01'),
                    operator: '张三',
                    supplier: '供应商A',
                    notes: ''
                }
            ];
            mockItemService.getItemById
                .mockRejectedValueOnce(new Error('物品不存在'));
            const result = await batchImportService.checkImportPrerequisites(transactions);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.missingItems).toContain('non-existent-item');
        });
    });
    (0, vitest_1.describe)('批次处理', () => {
        (0, vitest_1.it)('应该按指定批次大小处理数据', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包'],
                ['测试物品2', '电子设备', '台'],
                ['测试物品3', '办公用品', '包'],
                ['测试物品4', '电子设备', '台'],
                ['测试物品5', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            mockItemService.createItem
                .mockResolvedValue({ id: 'item-id' });
            mockClient.query
                .mockResolvedValue(undefined);
            const result = await batchImportService.importItems(buffer, { batchSize: 2 });
            (0, vitest_1.expect)(result.success).toBe(5);
            (0, vitest_1.expect)(result.failed).toBe(0);
            const beginCalls = mockClient.query.mock.calls.filter(call => call[0] === 'BEGIN');
            const commitCalls = mockClient.query.mock.calls.filter(call => call[0] === 'COMMIT');
            (0, vitest_1.expect)(beginCalls.length).toBeGreaterThan(1);
            (0, vitest_1.expect)(commitCalls.length).toBeGreaterThan(1);
        });
    });
    (0, vitest_1.describe)('错误处理', () => {
        (0, vitest_1.it)('应该处理无效的Excel文件', async () => {
            const invalidBuffer = Buffer.from('这不是一个Excel文件');
            await (0, vitest_1.expect)(batchImportService.importItems(invalidBuffer))
                .rejects.toThrow('批量导入物品失败');
        });
        (0, vitest_1.it)('应该处理数据库连接错误', async () => {
            const excelData = [
                ['物品名称', '类别', '单位'],
                ['测试物品1', '办公用品', '包']
            ];
            const buffer = createExcelBuffer(excelData);
            mockPool.connect.mockRejectedValueOnce(new Error('数据库连接失败'));
            await (0, vitest_1.expect)(batchImportService.importItems(buffer))
                .rejects.toThrow('批量导入物品失败');
        });
    });
});
//# sourceMappingURL=BatchImportService.test.js.map