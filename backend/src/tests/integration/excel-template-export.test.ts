import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import ExcelService from '../../services/ExcelService';
import ReportExportService, {
  MonthlyStatsData,
  ItemUsageRankingData,
  InventoryStatusData,
  TransactionHistoryData
} from '../../services/ReportExportService';

describe('Excel模板和导出功能集成测试', () => {
  describe('模板生成和下载功能', () => {
    it('应该生成完整的物品导入模板', () => {
      const buffer = ExcelService.generateTemplate('items');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证模板内容
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('物品信息导入模板');
      
      const worksheet = workbook.Sheets['物品信息导入模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 验证表头
      expect(data[0]).toEqual(['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值']);
      
      // 验证示例数据
      expect(data.length).toBeGreaterThan(1);
      expect(data[1]).toEqual(['办公椅', '办公家具', '人体工学椅', '把', 'WH001', 5]);
    });

    it('应该生成完整的入库交易模板', () => {
      const buffer = ExcelService.generateTemplate('inbound');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证模板内容
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('入库记录导入模板');
      
      const worksheet = workbook.Sheets['入库记录导入模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 验证表头
      expect(data[0]).toEqual(['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注']);
      
      // 验证示例数据
      expect(data.length).toBeGreaterThan(1);
    });

    it('应该生成完整的出库交易模板', () => {
      const buffer = ExcelService.generateTemplate('outbound');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证模板内容
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('出库记录导入模板');
      
      const worksheet = workbook.Sheets['出库记录导入模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 验证表头
      expect(data[0]).toEqual(['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注']);
      
      // 验证示例数据
      expect(data.length).toBeGreaterThan(1);
    });
  });

  describe('报表导出功能', () => {
    it('应该导出完整的月度统计报表', () => {
      const testData: MonthlyStatsData[] = [
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

      // 测试Excel导出
      const excelBuffer = ReportExportService.exportMonthlyStats(testData);
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);

      // 验证Excel内容
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('月度统计');
      
      const worksheet = workbook.Sheets['月度统计'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['月份', '入库总量', '出库总量', '净变化', '涉及物品数']);
      expect(data[1]).toEqual(['2024-01', 1000, 800, 200, 50]);

      // 测试CSV导出
      const csvData = ReportExportService.exportMonthlyStatsToCSV(testData);
      expect(csvData).toContain('月份,入库总量,出库总量,净变化,涉及物品数');
      expect(csvData).toContain('2024-01,1000,800,200,50');
    });

    it('应该导出完整的库存状态报表', () => {
      const testData: InventoryStatusData[] = [
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

      // 测试Excel导出
      const excelBuffer = ReportExportService.exportInventoryStatus(testData);
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);

      // 验证Excel内容
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('库存状态');
      
      const worksheet = workbook.Sheets['库存状态'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual([
        '物品名称', '物品类别', '库房位置', '当前库存', 
        '低库存阈值', '库存状态', '最后交易日期'
      ]);
      
      // 验证状态转换
      expect(data[1]).toEqual([
        'A4纸', '办公用品', 'A区-1层-货架01', 100, 50, '正常', '2024-01-15'
      ]);
      expect(data[2]).toEqual([
        '办公椅', '办公家具', 'B区-2层-货架02', 5, 10, '低库存', '2024-01-10'
      ]);

      // 测试CSV导出
      const csvData = ReportExportService.exportInventoryStatusToCSV(testData);
      expect(csvData).toContain('物品名称,物品类别,库房位置,当前库存,低库存阈值,库存状态,最后交易日期');
      expect(csvData).toContain('A4纸,办公用品,A区-1层-货架01,100,50,normal,2024-01-15');
    });

    it('应该导出完整的交易历史报表', () => {
      const testData: TransactionHistoryData[] = [
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

      // 测试Excel导出
      const excelBuffer = ReportExportService.exportTransactionHistory(testData);
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);

      // 验证Excel内容
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('交易历史');
      
      const worksheet = workbook.Sheets['交易历史'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual([
        '日期', '物品名称', '库房位置', '交易类型', '数量', 
        '操作人', '供应商', '领用人', '用途'
      ]);
      
      // 验证交易类型转换
      expect(data[1]).toEqual([
        '2024-01-15', 'A4纸', 'A区-1层-货架01', '入库', 100, 
        '张三', '办公用品公司', '', ''
      ]);
      expect(data[2]).toEqual([
        '2024-01-16', 'A4纸', 'A区-1层-货架01', '出库', 20, 
        '李四', '', '王五', '日常办公'
      ]);

      // 测试CSV导出
      const csvData = ReportExportService.exportTransactionHistoryToCSV(testData);
      expect(csvData).toContain('日期,物品名称,库房位置,交易类型,数量,操作人,供应商,领用人,用途');
      expect(csvData).toContain('2024-01-15,A4纸,A区-1层-货架01,inbound,100,张三,办公用品公司,,');
    });
  });

  describe('文件名生成功能', () => {
    it('应该生成正确格式的文件名', () => {
      const excelFilename = ReportExportService.getExportFilename('monthly-stats', 'xlsx');
      const csvFilename = ReportExportService.getExportFilename('inventory-status', 'csv');
      
      expect(excelFilename).toMatch(/^月度统计报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
      expect(csvFilename).toMatch(/^库存状态报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('数据处理功能', () => {
    it('应该正确处理特殊字符和格式', () => {
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

      // 测试CSV导出对特殊字符的处理
      const csvData = ReportExportService.exportInventoryStatusToCSV(testData);
      
      // 包含逗号的字段应该被引号包围
      expect(csvData).toContain('"办公用品,A4纸"');
      expect(csvData).toContain('"A区,1层,货架01"');
      
      // 包含引号的字段应该被正确转义
      expect(csvData).toContain('"纸张""高级""类"');
    });

    it('应该正确处理空值和布尔值', () => {
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

      const csvData = ReportExportService.exportToCSV(testData, headers);
      const lines = csvData.split('\n');

      expect(lines[0]).toBe('名称,状态,数量,描述');
      expect(lines[1]).toBe('物品1,true,,');
      expect(lines[2]).toBe('物品2,false,0,');
    });
  });
});