import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import ReportExportService, {
  MonthlyStatsData,
  ItemUsageRankingData,
  InventoryStatusData,
  TransactionHistoryData
} from '../../services/ReportExportService';

describe('ReportExportService', () => {
  // 辅助函数：验证Excel Buffer
  const validateExcelBuffer = (buffer: Buffer, expectedSheetName: string): any[] => {
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain(expectedSheetName);
    
    const worksheet = workbook.Sheets[expectedSheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  };

  describe('Excel导出功能', () => {
    it('应该导出月度统计报表为Excel', () => {
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

      const buffer = ReportExportService.exportMonthlyStats(testData);
      const data = validateExcelBuffer(buffer, '月度统计');

      // 验证表头
      expect(data[0]).toEqual(['月份', '入库总量', '出库总量', '净变化', '涉及物品数']);
      
      // 验证数据
      expect(data[1]).toEqual(['2024-01', 1000, 800, 200, 50]);
      expect(data[2]).toEqual(['2024-02', 1200, 900, 300, 55]);
    });

    it('应该导出物品使用排行报表为Excel', () => {
      const testData: ItemUsageRankingData[] = [
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

      const buffer = ReportExportService.exportItemUsageRanking(testData);
      const data = validateExcelBuffer(buffer, '使用排行');

      // 验证表头
      expect(data[0]).toEqual(['物品名称', '物品类别', '总出库量', '使用频次', '最后使用日期']);
      
      // 验证数据
      expect(data[1]).toEqual(['A4纸', '办公用品', 500, 25, '2024-01-15']);
      expect(data[2]).toEqual(['办公椅', '办公家具', 10, 5, '2024-01-10']);
    });

    it('应该导出库存状态报表为Excel', () => {
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

      const buffer = ReportExportService.exportInventoryStatus(testData);
      const data = validateExcelBuffer(buffer, '库存状态');

      // 验证表头
      expect(data[0]).toEqual([
        '物品名称', '物品类别', '库房位置', '当前库存', 
        '低库存阈值', '库存状态', '最后交易日期'
      ]);
      
      // 验证数据（状态应该被转换为中文）
      expect(data[1]).toEqual([
        'A4纸', '办公用品', 'A区-1层-货架01', 100, 50, '正常', '2024-01-15'
      ]);
      expect(data[2]).toEqual([
        '办公椅', '办公家具', 'B区-2层-货架02', 5, 10, '低库存', '2024-01-10'
      ]);
    });

    it('应该导出交易历史报表为Excel', () => {
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

      const buffer = ReportExportService.exportTransactionHistory(testData);
      const data = validateExcelBuffer(buffer, '交易历史');

      // 验证表头
      expect(data[0]).toEqual([
        '日期', '物品名称', '库房位置', '交易类型', '数量', 
        '操作人', '供应商', '领用人', '用途'
      ]);
      
      // 验证数据（交易类型应该被转换为中文）
      expect(data[1]).toEqual([
        '2024-01-15', 'A4纸', 'A区-1层-货架01', '入库', 100, 
        '张三', '办公用品公司', '', ''
      ]);
      expect(data[2]).toEqual([
        '2024-01-16', 'A4纸', 'A区-1层-货架01', '出库', 20, 
        '李四', '', '王五', '日常办公'
      ]);
    });

    it('应该在没有数据时抛出错误', () => {
      expect(() => ReportExportService.exportMonthlyStats([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportItemUsageRanking([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportInventoryStatus([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportTransactionHistory([]))
        .toThrow('没有数据可导出');
    });
  });

  describe('CSV导出功能', () => {
    it('应该导出月度统计为CSV', () => {
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

      const csv = ReportExportService.exportMonthlyStatsToCSV(testData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('月份,入库总量,出库总量,净变化,涉及物品数');
      expect(lines[1]).toBe('2024-01,1000,800,200,50');
      expect(lines[2]).toBe('2024-02,1200,900,300,55');
    });

    it('应该导出物品使用排行为CSV', () => {
      const testData: ItemUsageRankingData[] = [
        {
          itemName: 'A4纸',
          category: '办公用品',
          totalOutbound: 500,
          frequency: 25,
          lastUsedDate: '2024-01-15'
        }
      ];

      const csv = ReportExportService.exportItemUsageRankingToCSV(testData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('物品名称,物品类别,总出库量,使用频次,最后使用日期');
      expect(lines[1]).toBe('A4纸,办公用品,500,25,2024-01-15');
    });

    it('应该导出库存状态为CSV', () => {
      const testData: InventoryStatusData[] = [
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

      const csv = ReportExportService.exportInventoryStatusToCSV(testData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('物品名称,物品类别,库房位置,当前库存,低库存阈值,库存状态,最后交易日期');
      expect(lines[1]).toBe('A4纸,办公用品,A区-1层-货架01,100,50,normal,2024-01-15');
    });

    it('应该导出交易历史为CSV', () => {
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
        }
      ];

      const csv = ReportExportService.exportTransactionHistoryToCSV(testData);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('日期,物品名称,库房位置,交易类型,数量,操作人,供应商,领用人,用途');
      expect(lines[1]).toBe('2024-01-15,A4纸,A区-1层-货架01,inbound,100,张三,办公用品公司,,');
    });

    it('应该处理包含逗号的数据', () => {
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

      const csv = ReportExportService.exportInventoryStatusToCSV(testData);
      const lines = csv.split('\n');

      // 包含逗号的字段应该被引号包围
      expect(lines[1]).toContain('"办公用品,A4纸"');
      expect(lines[1]).toContain('"A区,1层,货架01"');
    });

    it('应该处理包含引号的数据', () => {
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

      const csv = ReportExportService.exportInventoryStatusToCSV(testData);
      const lines = csv.split('\n');

      // 包含引号的字段应该被引号包围，内部引号应该被转义
      expect(lines[1]).toContain('"办公椅""豪华版"""');
    });

    it('应该在没有数据时抛出错误', () => {
      expect(() => ReportExportService.exportMonthlyStatsToCSV([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportItemUsageRankingToCSV([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportInventoryStatusToCSV([]))
        .toThrow('没有数据可导出');
      
      expect(() => ReportExportService.exportTransactionHistoryToCSV([]))
        .toThrow('没有数据可导出');
    });
  });

  describe('通用CSV导出功能', () => {
    it('应该导出通用数据为CSV', () => {
      const testData = [
        { name: '物品1', count: 100, active: true },
        { name: '物品2', count: 200, active: false }
      ];

      const headers = [
        { key: 'name', title: '名称' },
        { key: 'count', title: '数量' },
        { key: 'active', title: '状态' }
      ];

      const csv = ReportExportService.exportToCSV(testData, headers);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('名称,数量,状态');
      expect(lines[1]).toBe('物品1,100,true');
      expect(lines[2]).toBe('物品2,200,false');
    });

    it('应该处理空值和未定义值', () => {
      const testData = [
        { name: '物品1', count: null, active: undefined },
        { name: '', count: 0, active: false }
      ];

      const headers = [
        { key: 'name', title: '名称' },
        { key: 'count', title: '数量' },
        { key: 'active', title: '状态' }
      ];

      const csv = ReportExportService.exportToCSV(testData, headers);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('名称,数量,状态');
      expect(lines[1]).toBe('物品1,,');
      expect(lines[2]).toBe(',0,false');
    });
  });

  describe('文件名生成功能', () => {
    it('应该生成正确的Excel文件名', () => {
      const filename = ReportExportService.getExportFilename('monthly-stats', 'xlsx');
      expect(filename).toMatch(/^月度统计报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
    });

    it('应该生成正确的CSV文件名', () => {
      const filename = ReportExportService.getExportFilename('item-usage', 'csv');
      expect(filename).toMatch(/^物品使用排行_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('应该处理未知的报表类型', () => {
      const filename = ReportExportService.getExportFilename('unknown-type', 'xlsx');
      expect(filename).toMatch(/^报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
    });

    it('应该默认使用xlsx格式', () => {
      const filename = ReportExportService.getExportFilename('inventory-status');
      expect(filename).toMatch(/^库存状态报表_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
    });
  });
});