import { Router } from 'express';
import LocationController from '../controllers/LocationController';
import { 
  authenticateToken, 
  requirePermission, 
  requireAdmin,
  requireAnyPermission 
} from '../middleware/auth';

const router = Router();
const locationController = new LocationController();

// 位置CRUD路由 - 需要认证和相应权限
router.post('/', authenticateToken, requireAdmin, locationController.create);                    // 创建位置 - 仅管理员
router.get('/', authenticateToken, requirePermission('locations:read'), locationController.list);                       // 获取位置列表
router.get('/hierarchy', authenticateToken, requirePermission('locations:read'), locationController.getHierarchy);      // 获取层级结构
router.get('/root', authenticateToken, requirePermission('locations:read'), locationController.getRootLocations);       // 获取根级位置
router.get('/code/:code', authenticateToken, requirePermission('locations:read'), locationController.getByCode);        // 根据编码获取位置
router.get('/:id', authenticateToken, requirePermission('locations:read'), locationController.getById);                 // 根据ID获取位置
router.put('/:id', authenticateToken, requireAdmin, locationController.update);                  // 更新位置 - 仅管理员
router.delete('/:id', authenticateToken, requireAdmin, locationController.delete);               // 删除位置 - 仅管理员

// 位置层级结构路由
router.get('/:id/children', authenticateToken, requirePermission('locations:read'), locationController.getChildren);    // 获取子级位置
router.get('/:id/path', authenticateToken, requirePermission('locations:read'), locationController.getPath);            // 获取位置路径

// 位置库存相关路由
router.get('/:id/inventory', authenticateToken, requireAnyPermission(['locations:read', 'inventory:read']), locationController.getInventory);  // 获取位置库存信息

// 默认位置设置路由
router.post('/set-default', authenticateToken, requireAdmin, locationController.setItemDefaultLocation); // 设置物品默认位置 - 仅管理员

// 批量操作路由
router.patch('/batch/status', authenticateToken, requireAdmin, locationController.batchUpdateStatus); // 批量更新位置状态 - 仅管理员

export default router;