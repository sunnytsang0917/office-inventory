import { Router } from 'express';
import ReportController from '../controllers/ReportController';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission 
} from '../middleware/auth';

const router = Router();
const reportController = new ReportController();

// 获取可用报表类型 - 需要认证和相应权限
router.get('/types', authenticateToken, requirePermission('reports:read'), reportController.getAvailableReports);

// 月度统计报表 - 需要认证和相应权限
router.get('/monthly-stats', authenticateToken, requirePermission('reports:read'), reportController.getMonthlyStats);
router.get('/monthly-stats/export', authenticateToken, requirePermission('reports:read'), reportController.exportMonthlyStats);

// 物品使用排行报表 - 需要认证和相应权限
router.get('/item-usage', authenticateToken, requirePermission('reports:read'), reportController.getItemUsageRanking);
router.get('/item-usage/export', authenticateToken, requirePermission('reports:read'), reportController.exportItemUsageRanking);

// 库存状态报表 - 需要认证和相应权限
router.get('/inventory-status', authenticateToken, requirePermission('reports:read'), reportController.getInventoryStatus);
router.get('/inventory-status/export', authenticateToken, requirePermission('reports:read'), reportController.exportInventoryStatus);

// 交易历史报表 - 需要认证和相应权限
router.get('/transaction-history', authenticateToken, requirePermission('reports:read'), reportController.getTransactionHistory);
router.get('/transaction-history/export', authenticateToken, requirePermission('reports:read'), reportController.exportTransactionHistory);

// 自定义时间范围统计 - 需要认证和相应权限
router.get('/custom-range', authenticateToken, requirePermission('reports:read'), reportController.getCustomRangeStats);

// 通用导出接口 - 需要认证和相应权限
router.get('/export/:reportType', authenticateToken, requirePermission('reports:read'), reportController.exportReport);

export default router;