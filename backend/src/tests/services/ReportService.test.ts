import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReportService from '../../services/ReportService';

// 模拟数据库模块
vi.mock('../../config/database', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}));

describe('ReportService', () => {
  let reportService: ReportService;
  let mockClient: any;

  beforeEach(async () => {
    reportService = new ReportService();
    
    // 设置模拟客户端
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    const { pool } = await import('../../config/database');
    (pool.connect as any).mockResolvedValue(mockClient);
  });

  describe('getMonthlyStats', () => {
    it('应该返回月度统计数据', async () => {
      // 模拟数据库查询结果
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

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: '2024-01',
        inboundTotal: 100,
        outboundTotal: 50,
        netChange: 50,
        itemCount: 5
      });
      expect(result[1]).toEqual({
        month: '2024-02',
        inboundTotal: 80,
        outboundTotal: 30,
        netChange: 50,
        itemCount: 3
      });
    });
  });

  describe('getItemUsageRanking', () => {
    it('应该返回物品使用排行数据', async () => {
      // 模拟数据库查询结果
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

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        itemName: '办公椅',
        category: '办公家具',
        totalOutbound: 25,
        frequency: 5,
        lastUsedDate: '2024-01-20'
      });
      expect(result[1]).toEqual({
        itemName: '打印纸',
        category: '办公用品',
        totalOutbound: 100,
        frequency: 10,
        lastUsedDate: '2024-01-25'
      });
    });
  });

  describe('getInventoryStatus', () => {
    it('应该返回库存状态数据', async () => {
      // 模拟数据库查询结果
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

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        itemName: '办公椅',
        category: '办公家具',
        locationName: 'A区货架01',
        currentStock: 5,
        lowStockThreshold: 10,
        status: 'low',
        lastTransactionDate: '2024-01-20'
      });
      expect(result[1]).toEqual({
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

  describe('getTransactionHistory', () => {
    it('应该返回交易历史数据', async () => {
      // 模拟总数查询
      mockClient.query.mockResolvedValueOnce({
        rows: [{ total: '2' }]
      });

      // 模拟数据查询
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

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
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
      expect(result.data[1]).toEqual({
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

  describe('getAvailableReports', () => {
    it('应该返回可用的报表类型', () => {
      const result = reportService.getAvailableReports();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      const reportTypes = result.map(report => report.type);
      expect(reportTypes).toContain('monthly-stats');
      expect(reportTypes).toContain('item-usage');
      expect(reportTypes).toContain('inventory-status');
      expect(reportTypes).toContain('transaction-history');
      expect(reportTypes).toContain('custom-range');

      // 验证每个报表都有必要的属性
      result.forEach(report => {
        expect(report).toHaveProperty('type');
        expect(report).toHaveProperty('name');
        expect(report).toHaveProperty('description');
        expect(report).toHaveProperty('supportedFormats');
        expect(report.supportedFormats).toContain('xlsx');
        expect(report.supportedFormats).toContain('csv');
      });
    });
  });
});