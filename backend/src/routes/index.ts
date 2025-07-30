import { Router } from 'express';
import locationRoutes from './locationRoutes';
import itemRoutes from './itemRoutes';
import transactionRoutes from './transactionRoutes';
import inventoryRoutes from './inventoryRoutes';
import reportRoutes from './reportRoutes';
import authRoutes from './authRoutes';

const router = Router();

// API版本前缀
const API_VERSION = '/api/v1';

// 注册路由
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/locations`, locationRoutes);
router.use(`${API_VERSION}/items`, itemRoutes);
router.use(`${API_VERSION}/transactions`, transactionRoutes);
router.use(`${API_VERSION}/inventory`, inventoryRoutes);
router.use(`${API_VERSION}/reports`, reportRoutes);

// API根路径信息
router.get('/api', (req, res) => {
  res.json({
    message: 'Office Inventory Management System API',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      locations: `${API_VERSION}/locations`,
      items: `${API_VERSION}/items`,
      transactions: `${API_VERSION}/transactions`,
      inventory: `${API_VERSION}/inventory`,
      reports: `${API_VERSION}/reports`,
    },
  });
});

export default router;
