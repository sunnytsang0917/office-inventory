import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import ExcelService, { ExcelParseError } from '../../services/ExcelService';
import { ItemData } from '../../models/Item';
import { CreateTransactionDto } from '../../models/Transaction';

describe('ExcelService', () => {
  let excelService: ExcelService;

  beforeEach(() => {
    excelService = new ExcelService();
  });

  // 辅助函数：创建Excel Buffer
  const createExcelBuffer = (data: any[][]): Buffer => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  };

  describe('parseItemsExcel', () => {
    it('应该成功解析有效的物品Excel文件', async () => {
      const excelData = [
        ['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值'],
        ['测试物品1', '办公用品', 'A4规格', '包', '550e8400-e29b-41d4-a716-446655440001', '10'],
        ['测试物品2', '电子设备', '标准规格', '台', '550e8400-e29b-41d4-a716-446655440002', '5']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseItemsExcel(buffer);



      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      
      expect(result.data[0]).toEqual({
        name: '测试物品1',
        category: '办公用品',
        specification: 'A4规格',
        unit: '包',
        defaultLocationId: '550e8400-e29b-41d4-a716-446655440001',
        lowStockThreshold: 10
      });

      expect(result.data[1]).toEqual({
        name: '测试物品2',
        category: '电子设备',
        specification: '标准规格',
        unit: '台',
        defaultLocationId: '550e8400-e29b-41d4-a716-446655440002',
        lowStockThreshold: 5
      });
    });

    it('应该处理缺少可选字段的情况', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseItemsExcel(buffer);

      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      expect(result.data[0]).toEqual({
        name: '测试物品',
        category: '办公用品',
        unit: '包',
        lowStockThreshold: 0
      });
    });

    it('应该在缺少必需列时抛出错误', async () => {
      const excelData = [
        ['物品名称', '类别'], // 缺少'单位'列
        ['测试物品', '办公用品']
      ];

      const buffer = createExcelBuffer(excelData);
      
      await expect(excelService.parseItemsExcel(buffer))
        .rejects.toThrow('缺少必需的列: 单位');
    });

    it('应该验证数据并报告错误', async () => {
      const excelData = [
        ['物品名称', '类别', '单位', '低库存阈值'],
        ['', '办公用品', '包', '10'], // 物品名称为空
        ['测试物品', '', '包', 'abc'], // 类别为空，低库存阈值不是数字
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseItemsExcel(buffer);



      expect(result.data).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // 检查错误信息包含行号
      expect(result.errors.some(error => error.row === 2)).toBe(true);
      expect(result.errors.some(error => error.row === 3)).toBe(true);
    });

    it('应该在Excel文件为空时抛出错误', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'] // 只有标题行，没有数据
      ];

      const buffer = createExcelBuffer(excelData);
      
      await expect(excelService.parseItemsExcel(buffer))
        .rejects.toThrow('Excel文件至少需要包含标题行和一行数据');
    });
  });

  describe('parseInboundTransactionsExcel', () => {
    it('应该成功解析有效的入库交易Excel文件', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A', '批量采购'],
        ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '50', '2024-01-02', '李四', '供应商B', '补充库存']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseInboundTransactionsExcel(buffer);

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      
      expect(result.data[0]).toEqual({
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

    it('应该在缺少入库必需列时抛出错误', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人'], // 缺少'供应商'列
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三']
      ];

      const buffer = createExcelBuffer(excelData);
      
      await expect(excelService.parseInboundTransactionsExcel(buffer))
        .rejects.toThrow('缺少必需的列: 供应商');
    });
  });

  describe('parseOutboundTransactionsExcel', () => {
    it('应该成功解析有效的出库交易Excel文件', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五', '办公使用', '正常领用'],
        ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '5', '2024-01-02', '李四', '赵六', '项目需要', '紧急领用']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseOutboundTransactionsExcel(buffer);

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      
      expect(result.data[0]).toEqual({
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

    it('应该在缺少出库必需列时抛出错误', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人'], // 缺少'用途'列
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五']
      ];

      const buffer = createExcelBuffer(excelData);
      
      await expect(excelService.parseOutboundTransactionsExcel(buffer))
        .rejects.toThrow('缺少必需的列: 用途');
    });
  });

  describe('模板生成功能', () => {
    it('应该生成物品导入模板', () => {
      const buffer = excelService.generateItemTemplate();
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证生成的模板可以被解析
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('物品导入模板');
      
      const worksheet = workbook.Sheets['物品导入模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值']);
    });

    it('应该生成入库交易模板', () => {
      const buffer = excelService.generateInboundTemplate();
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('入库交易模板');
      
      const worksheet = workbook.Sheets['入库交易模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注']);
    });

    it('应该生成出库交易模板', () => {
      const buffer = excelService.generateOutboundTemplate();
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('出库交易模板');
      
      const worksheet = workbook.Sheets['出库交易模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注']);
    });
  });

  describe('exportToExcel', () => {
    it('应该导出数据到Excel', () => {
      const testData = [
        { id: '1', name: '物品1', category: '类别1', quantity: 100 },
        { id: '2', name: '物品2', category: '类别2', quantity: 50 }
      ];

      const headers = [
        { key: 'id' as keyof typeof testData[0], title: 'ID', width: 10 },
        { key: 'name' as keyof typeof testData[0], title: '名称', width: 20 },
        { key: 'category' as keyof typeof testData[0], title: '类别', width: 15 },
        { key: 'quantity' as keyof typeof testData[0], title: '数量', width: 10 }
      ];

      const buffer = excelService.exportToExcel(testData, headers, '测试数据');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证导出的Excel可以被解析
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('测试数据');
      
      const worksheet = workbook.Sheets['测试数据'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['ID', '名称', '类别', '数量']);
      expect(data[1]).toEqual(['1', '物品1', '类别1', 100]);
      expect(data[2]).toEqual(['2', '物品2', '类别2', 50]);
    });

    it('应该在没有数据时抛出错误', () => {
      const headers = [
        { key: 'id' as keyof any, title: 'ID' }
      ];

      expect(() => excelService.exportToExcel([], headers))
        .toThrow('没有数据可导出');
    });
  });

  describe('validateExcelTemplate', () => {
    it('应该验证Excel模板格式正确', () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualHeaders).toEqual(['物品名称', '类别', '单位']);
    });

    it('应该检测缺少的必需列', () => {
      const excelData = [
        ['物品名称', '类别'], // 缺少'单位'列
        ['测试物品', '办公用品']
      ];

      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('缺少必需的列: 单位'))).toBe(true);
    });

    it('应该检测额外的列', () => {
      const excelData = [
        ['物品名称', '类别', '单位', '额外列'],
        ['测试物品', '办公用品', '包', '额外数据']
      ];

      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('发现额外的列'))).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的Excel文件', async () => {
      const invalidBuffer = Buffer.from('这不是一个Excel文件');
      
      await expect(excelService.parseItemsExcel(invalidBuffer))
        .rejects.toThrow(ExcelParseError);
    });

    it('应该处理过大的文件', async () => {
      // 创建一个超过10MB的buffer
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      await expect(excelService.parseItemsExcel(largeBuffer))
        .rejects.toThrow('Excel文件大小不能超过10MB');
    });

    it('应该处理日期格式错误', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '无效日期', '张三', '供应商A']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseInboundTransactionsExcel(buffer);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.message.includes('日期格式不正确'))).toBe(true);
    });

    it('应该处理数字格式错误', async () => {
      const excelData = [
        ['物品名称', '类别', '单位', '低库存阈值'],
        ['测试物品', '办公用品', '包', '不是数字']
      ];

      const buffer = createExcelBuffer(excelData);
      const result = await excelService.parseItemsExcel(buffer);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.message.includes('必须是数字'))).toBe(true);
    });
  });
});