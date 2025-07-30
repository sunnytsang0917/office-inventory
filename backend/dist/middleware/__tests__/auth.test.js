"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../auth");
const User_1 = require("../../models/User");
vitest_1.vi.mock('../../config', () => ({
    config: {
        jwt: {
            secret: 'test-secret',
            expiresIn: '1h'
        }
    }
}));
vitest_1.vi.mock('../../models/User');
(0, vitest_1.describe)('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    (0, vitest_1.beforeEach)(() => {
        mockRequest = {
            headers: {},
            user: undefined
        };
        mockResponse = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn().mockReturnThis()
        };
        mockNext = vitest_1.vi.fn();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('authenticateToken', () => {
        (0, vitest_1.it)('应该在缺少Authorization header时返回401', () => {
            (0, auth_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '访问令牌缺失',
                error: 'MISSING_TOKEN'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在Authorization header格式错误时返回401', () => {
            mockRequest.headers = { authorization: 'InvalidFormat' };
            (0, auth_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '访问令牌缺失',
                error: 'MISSING_TOKEN'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在令牌无效时返回401', () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockReturnValue(null);
            (0, auth_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '访问令牌无效或已过期',
                error: 'INVALID_TOKEN'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在令牌有效时设置用户信息并调用next', () => {
            const mockPayload = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockReturnValue(mockPayload);
            (0, auth_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockRequest.user).toEqual(mockPayload);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockResponse.status).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在验证过程中出现异常时返回401', () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockImplementation(() => {
                throw new Error('Verification failed');
            });
            (0, auth_1.authenticateToken)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '身份验证失败',
                error: 'AUTHENTICATION_FAILED'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('optionalAuth', () => {
        (0, vitest_1.it)('应该在没有令牌时继续执行', () => {
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRequest.user).toBeUndefined();
        });
        (0, vitest_1.it)('应该在有有效令牌时设置用户信息', () => {
            const mockPayload = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockReturnValue(mockPayload);
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockRequest.user).toEqual(mockPayload);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在令牌无效时继续执行但不设置用户信息', () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockReturnValue(null);
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockRequest.user).toBeUndefined();
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在验证过程中出现异常时继续执行', () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            vitest_1.vi.mocked(User_1.UserModel.verifyToken).mockImplementation(() => {
                throw new Error('Verification failed');
            });
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRequest.user).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('refreshToken', () => {
        (0, vitest_1.it)('应该在用户未认证时返回401', () => {
            (0, auth_1.refreshToken)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
        });
        (0, vitest_1.it)('应该为认证用户生成新令牌', () => {
            const mockUser = {
                generateToken: vitest_1.vi.fn().mockReturnValue('new-token')
            };
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            (0, auth_1.refreshToken)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockUser.generateToken).toHaveBeenCalledWith('test-secret', '1h');
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: '令牌刷新成功',
                data: {
                    token: 'new-token',
                    expiresIn: '1h'
                }
            });
        });
        (0, vitest_1.it)('应该在生成令牌失败时返回500', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => {
                throw new Error('Token generation failed');
            });
            (0, auth_1.refreshToken)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '令牌刷新失败',
                error: 'TOKEN_REFRESH_FAILED'
            });
        });
    });
    (0, vitest_1.describe)('getCurrentUser', () => {
        (0, vitest_1.it)('应该在用户未认证时返回401', () => {
            (0, auth_1.getCurrentUser)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
        });
        (0, vitest_1.it)('应该返回当前用户信息', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            (0, auth_1.getCurrentUser)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: '获取用户信息成功',
                data: {
                    userId: 'user-123',
                    username: 'testuser',
                    role: 'employee'
                }
            });
        });
        (0, vitest_1.it)('应该在获取用户信息失败时返回500', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            let callCount = 0;
            vitest_1.vi.mocked(mockResponse.json).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Response failed');
                }
                return mockResponse;
            });
            (0, auth_1.getCurrentUser)(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('extractTokenFromRequest', () => {
        (0, vitest_1.it)('应该从Authorization header中提取令牌', () => {
            mockRequest.headers = { authorization: 'Bearer test-token' };
            const token = (0, auth_1.extractTokenFromRequest)(mockRequest);
            (0, vitest_1.expect)(token).toBe('test-token');
        });
        (0, vitest_1.it)('应该在没有Authorization header时返回null', () => {
            const token = (0, auth_1.extractTokenFromRequest)(mockRequest);
            (0, vitest_1.expect)(token).toBeNull();
        });
        (0, vitest_1.it)('应该在Authorization header格式错误时返回null', () => {
            mockRequest.headers = { authorization: 'InvalidFormat' };
            const token = (0, auth_1.extractTokenFromRequest)(mockRequest);
            (0, vitest_1.expect)(token).toBeNull();
        });
    });
    (0, vitest_1.describe)('isTokenExpired', () => {
        (0, vitest_1.it)('应该在令牌过期时返回true', () => {
            const expiredPayload = {
                exp: Math.floor(Date.now() / 1000) - 3600
            };
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockReturnValue(expiredPayload);
            const result = (0, auth_1.isTokenExpired)('expired-token');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('应该在令牌未过期时返回false', () => {
            const validPayload = {
                exp: Math.floor(Date.now() / 1000) + 3600
            };
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockReturnValue(validPayload);
            const result = (0, auth_1.isTokenExpired)('valid-token');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('应该在令牌无效时返回true', () => {
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockReturnValue(null);
            const result = (0, auth_1.isTokenExpired)('invalid-token');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('应该在解码失败时返回true', () => {
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockImplementation(() => {
                throw new Error('Decode failed');
            });
            const result = (0, auth_1.isTokenExpired)('invalid-token');
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('getTokenExpirationTime', () => {
        (0, vitest_1.it)('应该返回令牌的过期时间', () => {
            const expTime = Math.floor(Date.now() / 1000) + 3600;
            const payload = { exp: expTime };
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockReturnValue(payload);
            const result = (0, auth_1.getTokenExpirationTime)('valid-token');
            (0, vitest_1.expect)(result).toEqual(new Date(expTime * 1000));
        });
        (0, vitest_1.it)('应该在令牌无效时返回null', () => {
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockReturnValue(null);
            const result = (0, auth_1.getTokenExpirationTime)('invalid-token');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('应该在解码失败时返回null', () => {
            vitest_1.vi.spyOn(jsonwebtoken_1.default, 'decode').mockImplementation(() => {
                throw new Error('Decode failed');
            });
            const result = (0, auth_1.getTokenExpirationTime)('invalid-token');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('validateTokenFormat', () => {
        (0, vitest_1.it)('应该在缺少Authorization header时返回401', () => {
            (0, auth_1.validateTokenFormat)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authorization header缺失',
                error: 'MISSING_AUTH_HEADER'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在Authorization header格式错误时返回401', () => {
            mockRequest.headers = { authorization: 'InvalidFormat' };
            (0, auth_1.validateTokenFormat)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authorization header格式错误，应为 "Bearer <token>"',
                error: 'INVALID_AUTH_FORMAT'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在令牌为空时返回401', () => {
            mockRequest.headers = { authorization: 'Bearer ' };
            (0, auth_1.validateTokenFormat)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '访问令牌为空',
                error: 'EMPTY_TOKEN'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在令牌格式正确时调用next', () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            (0, auth_1.validateTokenFormat)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('requireRole', () => {
        (0, vitest_1.it)('应该在用户未认证时返回401', () => {
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在用户角色不匹配时返回403', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '需要管理员权限',
                error: 'INSUFFICIENT_ROLE'
            });
            (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该在用户角色匹配时调用next', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'admin',
                role: 'admin'
            };
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('requireAdmin', () => {
        (0, vitest_1.it)('应该要求管理员权限', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            (0, auth_1.requireAdmin)(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '需要管理员权限',
                error: 'INSUFFICIENT_ROLE'
            });
        });
    });
    (0, vitest_1.describe)('requirePermission', () => {
        (0, vitest_1.it)('应该在用户未认证时返回401', () => {
            const middleware = (0, auth_1.requirePermission)('items:read');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
        });
        (0, vitest_1.it)('应该在用户缺少权限时返回403', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn().mockReturnValue(false)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requirePermission)('users:delete');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '缺少权限: users:delete',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
        (0, vitest_1.it)('应该在用户有权限时调用next', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn().mockReturnValue(true)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requirePermission)('items:read');
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
            (0, vitest_1.expect)(mockUser.hasPermission).toHaveBeenCalledWith('items:read');
        });
    });
    (0, vitest_1.describe)('requireAllPermissions', () => {
        (0, vitest_1.it)('应该在用户缺少任何权限时返回403', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn()
                    .mockReturnValueOnce(true)
                    .mockReturnValueOnce(false)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requireAllPermissions)(['items:read', 'items:create']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '缺少权限: items:create',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
        (0, vitest_1.it)('应该在用户有所有权限时调用next', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'admin'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn().mockReturnValue(true)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requireAllPermissions)(['items:read', 'items:create']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('requireAnyPermission', () => {
        (0, vitest_1.it)('应该在用户没有任何权限时返回403', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn().mockReturnValue(false)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requireAnyPermission)(['users:create', 'users:delete']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '需要以下权限之一: users:create, users:delete',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        });
        (0, vitest_1.it)('应该在用户有任一权限时调用next', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn()
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const middleware = (0, auth_1.requireAnyPermission)(['users:create', 'users:delete']);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('requireOwnershipOrAdmin', () => {
        const getUserId = (req) => req.params.userId;
        (0, vitest_1.it)('应该允许管理员访问任何资源', () => {
            mockRequest.user = {
                userId: 'admin-123',
                username: 'admin',
                role: 'admin'
            };
            mockRequest.params = { userId: 'other-user-123' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserId);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该允许用户访问自己的资源', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            mockRequest.params = { userId: 'user-123' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserId);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('应该拒绝用户访问他人的资源', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            mockRequest.params = { userId: 'other-user-123' };
            const middleware = (0, auth_1.requireOwnershipOrAdmin)(getUserId);
            middleware(mockRequest, mockResponse, mockNext);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: '只能访问自己的资源',
                error: 'RESOURCE_ACCESS_DENIED'
            });
        });
    });
    (0, vitest_1.describe)('isAdmin', () => {
        (0, vitest_1.it)('应该在用户是管理员时返回true', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'admin',
                role: 'admin'
            };
            const result = (0, auth_1.isAdmin)(mockRequest);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('应该在用户不是管理员时返回false', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'employee',
                role: 'employee'
            };
            const result = (0, auth_1.isAdmin)(mockRequest);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('应该在用户未认证时返回false', () => {
            const result = (0, auth_1.isAdmin)(mockRequest);
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('isEmployee', () => {
        (0, vitest_1.it)('应该在用户是员工时返回true', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'employee',
                role: 'employee'
            };
            const result = (0, auth_1.isEmployee)(mockRequest);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('应该在用户不是员工时返回false', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'admin',
                role: 'admin'
            };
            const result = (0, auth_1.isEmployee)(mockRequest);
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('getUserPermissions', () => {
        (0, vitest_1.it)('应该返回用户的权限列表', () => {
            mockRequest.user = {
                userId: 'user-123',
                username: 'testuser',
                role: 'employee'
            };
            const mockUser = {
                hasPermission: vitest_1.vi.fn().mockImplementation((permission) => {
                    return ['items:read', 'items:create', 'locations:read'].includes(permission);
                })
            };
            vitest_1.vi.mocked(User_1.UserModel).mockImplementation(() => mockUser);
            const permissions = (0, auth_1.getUserPermissions)(mockRequest);
            (0, vitest_1.expect)(permissions).toEqual(['items:read', 'items:create', 'locations:read']);
        });
        (0, vitest_1.it)('应该在用户未认证时返回空数组', () => {
            const permissions = (0, auth_1.getUserPermissions)(mockRequest);
            (0, vitest_1.expect)(permissions).toEqual([]);
        });
    });
});
//# sourceMappingURL=auth.test.js.map