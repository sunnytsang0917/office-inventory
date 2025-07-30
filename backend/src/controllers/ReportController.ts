import { Request, Response } from 'express';
import { z } from 'zod';
import ReportService, {
  MonthlyStatsFilter,
  ItemUsageFilter,
  InventoryStatusFilter,
  TransactionHistoryFilter,
  ReportDateRange
} from '../services/ReportService';
import ReportExportService from '../services/ReportExportService';
import { ApiResponse } from '../types';

// 请求参数验证模式
const DateRangeSchema = z.object({
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: '开始日期不能晚于结束日期'
});

const MonthlyStatsQuerySchema = DateRangeSchema.extend({
  locationId: z.string().uuid().optional(),
  category: z.string().optional()
});

const ItemUsageQuerySchema = DateRangeSchema.extend({
  locationId: z.string().uuid().optional(),
  category: z.string().optional(),
  limit: z.string().transform(str => parseInt(str)).optional()
});

const InventoryStatusQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  category: z.string().optional(),
  lowStockOnly: z.string().transform(str => str === 'true').optional()
});

const TransactionHistoryQuerySchema = DateRangeSchema.extend({
  itemId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  type: z.enum(['inbound', 'outbound']).optional(),
  operator: z.string().optional(),
  limit: z.string().transform(str => parseInt(str)).optional(),
  offset: z.string().transform(str => parseInt(str)).optional()
});

const CustomRangeQuerySchema = DateRangeSchema.extend({
  locationId: z.string().uuid().optional(),
  category: z.string().optional()
});

const ExportQuerySchema = z.object({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  reportType: z.enum(['monthly-stats', 'item-usage', 'inventory-status', 'transaction-history', 'custom-range'])
});

export class ReportController {
  private reportService = new ReportService();

