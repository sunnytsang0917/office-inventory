"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROLE_NAMES = exports.USER_ROLES = exports.UserValidationError = exports.UserModel = exports.LoginSchema = exports.ChangePasswordSchema = exports.UpdateUserSchema = exports.CreateUserSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    username: zod_1.z.string().min(3, '用户名至少3个字符').max(50, '用户名不能超过50个字符')
        .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    email: zod_1.z.string().email('邮箱格式不正确').max(100, '邮箱不能超过100个字符'),
    password: zod_1.z.string().min(6, '密码至少6个字符').max(100, '密码不能超过100个字符'),
    name: zod_1.z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
    role: zod_1.z.enum(['admin', 'employee'], {
        message: '用户角色必须是admin或employee'
    }),
    isActive: zod_1.z.boolean().default(true),
    lastLoginAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().optional(),
});
exports.CreateUserSchema = exports.UserSchema.omit({
    id: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
});
exports.UpdateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('邮箱格式不正确').max(100, '邮箱不能超过100个字符').optional(),
    name: zod_1.z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符').optional(),
    role: zod_1.z.enum(['admin', 'employee'], {
        message: '用户角色必须是admin或employee'
    }).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, '当前密码不能为空'),
    newPassword: zod_1.z.string().min(6, '新密码至少6个字符').max(100, '新密码不能超过100个字符'),
    confirmPassword: zod_1.z.string().min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: '新密码和确认密码不匹配',
    path: ['confirmPassword'],
});
exports.LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, '用户名不能为空'),
    password: zod_1.z.string().min(1, '密码不能为空'),
});
class UserModel {
    constructor(data) {
        this.data = exports.UserSchema.parse({
            ...data,
            id: data.id || this.generateId(),
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
        });
    }
    get id() {
        return this.data.id;
    }
    get username() {
        return this.data.username;
    }
    get email() {
        return this.data.email;
    }
    get name() {
        return this.data.name;
    }
    get role() {
        return this.data.role;
    }
    get isActive() {
        return this.data.isActive;
    }
    get lastLoginAt() {
        return this.data.lastLoginAt;
    }
    get createdAt() {
        return this.data.createdAt;
    }
    get updatedAt() {
        return this.data.updatedAt;
    }
    toJSON() {
        const { password, ...userWithoutPassword } = this.data;
        return userWithoutPassword;
    }
    toJSONWithPassword() {
        return { ...this.data };
    }
    static validateCreate(data) {
        return exports.CreateUserSchema.parse(data);
    }
    static validateUpdate(data) {
        return exports.UpdateUserSchema.parse(data);
    }
    static validateChangePassword(data) {
        return exports.ChangePasswordSchema.parse(data);
    }
    static validateLogin(data) {
        return exports.LoginSchema.parse(data);
    }
    static validateId(id) {
        return zod_1.z.string().uuid('用户ID格式不正确').parse(id);
    }
    update(updateData) {
        const validatedData = exports.UpdateUserSchema.parse(updateData);
        Object.keys(validatedData).forEach(key => {
            if (validatedData[key] !== undefined) {
                this.data[key] = validatedData[key];
            }
        });
        this.data.updatedAt = new Date();
    }
    async hashPassword(password) {
        const saltRounds = 12;
        this.data.password = await bcryptjs_1.default.hash(password, saltRounds);
        this.data.updatedAt = new Date();
    }
    async verifyPassword(password) {
        return bcryptjs_1.default.compare(password, this.data.password);
    }
    async changePassword(changePasswordData) {
        const validatedData = exports.ChangePasswordSchema.parse(changePasswordData);
        const isCurrentPasswordValid = await this.verifyPassword(validatedData.currentPassword);
        if (!isCurrentPasswordValid) {
            return { success: false, message: '当前密码不正确' };
        }
        const isSamePassword = await this.verifyPassword(validatedData.newPassword);
        if (isSamePassword) {
            return { success: false, message: '新密码不能与当前密码相同' };
        }
        await this.hashPassword(validatedData.newPassword);
        return { success: true, message: '密码修改成功' };
    }
    generateToken(secretKey, expiresIn = '24h') {
        const payload = {
            userId: this.data.id,
            username: this.data.username,
            role: this.data.role,
        };
        return jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn });
    }
    static verifyToken(token, secretKey) {
        try {
            return jsonwebtoken_1.default.verify(token, secretKey);
        }
        catch (error) {
            return null;
        }
    }
    static async authenticate(loginData, users, secretKey) {
        const validatedData = exports.LoginSchema.parse(loginData);
        const user = users.find(u => u.username === validatedData.username);
        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }
        if (!user.isActive) {
            return { success: false, message: '用户账户已被禁用' };
        }
        const isPasswordValid = await user.verifyPassword(validatedData.password);
        if (!isPasswordValid) {
            return { success: false, message: '用户名或密码错误' };
        }
        user.data.lastLoginAt = new Date();
        user.data.updatedAt = new Date();
        const token = user.generateToken(secretKey);
        return {
            success: true,
            user: user.toJSON(),
            token,
            message: '登录成功',
        };
    }
    canBeDeleted() {
        if (this.data.role === 'admin') {
            return { canDelete: false, reason: '管理员账户不能删除' };
        }
        if (!this.data.isActive) {
            return { canDelete: false, reason: '已禁用的账户不能删除，请先激活' };
        }
        return { canDelete: true };
    }
    hasPermission(permission) {
        const { hasPermission } = require('../config/permissions');
        return hasPermission(this.data.role, permission);
    }
    canManageUsers() {
        return this.data.role === 'admin';
    }
    canDeleteTransactions() {
        return this.data.role === 'admin';
    }
    canManageLocations() {
        return this.data.role === 'admin';
    }
    generateId() {
        return crypto.randomUUID();
    }
    static async create(data) {
        const user = new UserModel(data);
        await user.hashPassword(data.password);
        return user;
    }
    static fromDatabase(data) {
        return new UserModel(data);
    }
    static validateUsernameUniqueness(username, existingUsernames) {
        return !existingUsernames.includes(username);
    }
    static validateEmailUniqueness(email, existingEmails) {
        return !existingEmails.includes(email);
    }
    static generateRandomPassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }
    static validatePasswordStrength(password) {
        const suggestions = [];
        let isStrong = true;
        if (password.length < 8) {
            isStrong = false;
            suggestions.push('密码长度至少8个字符');
        }
        if (!/[a-z]/.test(password)) {
            isStrong = false;
            suggestions.push('密码应包含小写字母');
        }
        if (!/[A-Z]/.test(password)) {
            isStrong = false;
            suggestions.push('密码应包含大写字母');
        }
        if (!/[0-9]/.test(password)) {
            isStrong = false;
            suggestions.push('密码应包含数字');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            suggestions.push('建议包含特殊字符以增强安全性');
        }
        return { isStrong, suggestions };
    }
    static generateSessionId() {
        return crypto.randomUUID();
    }
    static shouldLockAccount(failedAttempts, maxAttempts = 5) {
        return failedAttempts >= maxAttempts;
    }
    static calculateLockoutDuration(failedAttempts) {
        const durations = [5, 15, 30, 60, 120];
        const index = Math.min(failedAttempts - 5, durations.length - 1);
        return durations[index] * 60 * 1000;
    }
}
exports.UserModel = UserModel;
class UserValidationError extends Error {
    constructor(errors) {
        super('User validation failed');
        this.name = 'UserValidationError';
        this.errors = errors;
    }
    getFormattedErrors() {
        const formatted = {};
        this.errors.issues.forEach((error) => {
            const path = error.path.join('.');
            formatted[path] = error.message;
        });
        return formatted;
    }
}
exports.UserValidationError = UserValidationError;
exports.USER_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
};
exports.USER_ROLE_NAMES = {
    [exports.USER_ROLES.ADMIN]: '管理员',
    [exports.USER_ROLES.EMPLOYEE]: '员工',
};
//# sourceMappingURL=User.js.map