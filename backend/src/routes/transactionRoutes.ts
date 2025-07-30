import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import { 
  authenticateToken, 
  requirePermission, 
  requireAdmin,
  requireAnyPermission 
} from '../middleware/auth';

const router = Router();
const transactionController = new TransactionController();

// 基础交易记录CRUD路由 - 需要认证和相应权限
router.post('/', authenticateToken, requirePermission('transactions:create'), transactionController.createTransaction);                    // 创建交易记录
router.get('/', authenticateToken, requirePermission('transactions:read'), transactionController.getTransactionHistory);                // 获取交易历史记录
router.get('/statistics', authenticateToken, requirePermission('transactions:read'), transactionController.getTransactionStatistics);  // 获取交易统计信息
router.get('/:id', authenticateToken, requirePermission('transactions:read'), transactionController.getTransaction);                    // 获取交易记录详情
router.put('/:id', authenticateToken, requireAdmin, transactionController.updateTransaction);                 // 更新交易记录 - 仅管理员
router.delete('/:id', authenticateToken, requireAdmin, transactionController.deleteTransaction);              // 删除交易记录 - 仅管理员

// 入库相关路由 - 需要认证和相应权限
router.post('/inbound', authenticateToken, requirePermission('transactions:create'), transactionController.createInboundTransaction);     // 创建入库记录
router.post('/inbound/batch', authenticateToken, requirePermission('transactions:create'), transactionController.createBatchTransactions); // 批量创建入库记录
router.post('/inbound/batch-upload', authenticateToken, requireAdmin, uploadSingle, handleUploadError, transactionController.batchInbound); // Excel批量入库 - 仅管理员
router.get('/inbound/template/download', authenticateToken, requireAnyPermission(['transactions:create', 'transactions:read']), transactionController.downloadInboundTemplate); // 下载入库模板

// 出库相关路由 - 需要认证和相应权限
router.post('/outbound', authenticateToken, requirePermission('transactions:create'), transactionController.createOutboundTransaction);   // 创建出库记录
router.post('/outbound/batch', authenticateToken, requirePermission('transactions:create'), transactionController.createBatchTransactions); // 批量创建出库记录
router.post('/outbound/batch-upload', authenticateToken, requireAdmin, uploadSingle, handleUploadError, transactionController.batchOutbound); // Excel批量出库 - 仅管理员
router.get('/outbound/template/download', authenticateToken, requireAnyPermission(['transactions:create', 'transactions:read']), transactionController.downloadOutboundTemplate); // 下载出库模板

// 批量操作路由 - 需要认证和相应权限
router.post('/batch', authenticateToken, requirePermission('transactions:create'), transactionController.createBatchTransactions);        // 通用批量创建交易记录

export default router;