  /**
   * 获取月度统计数据
   */
  getMonthlyStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = MonthlyStatsQuerySchema.parse(req.query);
      const filter: MonthlyStatsFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        locationId: queryFilter.locationId,
        category: queryFilter.category
      };
      const data = await this.reportService.getMonthlyStats(filter);

      const response: ApiResponse = {
        success: true,
        message: '月度统计数据获取成功',
        data
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取月度统计数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取物品使用排行数据
   */
  getItemUsageRanking = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = ItemUsageQuerySchema.parse(req.query);
      const filter: ItemUsageFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        locationId: queryFilter.locationId,
        category: queryFilter.category,
        limit: queryFilter.limit
      };
      const data = await this.reportService.getItemUsageRanking(filter);

      const response: ApiResponse = {
        success: true,
        message: '物品使用排行数据获取成功',
        data
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取物品使用排行数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取库存状态报表数据
   */
  getInventoryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = InventoryStatusQuerySchema.parse(req.query);
      const data = await this.reportService.getInventoryStatus(filter);

      const response: ApiResponse = {
        success: true,
        message: '库存状态报表数据获取成功',
        data
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取库存状态报表数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取交易历史报表数据
   */
  getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = TransactionHistoryQuerySchema.parse(req.query);
      const filter: TransactionHistoryFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        itemId: queryFilter.itemId,
        locationId: queryFilter.locationId,
        type: queryFilter.type,
        operator: queryFilter.operator,
        limit: queryFilter.limit,
        offset: queryFilter.offset
      };
      const result = await this.reportService.getTransactionHistory(filter);

      const response: ApiResponse = {
        success: true,
        message: '交易历史报表数据获取成功',
        data: result
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取交易历史报表数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取自定义时间范围统计数据
   */
  getCustomRangeStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = CustomRangeQuerySchema.parse(req.query);
      const filter: ReportDateRange & { locationId?: string; category?: string } = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        locationId: queryFilter.locationId,
        category: queryFilter.category
      };
      const data = await this.reportService.getCustomRangeStats(filter);

      const response: ApiResponse = {
        success: true,
        message: '自定义时间范围统计数据获取成功',
        data
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取自定义时间范围统计数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 导出月度统计报表
   */
  exportMonthlyStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = MonthlyStatsQuerySchema.parse(req.query);
      const exportParams = ExportQuerySchema.parse(req.query);
      
      const filter: MonthlyStatsFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        locationId: queryFilter.locationId,
        category: queryFilter.category
      };
      const data = await this.reportService.getMonthlyStats(filter);

      if (exportParams.format === 'xlsx') {
        const buffer = ReportExportService.exportMonthlyStats(data);
        const filename = ReportExportService.getExportFilename('monthly-stats', 'xlsx');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
      } else {
        const csvContent = ReportExportService.exportMonthlyStatsToCSV(data);
        const filename = ReportExportService.getExportFilename('monthly-stats', 'csv');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send('\uFEFF' + csvContent); // 添加BOM以支持中文
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '导出月度统计报表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 导出物品使用排行报表
   */
  exportItemUsageRanking = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = ItemUsageQuerySchema.parse(req.query);
      const exportParams = ExportQuerySchema.parse(req.query);
      
      const filter: ItemUsageFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        locationId: queryFilter.locationId,
        category: queryFilter.category,
        limit: queryFilter.limit
      };
      const data = await this.reportService.getItemUsageRanking(filter);

      if (exportParams.format === 'xlsx') {
        const buffer = ReportExportService.exportItemUsageRanking(data);
        const filename = ReportExportService.getExportFilename('item-usage', 'xlsx');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
      } else {
        const csvContent = ReportExportService.exportItemUsageRankingToCSV(data);
        const filename = ReportExportService.getExportFilename('item-usage', 'csv');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send('\uFEFF' + csvContent);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '导出物品使用排行报表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 导出库存状态报表
   */
  exportInventoryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = InventoryStatusQuerySchema.parse(req.query);
      const exportParams = ExportQuerySchema.parse(req.query);
      
      const data = await this.reportService.getInventoryStatus(filter);

      if (exportParams.format === 'xlsx') {
        const buffer = ReportExportService.exportInventoryStatus(data);
        const filename = ReportExportService.getExportFilename('inventory-status', 'xlsx');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
      } else {
        const csvContent = ReportExportService.exportInventoryStatusToCSV(data);
        const filename = ReportExportService.getExportFilename('inventory-status', 'csv');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send('\uFEFF' + csvContent);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '导出库存状态报表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 导出交易历史报表
   */
  exportTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryFilter = TransactionHistoryQuerySchema.parse(req.query);
      const exportParams = ExportQuerySchema.parse(req.query);
      
      const filter: TransactionHistoryFilter = {
        startDate: queryFilter.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: queryFilter.endDate || new Date(),
        itemId: queryFilter.itemId,
        locationId: queryFilter.locationId,
        type: queryFilter.type,
        operator: queryFilter.operator,
        limit: undefined,
        offset: undefined
      };
      const result = await this.reportService.getTransactionHistory(filter);

      if (exportParams.format === 'xlsx') {
        const buffer = ReportExportService.exportTransactionHistory(result.data);
        const filename = ReportExportService.getExportFilename('transaction-history', 'xlsx');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
      } else {
        const csvContent = ReportExportService.exportTransactionHistoryToCSV(result.data);
        const filename = ReportExportService.getExportFilename('transaction-history', 'csv');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send('\uFEFF' + csvContent);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '导出交易历史报表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取可用的报表类型
   */
  getAvailableReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = this.reportService.getAvailableReports();

      const response: ApiResponse = {
        success: true,
        message: '可用报表类型获取成功',
        data
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取可用报表类型失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 通用报表导出接口
   */
  exportReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reportType } = req.params;
      const exportParams = ExportQuerySchema.parse(req.query);

      switch (reportType) {
        case 'monthly-stats':
          await this.exportMonthlyStats(req, res);
          break;
        case 'item-usage':
          await this.exportItemUsageRanking(req, res);
          break;
        case 'inventory-status':
          await this.exportInventoryStatus(req, res);
          break;
        case 'transaction-history':
          await this.exportTransactionHistory(req, res);
          break;
        default:
          const response: ApiResponse = {
            success: false,
            message: '不支持的报表类型',
            error: `报表类型 "${reportType}" 不存在`
          };
          res.status(400).json(response);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '导出报表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(400).json(response);
    }
  };
}

export default ReportController;