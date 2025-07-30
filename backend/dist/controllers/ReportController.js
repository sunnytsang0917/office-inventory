"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const zod_1 = require("zod");
const ReportService_1 = __importDefault(require("../services/ReportService"));
const ReportExportService_1 = __importDefault(require("../services/ReportExportService"));
const DateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().transform(str => new Date(str)),
    endDate: zod_1.z.string().transform(str => new Date(str))
}).refine(data => data.startDate <= data.endDate, {
    message: '开始日期不能晚于结束日期'
});
const MonthlyStatsQuerySchema = DateRangeSchema.extend({
    locationId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional()
});
const ItemUsageQuerySchema = DateRangeSchema.extend({
    locationId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional(),
    limit: zod_1.z.string().transform(str => parseInt(str)).optional()
});
const InventoryStatusQuerySchema = zod_1.z.object({
    locationId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional(),
    lowStockOnly: zod_1.z.string().transform(str => str === 'true').optional()
});
const TransactionHistoryQuerySchema = DateRangeSchema.extend({
    itemId: zod_1.z.string().uuid().optional(),
    locationId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['inbound', 'outbound']).optional(),
    operator: zod_1.z.string().optional(),
    limit: zod_1.z.string().transform(str => parseInt(str)).optional(),
    offset: zod_1.z.string().transform(str => parseInt(str)).optional()
});
const CustomRangeQuerySchema = DateRangeSchema.extend({
    locationId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional()
});
const ExportQuerySchema = zod_1.z.object({
    format: zod_1.z.enum(['xlsx', 'csv']).default('xlsx'),
    reportType: zod_1.z.enum(['monthly-stats', 'item-usage', 'inventory-status', 'transaction-history', 'custom-range'])
});
class ReportController {
    constructor() {
        this.reportService = new ReportService_1.default();
        this.getMonthlyStats = async (req, res) => {
            try {
                const filter = MonthlyStatsQuerySchema.parse(req.query);
                const data = await this.reportService.getMonthlyStats(filter);
                const response = {
                    success: true,
                    message: '月度统计数据获取成功',
                    data
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取月度统计数据失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.getItemUsageRanking = async (req, res) => {
            try {
                const filter = ItemUsageQuerySchema.parse(req.query);
                const data = await this.reportService.getItemUsageRanking(filter);
                const response = {
                    success: true,
                    message: '物品使用排行数据获取成功',
                    data
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取物品使用排行数据失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.getInventoryStatus = async (req, res) => {
            try {
                const filter = InventoryStatusQuerySchema.parse(req.query);
                const data = await this.reportService.getInventoryStatus(filter);
                const response = {
                    success: true,
                    message: '库存状态报表数据获取成功',
                    data
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取库存状态报表数据失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.getTransactionHistory = async (req, res) => {
            try {
                const filter = TransactionHistoryQuerySchema.parse(req.query);
                const result = await this.reportService.getTransactionHistory(filter);
                const response = {
                    success: true,
                    message: '交易历史报表数据获取成功',
                    data: result
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取交易历史报表数据失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.getCustomRangeStats = async (req, res) => {
            try {
                const filter = CustomRangeQuerySchema.parse(req.query);
                const data = await this.reportService.getCustomRangeStats(filter);
                const response = {
                    success: true,
                    message: '自定义时间范围统计数据获取成功',
                    data
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取自定义时间范围统计数据失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.exportMonthlyStats = async (req, res) => {
            try {
                const filter = MonthlyStatsQuerySchema.parse(req.query);
                const exportParams = ExportQuerySchema.parse(req.query);
                const data = await this.reportService.getMonthlyStats(filter);
                if (exportParams.format === 'xlsx') {
                    const buffer = ReportExportService_1.default.exportMonthlyStats(data);
                    const filename = ReportExportService_1.default.getExportFilename('monthly-stats', 'xlsx');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send(buffer);
                }
                else {
                    const csvContent = ReportExportService_1.default.exportMonthlyStatsToCSV(data);
                    const filename = ReportExportService_1.default.getExportFilename('monthly-stats', 'csv');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send('\uFEFF' + csvContent);
                }
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '导出月度统计报表失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.exportItemUsageRanking = async (req, res) => {
            try {
                const filter = ItemUsageQuerySchema.parse(req.query);
                const exportParams = ExportQuerySchema.parse(req.query);
                const data = await this.reportService.getItemUsageRanking(filter);
                if (exportParams.format === 'xlsx') {
                    const buffer = ReportExportService_1.default.exportItemUsageRanking(data);
                    const filename = ReportExportService_1.default.getExportFilename('item-usage', 'xlsx');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send(buffer);
                }
                else {
                    const csvContent = ReportExportService_1.default.exportItemUsageRankingToCSV(data);
                    const filename = ReportExportService_1.default.getExportFilename('item-usage', 'csv');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send('\uFEFF' + csvContent);
                }
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '导出物品使用排行报表失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.exportInventoryStatus = async (req, res) => {
            try {
                const filter = InventoryStatusQuerySchema.parse(req.query);
                const exportParams = ExportQuerySchema.parse(req.query);
                const data = await this.reportService.getInventoryStatus(filter);
                if (exportParams.format === 'xlsx') {
                    const buffer = ReportExportService_1.default.exportInventoryStatus(data);
                    const filename = ReportExportService_1.default.getExportFilename('inventory-status', 'xlsx');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send(buffer);
                }
                else {
                    const csvContent = ReportExportService_1.default.exportInventoryStatusToCSV(data);
                    const filename = ReportExportService_1.default.getExportFilename('inventory-status', 'csv');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send('\uFEFF' + csvContent);
                }
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '导出库存状态报表失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.exportTransactionHistory = async (req, res) => {
            try {
                const filter = TransactionHistoryQuerySchema.parse(req.query);
                const exportParams = ExportQuerySchema.parse(req.query);
                const exportFilter = { ...filter, limit: undefined, offset: undefined };
                const result = await this.reportService.getTransactionHistory(exportFilter);
                if (exportParams.format === 'xlsx') {
                    const buffer = ReportExportService_1.default.exportTransactionHistory(result.data);
                    const filename = ReportExportService_1.default.getExportFilename('transaction-history', 'xlsx');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send(buffer);
                }
                else {
                    const csvContent = ReportExportService_1.default.exportTransactionHistoryToCSV(result.data);
                    const filename = ReportExportService_1.default.getExportFilename('transaction-history', 'csv');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
                    res.send('\uFEFF' + csvContent);
                }
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '导出交易历史报表失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
        this.getAvailableReports = async (req, res) => {
            try {
                const data = this.reportService.getAvailableReports();
                const response = {
                    success: true,
                    message: '可用报表类型获取成功',
                    data
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '获取可用报表类型失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(500).json(response);
            }
        };
        this.exportReport = async (req, res) => {
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
                        const response = {
                            success: false,
                            message: '不支持的报表类型',
                            error: `报表类型 "${reportType}" 不存在`
                        };
                        res.status(400).json(response);
                }
            }
            catch (error) {
                const response = {
                    success: false,
                    message: '导出报表失败',
                    error: error instanceof Error ? error.message : '未知错误'
                };
                res.status(400).json(response);
            }
        };
    }
}
exports.ReportController = ReportController;
exports.default = ReportController;
//# sourceMappingURL=ReportController.js.map