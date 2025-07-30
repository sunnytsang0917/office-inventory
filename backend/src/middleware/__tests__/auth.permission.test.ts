import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  requireRole, 
  requireAdmin, 
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOrAdmin,
  conditionalPermission,
  isAdmin,
  isEmployee,
  getUserPermissions
} from '../auth';
import { UserModel } from '../../models/User';
import { ApiResponse } from '../../types';

// Mock UserModel
vi.mock('../../models/User');

describe('权限控制中间件测试', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response<ApiResponse>>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requireRole 中间件', () => {
    it('应该允许具有正确角色的用户通过', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      };

      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('应该拒绝没有正确角色的用户', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };

      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '需要管理员权限',
        error: 'INSUFFICIENT_ROLE'
      });
    });

    it('应该拒绝未认证的用户', () => {
      mockRequest.user = undefined;

      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
    });
  });

  describe('requireAdmin 中间件', () => {
    it('应该允许管理员用户通过', () => {
      mockRequest.user = {
        userId: 'admin-1',
        username: 'admin',
        role: 'admin',
      };

      requireAdmin(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('应该拒绝非管理员用户', () => {
      mockRequest.user = {
        userId: 'employee-1',
        username: 'employee',
        role: 'employee',
      };

      requireAdmin(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('requirePermission 中间件', () => {
    let mockUserModel: any;

    beforeEach(() => {
      mockUserModel = {
        hasPermission: vi.fn(),
      };
      vi.mocked(UserModel).mockImplementation(() => mockUserModel);
    });

    it('应该允许具有权限的用户通过', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      };
      mockUserModel.hasPermission.mockReturnValue(true);

      const middleware = requirePermission('items:read');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserModel.hasPermission).toHaveBeenCalledWith('items:read');
    });

    it('应该拒绝没有权限的用户', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockUserModel.hasPermission.mockReturnValue(false);

      const middleware = requirePermission('items:delete');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '缺少权限: items:delete',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('requireAllPermissions 中间件', () => {
    let mockUserModel: any;

    beforeEach(() => {
      mockUserModel = {
        hasPermission: vi.fn(),
      };
      vi.mocked(UserModel).mockImplementation(() => mockUserModel);
    });

    it('应该允许具有所有权限的用户通过', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      };
      mockUserModel.hasPermission.mockReturnValue(true);

      const middleware = requireAllPermissions(['items:read', 'items:create']);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserModel.hasPermission).toHaveBeenCalledWith('items:read');
      expect(mockUserModel.hasPermission).toHaveBeenCalledWith('items:create');
    });

    it('应该拒绝缺少部分权限的用户', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockUserModel.hasPermission
        .mockReturnValueOnce(true)  // items:read
        .mockReturnValueOnce(false); // items:delete

      const middleware = requireAllPermissions(['items:read', 'items:delete']);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '缺少权限: items:delete',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('requireAnyPermission 中间件', () => {
    let mockUserModel: any;

    beforeEach(() => {
      mockUserModel = {
        hasPermission: vi.fn(),
      };
      vi.mocked(UserModel).mockImplementation(() => mockUserModel);
    });

    it('应该允许具有任一权限的用户通过', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockUserModel.hasPermission
        .mockReturnValueOnce(false) // items:delete
        .mockReturnValueOnce(true);  // items:read

      const middleware = requireAnyPermission(['items:delete', 'items:read']);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该拒绝没有任何权限的用户', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockUserModel.hasPermission.mockReturnValue(false);

      const middleware = requireAnyPermission(['items:delete', 'users:create']);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '需要以下权限之一: items:delete, users:create',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('requireOwnershipOrAdmin 中间件', () => {
    const getUserIdFromRequest = (req: Request) => req.params.userId;

    it('应该允许管理员访问任何资源', () => {
      mockRequest.user = {
        userId: 'admin-1',
        username: 'admin',
        role: 'admin',
      };
      mockRequest.params = { userId: 'other-user' };

      const middleware = requireOwnershipOrAdmin(getUserIdFromRequest);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该允许用户访问自己的资源', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockRequest.params = { userId: 'user-1' };

      const middleware = requireOwnershipOrAdmin(getUserIdFromRequest);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该拒绝用户访问他人的资源', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'employee',
        role: 'employee',
      };
      mockRequest.params = { userId: 'user-2' };

      const middleware = requireOwnershipOrAdmin(getUserIdFromRequest);
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '只能访问自己的资源',
        error: 'RESOURCE_ACCESS_DENIED'
      });
    });
  });

  describe('conditionalPermission 中间件', () => {
    let mockUserModel: any;

    beforeEach(() => {
      mockUserModel = {
        hasPermission: vi.fn(),
      };
      vi.mocked(UserModel).mockImplementation(() => mockUserModel);
    });

    it('应该根据条件应用不同的权限检查', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      };
      mockRequest.method = 'POST';
      mockUserModel.hasPermission.mockReturnValue(true);

      const condition = (req: Request) => req.method === 'POST';
      const middleware = conditionalPermission(
        condition,
        ['items:create'], // POST 需要创建权限
        ['items:read']    // 其他方法需要读取权限
      );

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserModel.hasPermission).toHaveBeenCalledWith('items:create');
    });
  });

  describe('工具函数', () => {
    describe('isAdmin', () => {
      it('应该正确识别管理员用户', () => {
        mockRequest.user = {
          userId: 'admin-1',
          username: 'admin',
          role: 'admin',
        };

        expect(isAdmin(mockRequest as Request)).toBe(true);
      });

      it('应该正确识别非管理员用户', () => {
        mockRequest.user = {
          userId: 'employee-1',
          username: 'employee',
          role: 'employee',
        };

        expect(isAdmin(mockRequest as Request)).toBe(false);
      });

      it('应该处理未认证用户', () => {
        mockRequest.user = undefined;
        expect(isAdmin(mockRequest as Request)).toBe(false);
      });
    });

    describe('isEmployee', () => {
      it('应该正确识别员工用户', () => {
        mockRequest.user = {
          userId: 'employee-1',
          username: 'employee',
          role: 'employee',
        };

        expect(isEmployee(mockRequest as Request)).toBe(true);
      });

      it('应该正确识别非员工用户', () => {
        mockRequest.user = {
          userId: 'admin-1',
          username: 'admin',
          role: 'admin',
        };

        expect(isEmployee(mockRequest as Request)).toBe(false);
      });
    });

    describe('getUserPermissions', () => {
      let mockUserModel: any;

      beforeEach(() => {
        mockUserModel = {
          hasPermission: vi.fn(),
        };
        vi.mocked(UserModel).mockImplementation(() => mockUserModel);
      });

      it('应该返回用户的所有权限', () => {
        mockRequest.user = {
          userId: 'user-1',
          username: 'employee',
          role: 'employee',
        };

        // 模拟员工权限
        mockUserModel.hasPermission.mockImplementation((permission: string) => {
          const employeePermissions = [
            'items:read', 'items:create', 'items:update',
            'locations:read', 'transactions:read', 'transactions:create',
            'reports:read', 'inventory:read'
          ];
          return employeePermissions.includes(permission);
        });

        const permissions = getUserPermissions(mockRequest as Request);

        expect(permissions).toContain('items:read');
        expect(permissions).toContain('items:create');
        expect(permissions).not.toContain('items:delete');
        expect(permissions).not.toContain('users:create');
      });

      it('应该为未认证用户返回空数组', () => {
        mockRequest.user = undefined;
        const permissions = getUserPermissions(mockRequest as Request);
        expect(permissions).toEqual([]);
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理权限检查中的异常', () => {
      mockRequest.user = {
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      };

      // 模拟 UserModel 构造函数抛出异常
      vi.mocked(UserModel).mockImplementation(() => {
        throw new Error('Database error');
      });

      const middleware = requirePermission('items:read');
      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    });
  });
});