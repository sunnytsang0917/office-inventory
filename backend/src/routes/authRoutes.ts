import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, validateTokenFormat, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * 认证相关路由
 */

// 用户登录
router.post('/login', (req, res) => AuthController.login(req, res));

// 用户登出
router.post('/logout', (req, res) => AuthController.logout(req, res));

// 刷新令牌 - 需要有效的JWT令牌
router.post('/refresh', validateTokenFormat, authenticateToken, (req, res) => AuthController.refreshToken(req, res));

// 获取当前用户信息 - 需要认证
router.get('/me', authenticateToken, (req, res) => AuthController.getCurrentUser(req, res));

// 修改密码 - 需要认证
router.post('/change-password', authenticateToken, (req, res) => AuthController.changePassword(req, res));

// 验证令牌 - 不需要认证，用于客户端检查令牌有效性
router.post('/validate', (req, res) => AuthController.validateToken(req, res));

// 获取所有用户 - 仅管理员可访问
router.get('/users', authenticateToken, requireAdmin, (req, res) => AuthController.getAllUsers(req, res));

export default router;