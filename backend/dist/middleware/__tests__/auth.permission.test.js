"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_1 = require("../auth");
const User_1 = require("../../models/User");
vitest_1.vi.mock('../../models/User');
(0, vitest_1.describe)('权限控制中间件测试', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let jsonMock;
    let statusMock;
    (0, vitest_1.beforeEach)(() => {
        jsonMock = vitest_1.vi.fn();
        statusMock = vitest_1.vi.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {};
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        mockNext = vitest_1.vi.fn();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('requireRole 中间件', () => {
        (0, vitest_1.it)('应该允许具有正确角色的用户通过', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'admin',
                role: 'admin',
            };
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该拒绝没有正确角色的用户', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '需要管理员权限',
                error: 'INSUFFICIENT_ROLE'
            });
        });
        (0, vitest_1.it)('应该拒绝未认证的用户', () => {
            mockRequest.user = undefined;
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
        });
    });
    (0, vitest_1.describe)('requireAdmin 中间件', () => {
        (0, vitest_1.it)('应该允许管理员用户通过', () => {
            mockRequest.user = {
                userId: 'admin-1',
                username: 'admin',
                role: 'admin',
            };
            (0, auth_1.requireAdmin)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该拒绝非管理员用户', () => {
            mockRequest.user = {
                userId: 'employee-1',
                username: 'employee',
                role: 'employee',
            };
            (0, auth_1.requireAdmin)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
        });
    });
    (0, vitest_1.describe)('requirePermission 中间件', () => {
        let mockUserModel;
        (0, vitest_1.beforeEach)(() => {
            mockUserModel = {
                hasPermission: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUserModel);
        });
        (0, vitest_1.it)('应该允许具有权限的用户通过', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'admin',
                role: 'admin',
            };
            mockUserModel.hasPermission.mockReturnValue(true);
            const middleware = (0, auth_1.requirePermission)('items:read');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockUserModel.hasPermission).toHaveBeenCalledWith('items:read');
        });
        (0, vitest_1.it)('应该拒绝没有权限的用户', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockUserModel.hasPermission.mockReturnValue(false);
            const middleware = (0, auth_1.requirePermission)('items:delete');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '缺少权限: items:delete',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
    });
    (0, vitest_1.describe)('requireAllPermissions 中间件', () => {
        let mockUserModel;
        (0, vitest_1.beforeEach)(() => {
            mockUserModel = {
                hasPermission: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUserModel);
        });
        (0, vitest_1.it)('应该允许具有所有权限的用户通过', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'admin',
                role: 'admin',
            };
            mockUserModel.hasPermission.mockReturnValue(true);
            const middleware = (0, auth_1.requireAllPermissions)(['items:read', 'items:create']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockUserModel.hasPermission).toHaveBeenCalledWith('items:read');
            (0, vitest_1.expect)(mockUserModel.hasPermission).toHaveBeenCalledWith('items:create');
        });
        (0, vitest_1.it)('应该拒绝缺少部分权限的用户', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockUserModel.hasPermission
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            const middleware = (0, auth_1.requireAllPermissions)(['items:read', 'items:delete']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '缺少权限: items:delete',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
    });
    (0, vitest_1.describe)('requireAnyPermission 中间件', () => {
        let mockUserModel;
        (0, vitest_1.beforeEach)(() => {
            mockUserModel = {
                hasPermission: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUserModel);
        });
        (0, vitest_1.it)('应该允许具有任一权限的用户通过', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockUserModel.hasPermission
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);
            const middleware = (0, auth_1.requireAnyPermission)(['items:delete', 'items:read']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该拒绝没有任何权限的用户', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockUserModel.hasPermission.mockReturnValue(false);
            const middleware = (0, auth_1.requireAnyPermission)(['items:delete', 'users:create']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '需要以下权限之一: items:delete, users:create',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
    });
    (0, vitest_1.describe)('requireOwnershipOrAdmin 中间件', () => {
        const getUserIdFromRequest = (req) => req.params.userId;
        (0, vitest_1.it)('应该允许管理员访问任何资源', () => {
            mockRequest.user = {
                userId: 'admin-1',
                username: 'admin',
                role: 'admin',
            };
            mockRequest.params = { userId: 'other-user' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserIdFromRequest);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该允许用户访问自己的资源', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockRequest.params = { userId: 'user-1' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserIdFromRequest);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该拒绝用户访问他人的资源', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'employee',
                role: 'employee',
            };
            mockRequest.params = { userId: 'user-2' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserIdFromRequest);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '只能访问自己的资源',
                error: 'RESOURCE_ACCESS_DENIED'
            });
        });
    });
    (0, vitest_1.describe)('conditionalPermission 中间件', () => {
        let mockUserModel;
        (0, vitest_1.beforeEach)(() => {
            mockUserModel = {
                hasPermission: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUserModel);
        });
        (0, vitest_1.it)('应该根据条件应用不同的权限检查', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'admin',
                role: 'admin',
            };
            mockRequest.method = 'POST';
            mockUserModel.hasPermission.mockReturnValue(true);
            const condition = (req) => req.method === 'POST';
            const middleware = (0, auth_1.conditionalPermission)(condition, ['items:create'], ['items:read']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockUserModel.hasPermission).toHaveBeenCalledWith('items:create');
        });
    });
    (0, vitest_1.describe)('工具函数', () => {
        (0, vitest_1.describe)('isAdmin', () => {
            (0, vitest_1.it)('应该正确识别管理员用户', () => {
                mockRequest.user = {
                    userId: 'admin-1',
                    username: 'admin',
                    role: 'admin',
                };
                (0, vitest_1.expect)((0, auth_1.isAdmin)(mockRequest)).toBe(true);
            });
            (0, vitest_1.it)('应该正确识别非管理员用户', () => {
                mockRequest.user = {
                    userId: 'employee-1',
                    username: 'employee',
                    role: 'employee',
                };
                (0, vitest_1.expect)((0, auth_1.isAdmin)(mockRequest)).toBe(false);
            });
            (0, vitest_1.it)('应该处理未认证用户', () => {
                mockRequest.user = undefined;
                (0, vitest_1.expect)((0, auth_1.isAdmin)(mockRequest)).toBe(false);
            });
        });
        (0, vitest_1.describe)('isEmployee', () => {
            (0, vitest_1.it)('应该正确识别员工用户', () => {
                mockRequest.user = {
                    userId: 'employee-1',
                    username: 'employee',
                    role: 'employee',
                };
                (0, vitest_1.expect)((0, auth_1.isEmployee)(mockRequest)).toBe(true);
            });
            (0, vitest_1.it)('应该正确识别非员工用户', () => {
                mockRequest.user = {
                    userId: 'admin-1',
                    username: 'admin',
                    role: 'admin',
                };
                (0, vitest_1.expect)((0, auth_1.isEmployee)(mockRequest)).toBe(false);
            });
        });
        (0, vitest_1.describe)('getUserPermissions', () => {
            let mockUserModel;
            (0, vitest_1.beforeEach)(() => {
                mockUserModel = {
                    hasPermission: vitest_1.vi.fn(),
                };
                vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUserModel);
            });
            (0, vitest_1.it)('应该返回用户的所有权限', () => {
                mockRequest.user = {
                    userId: 'user-1',
                    username: 'employee',
                    role: 'employee',
                };
                mockUserModel.hasPermission.mockImplementation((permission) => {
                    const employeePermissions = [
                        'items:read', 'items:create', 'items:update',
                        'locations:read', 'transactions:read', 'transactions:create',
                        'reports:read', 'inventory:read'
                    ];
                    return employeePermissions.includes(permission);
                });
                const permissions = (0, auth_1.getUserPermissions)(mockRequest);
                (0, vitest_1.expect)(permissions).toContain('items:read');
                (0, vitest_1.expect)(permissions).toContain('items:create');
                (0, vitest_1.expect)(permissions).not.toContain('items:delete');
                (0, vitest_1.expect)(permissions).not.toContain('users:create');
            });
            (0, vitest_1.it)('应该为未认证用户返回空数组', () => {
                mockRequest.user = undefined;
                const permissions = (0, auth_1.getUserPermissions)(mockRequest);
                (0, vitest_1.expect)(permissions).toEqual([]);
            });
        });
    });
    (0, vitest_1.describe)('错误处理', () => {
        (0, vitest_1.it)('应该处理权限检查中的异常', () => {
            mockRequest.user = {
                userId: 'user-1',
                username: 'admin',
                role: 'admin',
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => {
                throw new Error('Database error');
            });
            const middleware = (0, auth_1.requirePermission)('items:read');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
            (0, vitest_1.expect)(statusMock).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        });
    });
});
//# sourceMappingURL=auth.permission.test.js.map