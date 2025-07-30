"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("../User");
(0, vitest_1.describe)('UserModel', () => {
    let validUserData;
    (0, vitest_1.beforeEach)(() => {
        validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            name: '测试用户',
            role: 'employee',
            isActive: true,
        };
    });
    (0, vitest_1.describe)('创建用户', () => {
        (0, vitest_1.it)('应该成功创建有效的用户', async () => {
            const user = await User_1.UserModel.create(validUserData);
            (0, vitest_1.expect)(user.username).toBe(validUserData.username);
            (0, vitest_1.expect)(user.email).toBe(validUserData.email);
            (0, vitest_1.expect)(user.name).toBe(validUserData.name);
            (0, vitest_1.expect)(user.role).toBe(validUserData.role);
            (0, vitest_1.expect)(user.isActive).toBe(validUserData.isActive);
            (0, vitest_1.expect)(user.id).toBeDefined();
            (0, vitest_1.expect)(user.createdAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(user.updatedAt).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('应该对密码进行哈希处理', async () => {
            const user = await User_1.UserModel.create(validUserData);
            const userWithPassword = user.toJSONWithPassword();
            (0, vitest_1.expect)(userWithPassword.password).not.toBe(validUserData.password);
            (0, vitest_1.expect)(userWithPassword.password.length).toBeGreaterThan(50);
        });
    });
    (0, vitest_1.describe)('密码验证', () => {
        (0, vitest_1.it)('应该验证正确的密码', async () => {
            const user = await User_1.UserModel.create(validUserData);
            const isValid = await user.verifyPassword(validUserData.password);
            (0, vitest_1.expect)(isValid).toBe(true);
        });
        (0, vitest_1.it)('应该拒绝错误的密码', async () => {
            const user = await User_1.UserModel.create(validUserData);
            const isValid = await user.verifyPassword('wrongpassword');
            (0, vitest_1.expect)(isValid).toBe(false);
        });
    });
    (0, vitest_1.describe)('JWT令牌', () => {
        (0, vitest_1.it)('应该生成和验证JWT令牌', async () => {
            const user = await User_1.UserModel.create(validUserData);
            const secretKey = 'test-secret-key';
            const token = user.generateToken(secretKey);
            (0, vitest_1.expect)(token).toBeDefined();
            const payload = User_1.UserModel.verifyToken(token, secretKey);
            (0, vitest_1.expect)(payload).toBeDefined();
            (0, vitest_1.expect)(payload.userId).toBe(user.id);
            (0, vitest_1.expect)(payload.username).toBe(user.username);
        });
    });
    (0, vitest_1.describe)('权限检查', () => {
        (0, vitest_1.it)('管理员应该拥有所有权限', async () => {
            const adminUser = await User_1.UserModel.create({
                ...validUserData,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
            });
            (0, vitest_1.expect)(adminUser.hasPermission('items:read')).toBe(true);
            (0, vitest_1.expect)(adminUser.canManageUsers()).toBe(true);
        });
        (0, vitest_1.it)('员工应该有限定权限', async () => {
            const employeeUser = await User_1.UserModel.create(validUserData);
            (0, vitest_1.expect)(employeeUser.hasPermission('items:read')).toBe(true);
            (0, vitest_1.expect)(employeeUser.canManageUsers()).toBe(false);
        });
    });
    (0, vitest_1.describe)('数据验证', () => {
        (0, vitest_1.it)('应该拒绝无效数据', () => {
            const invalidData = { ...validUserData, email: 'invalid-email' };
            (0, vitest_1.expect)(() => User_1.UserModel.validateCreate(invalidData)).toThrow();
        });
    });
    (0, vitest_1.describe)('用户角色常量', () => {
        (0, vitest_1.it)('应该定义正确的用户角色', () => {
            (0, vitest_1.expect)(User_1.USER_ROLES.ADMIN).toBe('admin');
            (0, vitest_1.expect)(User_1.USER_ROLES.EMPLOYEE).toBe('employee');
        });
    });
});
//# sourceMappingURL=User.test.js.map