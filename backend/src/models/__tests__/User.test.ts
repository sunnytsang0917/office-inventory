import { describe, it, expect, beforeEach } from 'vitest';
import { UserModel, CreateUserDto, UpdateUserDto, USER_ROLES } from '../User';

describe('UserModel', () => {
  let validUserData: CreateUserDto;

  beforeEach(() => {
    validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: '测试用户',
      role: 'employee',
      isActive: true,
    };
  });

  describe('创建用户', () => {
    it('应该成功创建有效的用户', async () => {
      const user = await UserModel.create(validUserData);
      
      expect(user.username).toBe(validUserData.username);
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
      expect(user.role).toBe(validUserData.role);
      expect(user.isActive).toBe(validUserData.isActive);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('应该对密码进行哈希处理', async () => {
      const user = await UserModel.create(validUserData);
      const userWithPassword = user.toJSONWithPassword();
      
      expect(userWithPassword.password).not.toBe(validUserData.password);
      expect(userWithPassword.password.length).toBeGreaterThan(50);
    });
  });

  describe('密码验证', () => {
    it('应该验证正确的密码', async () => {
      const user = await UserModel.create(validUserData);
      const isValid = await user.verifyPassword(validUserData.password);
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const user = await UserModel.create(validUserData);
      const isValid = await user.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('JWT令牌', () => {
    it('应该生成和验证JWT令牌', async () => {
      const user = await UserModel.create(validUserData);
      const secretKey = 'test-secret-key';
      
      const token = user.generateToken(secretKey);
      expect(token).toBeDefined();
      
      const payload = UserModel.verifyToken(token, secretKey);
      expect(payload).toBeDefined();
      expect(payload!.userId).toBe(user.id);
      expect(payload!.username).toBe(user.username);
    });
  });

  describe('权限检查', () => {
    it('管理员应该拥有所有权限', async () => {
      const adminUser = await UserModel.create({
        ...validUserData,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      });

      expect(adminUser.hasPermission('items:read')).toBe(true);
      expect(adminUser.canManageUsers()).toBe(true);
    });

    it('员工应该有限定权限', async () => {
      const employeeUser = await UserModel.create(validUserData);

      expect(employeeUser.hasPermission('items:read')).toBe(true);
      expect(employeeUser.canManageUsers()).toBe(false);
    });
  });

  describe('数据验证', () => {
    it('应该拒绝无效数据', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      expect(() => UserModel.validateCreate(invalidData)).toThrow();
    });
  });

  describe('用户角色常量', () => {
    it('应该定义正确的用户角色', () => {
      expect(USER_ROLES.ADMIN).toBe('admin');
      expect(USER_ROLES.EMPLOYEE).toBe('employee');
    });
  });
});