"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = exports.isEmployee = exports.isAdmin = exports.rateLimitByRole = exports.conditionalPermission = exports.requireOwnershipOrAdmin = exports.requireAnyPermission = exports.requireAllPermissions = exports.requirePermission = exports.requireAdmin = exports.requireRole = exports.validateTokenFormat = exports.getTokenExpirationTime = exports.isTokenExpired = exports.extractTokenFromRequest = exports.getCurrentUser = exports.refreshToken = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const User_1 = require("../models/User");
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: '访问令牌缺失',
                error: 'MISSING_TOKEN'
            });
            return;
        }
        const decoded = User_1.UserModel.verifyToken(token, config_1.config.jwt.secret);
        if (!decoded) {
            res.status(401).json({
                success: false,
                message: '访问令牌无效或已过期',
                error: 'INVALID_TOKEN'
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: '身份验证失败',
            error: 'AUTHENTICATION_FAILED'
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = User_1.UserModel.verifyToken(token, config_1.config.jwt.secret);
            if (decoded) {
                req.user = decoded;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const refreshToken = (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
            return;
        }
        const tempUser = new User_1.UserModel({
            id: req.user.userId,
            username: req.user.username,
            role: req.user.role,
            email: '',
            password: '',
            name: '',
        });
        const newToken = tempUser.generateToken(config_1.config.jwt.secret, config_1.config.jwt.expiresIn);
        res.json({
            success: true,
            message: '令牌刷新成功',
            data: {
                token: newToken,
                expiresIn: config_1.config.jwt.expiresIn
            }
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: '令牌刷新失败',
            error: 'TOKEN_REFRESH_FAILED'
        });
    }
};
exports.refreshToken = refreshToken;
const getCurrentUser = (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
            return;
        }
        res.json({
            success: true,
            message: '获取用户信息成功',
            data: {
                userId: req.user.userId,
                username: req.user.username,
                role: req.user.role
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: 'GET_USER_FAILED'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
const extractTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.split(' ')[1] || null;
};
exports.extractTokenFromRequest = extractTokenFromRequest;
const isTokenExpired = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    }
    catch (error) {
        return true;
    }
};
exports.isTokenExpired = isTokenExpired;
const getTokenExpirationTime = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            return null;
        }
        return new Date(decoded.exp * 1000);
    }
    catch (error) {
        return null;
    }
};
exports.getTokenExpirationTime = getTokenExpirationTime;
const validateTokenFormat = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            success: false,
            message: 'Authorization header缺失',
            error: 'MISSING_AUTH_HEADER'
        });
        return;
    }
    if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Authorization header格式错误，应为 "Bearer <token>"',
            error: 'INVALID_AUTH_FORMAT'
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: '访问令牌为空',
            error: 'EMPTY_TOKEN'
        });
        return;
    }
    next();
};
exports.validateTokenFormat = validateTokenFormat;
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            if (req.user.role !== requiredRole) {
                res.status(403).json({
                    success: false,
                    message: `需要${requiredRole === 'admin' ? '管理员' : '员工'}权限`,
                    error: 'INSUFFICIENT_ROLE'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role authorization error:', error);
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const tempUser = new User_1.UserModel({
                id: req.user.userId,
                username: req.user.username,
                role: req.user.role,
                email: '',
                password: '',
                name: '',
            });
            if (!tempUser.hasPermission(permission)) {
                res.status(403).json({
                    success: false,
                    message: `缺少权限: ${permission}`,
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Permission authorization error:', error);
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        }
    };
};
exports.requirePermission = requirePermission;
const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const tempUser = new User_1.UserModel({
                id: req.user.userId,
                username: req.user.username,
                role: req.user.role,
                email: '',
                password: '',
                name: '',
            });
            const missingPermissions = permissions.filter(permission => !tempUser.hasPermission(permission));
            if (missingPermissions.length > 0) {
                res.status(403).json({
                    success: false,
                    message: `缺少权限: ${missingPermissions.join(', ')}`,
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Multiple permissions authorization error:', error);
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        }
    };
};
exports.requireAllPermissions = requireAllPermissions;
const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const tempUser = new User_1.UserModel({
                id: req.user.userId,
                username: req.user.username,
                role: req.user.role,
                email: '',
                password: '',
                name: '',
            });
            const hasAnyPermission = permissions.some(permission => tempUser.hasPermission(permission));
            if (!hasAnyPermission) {
                res.status(403).json({
                    success: false,
                    message: `需要以下权限之一: ${permissions.join(', ')}`,
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Any permission authorization error:', error);
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        }
    };
};
exports.requireAnyPermission = requireAnyPermission;
const requireOwnershipOrAdmin = (getUserIdFromRequest) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            if (req.user.role === 'admin') {
                next();
                return;
            }
            const resourceUserId = getUserIdFromRequest(req);
            if (req.user.userId !== resourceUserId) {
                res.status(403).json({
                    success: false,
                    message: '只能访问自己的资源',
                    error: 'RESOURCE_ACCESS_DENIED'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Ownership authorization error:', error);
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: 'AUTHORIZATION_FAILED'
            });
        }
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
const conditionalPermission = (condition, truePermissions, falsePermissions) => {
    return (req, res, next) => {
        const permissions = condition(req) ? truePermissions : falsePermissions;
        return (0, exports.requireAllPermissions)(permissions)(req, res, next);
    };
};
exports.conditionalPermission = conditionalPermission;
const rateLimitByRole = (adminLimit, employeeLimit) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '用户未认证',
                error: 'NOT_AUTHENTICATED'
            });
            return;
        }
        next();
    };
};
exports.rateLimitByRole = rateLimitByRole;
const isAdmin = (req) => {
    return req.user?.role === 'admin';
};
exports.isAdmin = isAdmin;
const isEmployee = (req) => {
    return req.user?.role === 'employee';
};
exports.isEmployee = isEmployee;
const getUserPermissions = (req) => {
    if (!req.user) {
        return [];
    }
    const tempUser = new User_1.UserModel({
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        email: '',
        password: '',
        name: '',
    });
    const allPermissions = [
        'items:read', 'items:create', 'items:update', 'items:delete',
        'locations:read', 'locations:create', 'locations:update', 'locations:delete',
        'transactions:read', 'transactions:create', 'transactions:update', 'transactions:delete',
        'reports:read', 'reports:create', 'reports:update', 'reports:delete',
        'users:read', 'users:create', 'users:update', 'users:delete',
        'inventory:read', 'inventory:update'
    ];
    return allPermissions.filter(permission => tempUser.hasPermission(permission));
};
exports.getUserPermissions = getUserPermissions;
//# sourceMappingURL=auth.js.map