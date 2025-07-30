import { Request, Response } from 'express';
import { UserModel, LoginDto, AuthResult } from '../models/User';
import { ApiResponse } from '../types';
import { config } from '../config';

/**
 * Authentication Controller
 * Handles user login, logout, and token management
 */
export class AuthController {
  // Mock user data - in real implementation, this would come from database
  private static users: UserModel[] = [];

  /**
   * Initialize with default admin user for testing
   */
  static async initialize(): Promise<void> {
    try {
      // Load existing users from database
      const { pool } = await import('../config/database');
      const result = await pool.query('SELECT id, username, password, role, name, created_at, updated_at FROM users');
      
      this.users = result.rows.map(row => UserModel.fromDatabase({
        id: row.id,
        username: row.username,
        email: row.email || 'admin@company.com',
        password: row.password,
        name: row.name,
        role: row.role,
        isActive: true, // Assuming all users from DB are active
        lastLoginAt: undefined, // Not available in the table
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      console.log(`Auth controller initialized with ${this.users.length} users from database`);
    } catch (error) {
      console.error('Failed to initialize auth controller:', error);
      // Fallback to empty array
      this.users = [];
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response<ApiResponse<{ user: any; token: string; expiresIn: string }>>): Promise<void> {
    try {
      const loginData: LoginDto = req.body;

      // Validate input
      const validatedData = UserModel.validateLogin(loginData);

      // Authenticate user
      const authResult: AuthResult = await UserModel.authenticate(
        validatedData,
        this.users,
        config.jwt.secret
      );

      if (!authResult.success) {
        res.status(401).json({
          success: false,
          message: authResult.message || '登录失败',
          error: 'LOGIN_FAILED'
        });
        return;
      }

      res.json({
        success: true,
        message: authResult.message || '登录成功',
        data: {
          user: authResult.user!,
          token: authResult.token!,
          expiresIn: config.jwt.expiresIn
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: '输入数据格式错误',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * User logout (client-side token invalidation)
   */
  static async logout(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we just return success as the client will remove the token
      
      res.json({
        success: true,
        message: '退出登录成功'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: '退出登录失败',
        error: 'LOGOUT_FAILED'
      });
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(req: Request, res: Response<ApiResponse<{ token: string; expiresIn: string }>>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // Find user to ensure they still exist and are active
      const user = this.users.find(u => u.id === req.user!.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用',
          error: 'USER_NOT_FOUND_OR_INACTIVE'
        });
        return;
      }

      // Generate new token
      const newToken = user.generateToken(config.jwt.secret, config.jwt.expiresIn);

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: newToken,
          expiresIn: config.jwt.expiresIn
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: '令牌刷新失败',
        error: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // Find user to get latest information
      const user = this.users.find(u => u.id === req.user!.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: '用户账户已被禁用',
          error: 'USER_INACTIVE'
        });
        return;
      }

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: 'GET_USER_FAILED'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const user = this.users.find(u => u.id === req.user!.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      const result = await user.changePassword(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message || '密码修改失败',
          error: 'PASSWORD_CHANGE_FAILED'
        });
        return;
      }

      res.json({
        success: true,
        message: result.message || '密码修改成功'
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: '输入数据格式错误',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '密码修改失败',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Validate token (for client-side token validation)
   */
  static async validateToken(req: Request, res: Response<ApiResponse<{ valid: boolean; user?: any }>>): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        res.json({
          success: true,
          data: { valid: false }
        });
        return;
      }

      const decoded = UserModel.verifyToken(token, config.jwt.secret);
      
      if (!decoded) {
        res.json({
          success: true,
          data: { valid: false }
        });
        return;
      }

      // Check if user still exists and is active
      const user = this.users.find(u => u.id === decoded.userId);
      if (!user || !user.isActive) {
        res.json({
          success: true,
          data: { valid: false }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.json({
        success: true,
        data: { valid: false }
      });
    }
  }

  /**
   * Get all users (admin only - for testing purposes)
   */
  static async getAllUsers(req: Request, res: Response<ApiResponse<any[]>>): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '权限不足',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      const users = this.users.map(user => user.toJSON());
      
      res.json({
        success: true,
        message: '获取用户列表成功',
        data: users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: 'GET_USERS_FAILED'
      });
    }
  }

  /**
   * Helper method to add user (for testing)
   */
  static async addUser(userData: any): Promise<UserModel> {
    const user = await UserModel.create(userData);
    this.users.push(user);
    return user;
  }

  /**
   * Helper method to get user by username (for testing)
   */
  static getUserByUsername(username: string): UserModel | undefined {
    return this.users.find(user => user.username === username);
  }

  /**
   * Helper method to clear all users (for testing)
   */
  static clearUsers(): void {
    this.users = [];
  }
}