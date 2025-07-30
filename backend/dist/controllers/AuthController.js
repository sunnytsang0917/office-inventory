"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = require("../models/User");
const config_1 = require("../config");
class AuthController {
    static async initialize() {
        try {
            const adminExists = this.users.some(user => user.username === 'admin');
            if (!adminExists) {
                const adminUser = await User_1.UserModel.create({
                    username: 'admin',
                    email: 'admin@company.com',
                    password: 'admin123',
                    name: '系统管理员',
                    role: 'admin',
                    isActive: true
                });
                this.users.push(adminUser);
            }
            const employeeExists = this.users.some(user => user.username === 'employee');
            if (!employeeExists) {
                const employeeUser = await User_1.UserModel.create({
                    username: 'employee',
                    email: 'employee@company.com',
                    password: 'employee123',
                    name: '普通员工',
                    role: 'employee',
                    isActive: true
                });
                this.users.push(employeeUser);
            }
            console.log('Auth controller initialized with default users');
        }
        catch (error) {
            console.error('Failed to initialize auth controller:', error);
        }
    }
    static async login(req, res) {
        try {
            const loginData = req.body;
            const validatedData = User_1.UserModel.validateLogin(loginData);
            const authResult = await User_1.UserModel.authenticate(validatedData, this.users, config_1.config.jwt.secret);
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
                    user: authResult.user,
                    token: authResult.token,
                    expiresIn: config_1.config.jwt.expiresIn
                }
            });
        }
        catch (error) {
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
    static async logout(req, res) {
        try {
            res.json({
                success: true,
                message: '退出登录成功'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: '退出登录失败',
                error: 'LOGOUT_FAILED'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const user = this.users.find(u => u.id === req.user.userId);
            if (!user || !user.isActive) {
                res.status(401).json({
                    success: false,
                    message: '用户不存在或已被禁用',
                    error: 'USER_NOT_FOUND_OR_INACTIVE'
                });
                return;
            }
            const newToken = user.generateToken(config_1.config.jwt.secret, config_1.config.jwt.expiresIn);
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
    }
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const user = this.users.find(u => u.id === req.user.userId);
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
        }
        catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: '获取用户信息失败',
                error: 'GET_USER_FAILED'
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: '用户未认证',
                    error: 'NOT_AUTHENTICATED'
                });
                return;
            }
            const user = this.users.find(u => u.id === req.user.userId);
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
        }
        catch (error) {
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
    static async validateToken(req, res) {
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
            const decoded = User_1.UserModel.verifyToken(token, config_1.config.jwt.secret);
            if (!decoded) {
                res.json({
                    success: true,
                    data: { valid: false }
                });
                return;
            }
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
        }
        catch (error) {
            console.error('Token validation error:', error);
            res.json({
                success: true,
                data: { valid: false }
            });
        }
    }
    static async getAllUsers(req, res) {
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
        }
        catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: '获取用户列表失败',
                error: 'GET_USERS_FAILED'
            });
        }
    }
    static async addUser(userData) {
        const user = await User_1.UserModel.create(userData);
        this.users.push(user);
        return user;
    }
    static getUserByUsername(username) {
        return this.users.find(user => user.username === username);
    }
    static clearUsers() {
        this.users = [];
    }
}
exports.AuthController = AuthController;
AuthController.users = [];
//# sourceMappingURL=AuthController.js.map