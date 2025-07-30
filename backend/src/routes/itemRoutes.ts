import { Router } from 'express';
import { ItemController } from '../controllers/ItemController';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import { 
  authenticateToken, 
  requirePermission, 
  requireAdmin,
  requireAnyPermission 
} from '../middleware/auth';

const router = Router();
const itemController = new ItemController();

// 物品CRUD路由 - 需要认证和相应权限
router.post('/', authenticateToken, requirePermission('items:create'), itemController.createItem);
router.get('/', authenticateToken, requirePermission('items:read'), itemController.listItems);
router.get('/categories', authenticateToken, requirePermission('items:read'), itemController.getCategories);
router.get('/:id', authenticateToken, requirePermission('items:read'), itemController.getItem);
router.put('/:id', authenticateToken, requirePermission('items:update'), itemController.updateItem);
router.delete('/:id', authenticateToken, requireAdmin, itemController.deleteItem); // 只有管理员可以删除

// 批量导入相关路由 - 需要管理员权限
router.post('/batch-import', authenticateToken, requireAdmin, uploadSingle, handleUploadError, itemController.batchImportItems);
router.get('/template/download', authenticateToken, requireAnyPermission(['items:create', 'items:update']), itemController.downloadTemplate);

export default router;