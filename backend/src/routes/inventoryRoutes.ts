import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission 
} from '../middleware/auth';

const router = Router();
const inventoryController = new InventoryController();

// 库存查询和搜索的REST API端点 - 需要认证和相应权限
router.get('/', authenticateToken, requirePermission('inventory:read'), inventoryController.getInventoryStatus);
router.get('/search', authenticateToken, requirePermission('inventory:read'), inventoryController.searchInventory);
router.get('/overview', authenticateToken, requirePermission('inventory:read'), inventoryController.getInventoryOverview);
router.get('/statistics', authenticateToken, requirePermission('inventory:read'), inventoryController.getInventoryStatistics);

// 低库存预警API - 需要认证和相应权限
router.get('/low-stock', authenticateToken, requirePermission('inventory:read'), inventoryController.getLowStockItems);

// 库存详情和历史记录API - 需要认证和相应权限
router.get('/items/:itemId', authenticateToken, requirePermission('inventory:read'), inventoryController.getItemInventory);
router.get('/items/:itemId/history', authenticateToken, requireAnyPermission(['inventory:read', 'transactions:read']), inventoryController.getInventoryHistory);

// 位置相关库存API - 需要认证和相应权限
router.get('/locations/:locationId', authenticateToken, requireAnyPermission(['inventory:read', 'locations:read']), inventoryController.getLocationInventorySummary);

// 库存可用性检查API（用于出库前验证） - 需要认证和相应权限
router.post('/check-availability', authenticateToken, requireAnyPermission(['inventory:read', 'transactions:create']), inventoryController.checkStockAvailability);

export default router;