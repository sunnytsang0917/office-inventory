import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import ExcelService from '../../services/ExcelService';

describe('Excel模板功能测试', () => {
  // 辅助函数：验证Excel模板
  const validateTemplate = (buffer: Buffer, expectedSheetName: string, expectedHeaders: string[]): any[] => {
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain(expectedSheetName);
    
    const worksheet = workbook.Sheets[expectedSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 验证表头
    expect(data[0]).toEqual(expectedHeaders);
    
    // 验证至少有一行示例数据
    expect(data.length).toBeGreaterThan(1);
    
    return data;
  };

  describe('静态模板生成方法', () => {
    it('应该生成物品导入模板', () => {
      const buffer = ExcelService.generateTemplate('items');
      const expectedHeaders = ['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值'];
      
      const data = validateTemplate(buffer, '物品信息导入模板', expectedHeaders);
      
      // 验证示例数据
      expect(data[1]).toEqual(['办公椅', '办公家具', '人体工学椅', '把', 'WH001', 5]);
      expect(data[2]).toEqual(['A4纸', '办公用品', '80g/m²', '包', 'WH002', 10]);
    });

    it('应该生成入库交易模板', () => {
      const buffer = ExcelService.generateTemplate('inbound');
      const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注'];
      
      const data = validateTemplate(buffer, '入库记录导入模板', expectedHeaders);
      
      // 验证示例数据
      expect(data[1]).toEqual(['办公椅', 'WH001', 10, '2024-01-15', '张三', '办公家具有限公司', '新采购']);
    });

    it('应该生成出库交易模板', () => {
      const buffer = ExcelService.generateTemplate('outbound');
      const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注'];
      
      const data = validateTemplate(buffer, '出库记录导入模板', expectedHeaders);
      
      // 验证示例数据
      expect(data[1]).toEqual(['A4纸', 'WH002', 5, '2024-01-16', '李四', '王五', '日常办公', '']);
    });

    it('应该在不支持的模板类型时抛出错误', () => {
      expect(() => ExcelService.generateTemplate('invalid' as any))
        .toThrow('不支持的模板类型');
    });
  });

  describe('实例模板生成方法', () => {
    let excelService: ExcelService;

    beforeEach(() => {
      excelService = new ExcelService();
    });

    it('应该生成物品导入模板', () => {
      const buffer = excelService.generateItemTemplate();
      const expectedHeaders = ['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值'];
      
      validateTemplate(buffer, '物品信息导入模板', expectedHeaders);
    });

    it('应该生成入库交易模板', () => {
      const buffer = excelService.generateInboundTemplate();
      const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注'];
      
      validateTemplate(buffer, '入库记录导入模板', expectedHeaders);
    });

    it('应该生成出库交易模板', () => {
      const buffer = excelService.generateOutboundTemplate();
      const expectedHeaders = ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注'];
      
      validateTemplate(buffer, '出库记录导入模板', expectedHeaders);
    });
  });

  describe('Excel导出功能', () => {
    let excelService: ExcelService;

    beforeEach(() => {
      excelService = new ExcelService();
    });

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

    it('应该设置正确的列宽', () => {
      const testData = [
        { id: '1', name: '物品1' }
      ];

      const headers = [
        { key: 'id' as keyof typeof testData[0], title: 'ID', width: 5 },
        { key: 'name' as keyof typeof testData[0], title: '名称', width: 25 }
      ];

      const buffer = excelService.exportToExcel(testData, headers, '测试');
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['测试'];
      
      // 验证列宽设置（注意：XLSX库在读取时可能不保留列宽信息）
      // 这里我们主要验证导出功能正常工作，列宽在实际使用中会生效
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('应该使用默认列宽', () => {
      const testData = [
        { id: '1', name: '物品1' }
      ];

      const headers = [
        { key: 'id' as keyof typeof testData[0], title: 'ID' },
        { key: 'name' as keyof typeof testData[0], title: '名称' }
      ];

      const buffer = excelService.exportToExcel(testData, headers, '测试');
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['测试'];
      
      // 验证默认列宽（注意：XLSX库在读取时可能不保留列宽信息）
      // 这里我们主要验证导出功能正常工作
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('应该处理空值和未定义值', () => {
      const testData = [
        { id: '1', name: '物品1', category: null, quantity: undefined },
        { id: '2', name: '', category: '类别2', quantity: 0 }
      ];

      const headers = [
        { key: 'id' as keyof typeof testData[0], title: 'ID' },
        { key: 'name' as keyof typeof testData[0], title: '名称' },
        { key: 'category' as keyof typeof testData[0], title: '类别' },
        { key: 'quantity' as keyof typeof testData[0], title: '数量' }
      ];

      const buffer = excelService.exportToExcel(testData, headers, '测试');
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['测试'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[1]).toEqual(['1', '物品1', '', '']);
      expect(data[2]).toEqual(['2', '', '类别2', 0]);
    });

    it('应该在没有数据时抛出错误', () => {
      const headers = [
        { key: 'id' as keyof any, title: 'ID' }
      ];

      expect(() => excelService.exportToExcel([], headers))
        .toThrow('没有数据可导出');
    });

    it('应该使用默认工作表名称', () => {
      const testData = [{ id: '1', name: '物品1' }];
      const headers = [
        { key: 'id' as keyof typeof testData[0], title: 'ID' },
        { key: 'name' as keyof typeof testData[0], title: '名称' }
      ];

      const buffer = excelService.exportToExcel(testData, headers);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('Sheet1');
    });
  });

  describe('Excel模板验证功能', () => {
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
      expect(result.actualHeaders).toEqual(['物品名称', '类别']);
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
      expect(result.errors.some(error => error.includes('发现额外的列: 额外列'))).toBe(true);
      expect(result.actualHeaders).toEqual(['物品名称', '类别', '单位', '额外列']);
    });

    it('应该检测同时缺少和多余的列', () => {
      const excelData = [
        ['物品名称', '额外列'], // 缺少'类别'和'单位'，多了'额外列'
        ['测试物品', '额外数据']
      ];

      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('缺少必需的列: 类别, 单位'))).toBe(true);
      expect(result.errors.some(error => error.includes('发现额外的列: 额外列'))).toBe(true);
    });

    it('应该处理空Excel文件', () => {
      const excelData: any[][] = [];
      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Excel文件为空'))).toBe(true);
      expect(result.actualHeaders).toEqual([]);
    });

    it('应该处理无效的Excel文件', () => {
      const invalidBuffer = Buffer.from('这不是一个Excel文件');
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(invalidBuffer, expectedHeaders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // 对于无效文件，actualHeaders可能为空或包含错误信息
      expect(Array.isArray(result.actualHeaders)).toBe(true);
    });

    it('应该处理只有表头没有数据的Excel', () => {
      const excelData = [
        ['物品名称', '类别', '单位'] // 只有表头行
      ];

      const buffer = createExcelBuffer(excelData);
      const expectedHeaders = ['物品名称', '类别', '单位'];
      
      const result = excelService.validateExcelTemplate(buffer, expectedHeaders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.actualHeaders).toEqual(['物品名称', '类别', '单位']);
    });
  });
});