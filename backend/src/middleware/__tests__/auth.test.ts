import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  authenticateToken, 
  optionalAuth, 
  refreshToken, 
  getCurrentUser,
  extractTokenFromRequest,
  isTokenExpired,
  getTokenExpirationTime,
  validateTokenFormat,
  requireRole,
  requireAdmin,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOrAdmin,
  conditionalPermission,
  rateLimitByRole,
  isAdmin,
  isEmployee,
  getUserPermissions
} from '../auth';
import { UserModel, JwtPayload } from '../../models/User';
import { config } from '../../config';

// Mock dependencies
vi.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h'
    }
  }
}));

vi.mock('../../models/User');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('应该在缺少Authorization header时返回401', () => {
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '访问令牌缺失',
        error: 'MISSING_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在Authorization header格式错误时返回401', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '访问令牌缺失',
        error: 'MISSING_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在令牌无效时返回401', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      vi.mocked(UserModel.verifyToken).mockReturnValue(null);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '访问令牌无效或已过期',
        error: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在令牌有效时设置用户信息并调用next', () => {
      const mockPayload: JwtPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(UserModel.verifyToken).mockReturnValue(mockPayload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('应该在验证过程中出现异常时返回401', () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(UserModel.verifyToken).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '身份验证失败',
        error: 'AUTHENTICATION_FAILED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('应该在没有令牌时继续执行', () => {
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('应该在有有效令牌时设置用户信息', () => {
      const mockPayload: JwtPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(UserModel.verifyToken).mockReturnValue(mockPayload);

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('应该在令牌无效时继续执行但不设置用户信息', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      vi.mocked(UserModel.verifyToken).mockReturnValue(null);

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('应该在验证过程中出现异常时继续执行', () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(UserModel.verifyToken).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('应该在用户未认证时返回401', () => {
      refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
    });

    it('应该为认证用户生成新令牌', () => {
      const mockUser = {
        generateToken: vi.fn().mockReturnValue('new-token')
      };

      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      // Mock UserModel constructor
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockUser.generateToken).toHaveBeenCalledWith('test-secret', '1h');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: 'new-token',
          expiresIn: '1h'
        }
      });
    });

    it('应该在生成令牌失败时返回500', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      vi.mocked(UserModel).mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '令牌刷新失败',
        error: 'TOKEN_REFRESH_FAILED'
      });
    });
  });

  describe('getCurrentUser', () => {
    it('应该在用户未认证时返回401', () => {
      getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
    });

    it('应该返回当前用户信息', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '获取用户信息成功',
        data: {
          userId: 'user-123',
          username: 'testuser',
          role: 'employee'
        }
      });
    });

    it('应该在获取用户信息失败时返回500', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      // Mock console.error to avoid test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by making the response.json throw on first call
      let callCount = 0;
      vi.mocked(mockResponse.json).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Response failed');
        }
        return mockResponse as Response;
      });

      getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      consoleSpy.mockRestore();
    });
  });

  describe('extractTokenFromRequest', () => {
    it('应该从Authorization header中提取令牌', () => {
      mockRequest.headers = { authorization: 'Bearer test-token' };

      const token = extractTokenFromRequest(mockRequest as Request);

      expect(token).toBe('test-token');
    });

    it('应该在没有Authorization header时返回null', () => {
      const token = extractTokenFromRequest(mockRequest as Request);

      expect(token).toBeNull();
    });

    it('应该在Authorization header格式错误时返回null', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      const token = extractTokenFromRequest(mockRequest as Request);

      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('应该在令牌过期时返回true', () => {
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      vi.spyOn(jwt, 'decode').mockReturnValue(expiredPayload as any);

      const result = isTokenExpired('expired-token');

      expect(result).toBe(true);
    });

    it('应该在令牌未过期时返回false', () => {
      const validPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      vi.spyOn(jwt, 'decode').mockReturnValue(validPayload as any);

      const result = isTokenExpired('valid-token');

      expect(result).toBe(false);
    });

    it('应该在令牌无效时返回true', () => {
      vi.spyOn(jwt, 'decode').mockReturnValue(null);

      const result = isTokenExpired('invalid-token');

      expect(result).toBe(true);
    });

    it('应该在解码失败时返回true', () => {
      vi.spyOn(jwt, 'decode').mockImplementation(() => {
        throw new Error('Decode failed');
      });

      const result = isTokenExpired('invalid-token');

      expect(result).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('应该返回令牌的过期时间', () => {
      const expTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: expTime };

      vi.spyOn(jwt, 'decode').mockReturnValue(payload as any);

      const result = getTokenExpirationTime('valid-token');

      expect(result).toEqual(new Date(expTime * 1000));
    });

    it('应该在令牌无效时返回null', () => {
      vi.spyOn(jwt, 'decode').mockReturnValue(null);

      const result = getTokenExpirationTime('invalid-token');

      expect(result).toBeNull();
    });

    it('应该在解码失败时返回null', () => {
      vi.spyOn(jwt, 'decode').mockImplementation(() => {
        throw new Error('Decode failed');
      });

      const result = getTokenExpirationTime('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('validateTokenFormat', () => {
    it('应该在缺少Authorization header时返回401', () => {
      validateTokenFormat(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header缺失',
        error: 'MISSING_AUTH_HEADER'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在Authorization header格式错误时返回401', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      validateTokenFormat(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header格式错误，应为 "Bearer <token>"',
        error: 'INVALID_AUTH_FORMAT'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在令牌为空时返回401', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      validateTokenFormat(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '访问令牌为空',
        error: 'EMPTY_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在令牌格式正确时调用next', () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      validateTokenFormat(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('应该在用户未认证时返回401', () => {
      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在用户角色不匹配时返回403', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '需要管理员权限',
        error: 'INSUFFICIENT_ROLE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在用户角色匹配时调用next', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'admin',
        role: 'admin'
      };

      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('应该要求管理员权限', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '需要管理员权限',
        error: 'INSUFFICIENT_ROLE'
      });
    });
  });

  describe('requirePermission', () => {
    it('应该在用户未认证时返回401', () => {
      const middleware = requirePermission('items:read');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
    });

    it('应该在用户缺少权限时返回403', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn().mockReturnValue(false)
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requirePermission('users:delete');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少权限: users:delete',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('应该在用户有权限时调用next', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn().mockReturnValue(true)
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requirePermission('items:read');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUser.hasPermission).toHaveBeenCalledWith('items:read');
    });
  });

  describe('requireAllPermissions', () => {
    it('应该在用户缺少任何权限时返回403', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn()
          .mockReturnValueOnce(true)  // items:read
          .mockReturnValueOnce(false) // items:create
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requireAllPermissions(['items:read', 'items:create']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少权限: items:create',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('应该在用户有所有权限时调用next', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin'
      };

      const mockUser = {
        hasPermission: vi.fn().mockReturnValue(true)
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requireAllPermissions(['items:read', 'items:create']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('应该在用户没有任何权限时返回403', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn().mockReturnValue(false)
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requireAnyPermission(['users:create', 'users:delete']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '需要以下权限之一: users:create, users:delete',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('应该在用户有任一权限时调用next', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn()
          .mockReturnValueOnce(false) // users:create
          .mockReturnValueOnce(true)  // users:delete
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const middleware = requireAnyPermission(['users:create', 'users:delete']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    const getUserId = (req: Request) => req.params.userId;

    it('应该允许管理员访问任何资源', () => {
      mockRequest.user = {
        userId: 'admin-123',
        username: 'admin',
        role: 'admin'
      };
      mockRequest.params = { userId: 'other-user-123' };

      const middleware = requireOwnershipOrAdmin(getUserId);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该允许用户访问自己的资源', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };
      mockRequest.params = { userId: 'user-123' };

      const middleware = requireOwnershipOrAdmin(getUserId);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该拒绝用户访问他人的资源', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };
      mockRequest.params = { userId: 'other-user-123' };

      const middleware = requireOwnershipOrAdmin(getUserId);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '只能访问自己的资源',
        error: 'RESOURCE_ACCESS_DENIED'
      });
    });
  });

  describe('isAdmin', () => {
    it('应该在用户是管理员时返回true', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'admin',
        role: 'admin'
      };

      const result = isAdmin(mockRequest as Request);
      expect(result).toBe(true);
    });

    it('应该在用户不是管理员时返回false', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'employee',
        role: 'employee'
      };

      const result = isAdmin(mockRequest as Request);
      expect(result).toBe(false);
    });

    it('应该在用户未认证时返回false', () => {
      const result = isAdmin(mockRequest as Request);
      expect(result).toBe(false);
    });
  });

  describe('isEmployee', () => {
    it('应该在用户是员工时返回true', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'employee',
        role: 'employee'
      };

      const result = isEmployee(mockRequest as Request);
      expect(result).toBe(true);
    });

    it('应该在用户不是员工时返回false', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'admin',
        role: 'admin'
      };

      const result = isEmployee(mockRequest as Request);
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('应该返回用户的权限列表', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        role: 'employee'
      };

      const mockUser = {
        hasPermission: vi.fn().mockImplementation((permission: string) => {
          return ['items:read', 'items:create', 'locations:read'].includes(permission);
        })
      };
      vi.mocked(UserModel).mockImplementation(() => mockUser as any);

      const permissions = getUserPermissions(mockRequest as Request);
      
      expect(permissions).toEqual(['items:read', 'items:create', 'locations:read']);
    });

    it('应该在用户未认证时返回空数组', () => {
      const permissions = getUserPermissions(mockRequest as Request);
      expect(permissions).toEqual([]);
    });
  });
});