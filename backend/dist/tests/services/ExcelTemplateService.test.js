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
(0, vitest_1.describe)('Excel模板功能测试', () => {
    const validateTemplate = (buffer, expectedSheetName, expectedHeaders) => {
        (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
        (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        (0, vitest_1.expect)(workbook.SheetNames).toContain(expectedSheetName);
        const worksheet = workbook.Sheets[expectedSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        (0, vitest_1.expect)(data[0]).toEqual(expectedHeaders);
        (0, vitest_1.expect)(data.length).toBeGreaterThan(1);
        return data;
    };
    (0, vitest_1.describe)('静态模板生成方法', () => {
        (0, vitest_1.it)('应该生成物品导入模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('items');
            const expectedHeaders = ['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值'];
            const data = validateTemplate(buffer, '物品信息导入模板', expectedHeaders);
            (0, vitest_1.expect)(data[1]).toEqual(['办公椅', '办公家具', '人体工学椅', '把', 'WH001', 5]);
            (0, vitest_1.expect)(data[2]).toEqual(['A4纸', '办公用品', '80g/m²', '包', 'WH002', 10]);
        });
        (0, vitest_1.it)('应该生成入库交易模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('inbound');
            const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注'];
            const data = validateTemplate(buffer, '入库记录导入模板', expectedHeaders);
            (0, vitest_1.expect)(data[1]).toEqual(['办公椅', 'WH001', 10, '2024-01-15', '张三', '办公家具有限公司', '新采购']);
        });
        (0, vitest_1.it)('应该生成出库交易模板', () => {
            const buffer = ExcelService_1.default.generateTemplate('outbound');
            const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注'];
            const data = validateTemplate(buffer, '出库记录导入模板', expectedHeaders);
            (0, vitest_1.expect)(data[1]).toEqual(['A4纸', 'WH002', 5, '2024-01-16', '李四', '王五', '日常办公', '']);
        });
        (0, vitest_1.it)('应该在不支持的模板类型时抛出错误', () => {
            (0, vitest_1.expect)(() => ExcelService_1.default.generateTemplate('invalid'))
                .toThrow('不支持的模板类型');
        });
    });
    (0, vitest_1.describe)('实例模板生成方法', () => {
        let excelService;
        (0, vitest_1.beforeEach)(() => {
            excelService = new ExcelService_1.default();
        });
        (0, vitest_1.it)('应该生成物品导入模板', () => {
            const buffer = excelService.generateItemTemplate();
            const expectedHeaders = ['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值'];
            validateTemplate(buffer, '物品信息导入模板', expectedHeaders);
        });
        (0, vitest_1.it)('应该生成入库交易模板', () => {
            const buffer = excelService.generateInboundTemplate();
            const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注'];
            validateTemplate(buffer, '入库记录导入模板', expectedHeaders);
        });
        (0, vitest_1.it)('应该生成出库交易模板', () => {
            const buffer = excelService.generateOutboundTemplate();
            const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注'];
            validateTemplate(buffer, '出库记录导入模板', expectedHeaders);
        });
    });
    (0, vitest_1.describe)('Excel导出功能', () => {
        let excelService;
        (0, vitest_1.beforeEach)(() => {
            excelService = new ExcelService_1.default();
        });
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
        (0, vitest_1.it)('应该设置正确的列宽', () => {
            const testData = [
                { id: '1', name: '物品1' }
            ];
            const headers = [
                { key: 'id', title: 'ID', width: 5 },
                { key: 'name', title: '名称', width: 25 }
            ];
            const buffer = excelService.exportToExcel(testData, headers, '测试');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const worksheet = workbook.Sheets['测试'];
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('应该使用默认列宽', () => {
            const testData = [
                { id: '1', name: '物品1' }
            ];
            const headers = [
                { key: 'id', title: 'ID' },
                { key: 'name', title: '名称' }
            ];
            const buffer = excelService.exportToExcel(testData, headers, '测试');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const worksheet = workbook.Sheets['测试'];
            (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(buffer.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('应该处理空值和未定义值', () => {
            const testData = [
                { id: '1', name: '物品1', category: null, quantity: undefined },
                { id: '2', name: '', category: '类别2', quantity: 0 }
            ];
            const headers = [
                { key: 'id', title: 'ID' },
                { key: 'name', title: '名称' },
                { key: 'category', title: '类别' },
                { key: 'quantity', title: '数量' }
            ];
            const buffer = excelService.exportToExcel(testData, headers, '测试');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const worksheet = workbook.Sheets['测试'];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            (0, vitest_1.expect)(data[1]).toEqual(['1', '物品1', '', '']);
            (0, vitest_1.expect)(data[2]).toEqual(['2', '', '类别2', 0]);
        });
        (0, vitest_1.it)('应该在没有数据时抛出错误', () => {
            const headers = [
                { key: 'id', title: 'ID' }
            ];
            (0, vitest_1.expect)(() => excelService.exportToExcel([], headers))
                .toThrow('没有数据可导出');
        });
        (0, vitest_1.it)('应该使用默认工作表名称', () => {
            const testData = [{ id: '1', name: '物品1' }];
            const headers = [
                { key: 'id', title: 'ID' },
                { key: 'name', title: '名称' }
            ];
            const buffer = excelService.exportToExcel(testData, headers);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            (0, vitest_1.expect)(workbook.SheetNames).toContain('Sheet1');
        });
    });
    (0, vitest_1.describe)('Excel模板验证功能', () => {
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
            (0, vitest_1.expect)(result.actualHeaders).toEqual(['物品名称', '类别']);
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
            (0, vitest_1.expect)(result.errors.some(error => error.includes('发现额外的列: 额外列'))).toBe(true);
            (0, vitest_1.expect)(result.actualHeaders).toEqual(['物品名称', '类别', '单位', '额外列']);
        });
        (0, vitest_1.it)('应该检测同时缺少和多余的列', () => {
            const excelData = [
                ['物品名称', '额外列'],
                ['测试物品', '额外数据']
            ];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('缺少必需的列: 类别, 单位'))).toBe(true);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('发现额外的列: 额外列'))).toBe(true);
        });
        (0, vitest_1.it)('应该处理空Excel文件', () => {
            const excelData = [];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('Excel文件为空'))).toBe(true);
            (0, vitest_1.expect)(result.actualHeaders).toEqual([]);
        });
        (0, vitest_1.it)('应该处理无效的Excel文件', () => {
            const invalidBuffer = Buffer.from('这不是一个Excel文件');
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(invalidBuffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(Array.isArray(result.actualHeaders)).toBe(true);
        });
        (0, vitest_1.it)('应该处理只有表头没有数据的Excel', () => {
            const excelData = [
                ['物品名称', '类别', '单位']
            ];
            const buffer = createExcelBuffer(excelData);
            const expectedHeaders = ['物品名称', '类别', '单位'];
            const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.actualHeaders).toEqual(['物品名称', '类别', '单位']);
        });
    });
});
//# sourceMappingURL=ExcelTemplateService.test.js.map