import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../types';

// User validation schema
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名不能超过50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string().email('邮箱格式不正确').max(100, '邮箱不能超过100个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码不能超过100个字符'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  role: z.enum(['admin', 'employee'], { 
    message: '用户角色必须是admin或employee'
  }),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create User DTO schema (for creating new users)
export const CreateUserSchema = UserSchema.omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

// Update User DTO schema (for updating existing users) - without password
export const UpdateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').max(100, '邮箱不能超过100个字符').optional(),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符').optional(),
  role: z.enum(['admin', 'employee'], { 
    message: '用户角色必须是admin或employee'
  }).optional(),
  isActive: z.boolean().optional(),
});

// Change Password DTO schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6个字符').max(100, '新密码不能超过100个字符'),
  confirmPassword: z.string().min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '新密码和确认密码不匹配',
  path: ['confirmPassword'],
});

// Login DTO schema
export const LoginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

// JWT Payload interface
export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// TypeScript interfaces derived from schemas
export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;

// User filter interface for search and listing
export interface UserFilter {
  username?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'username' | 'email' | 'name' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

// Authentication result interface
export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  message?: string;
}

// User class with validation and authentication methods
export class UserModel {
  private data: User;

  constructor(data: Partial<User>) {
    this.data = UserSchema.parse({
      ...data,
      id: data.id || this.generateId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    });
  }

  // Getters
  get id(): string {
    return this.data.id!;
  }

  get username(): string {
    return this.data.username;
  }

  get email(): string {
    return this.data.email;
  }

  get name(): string {
    return this.data.name;
  }

  get role(): UserRole {
    return this.data.role;
  }

  get isActive(): boolean {
    return this.data.isActive;
  }

  get lastLoginAt(): Date | undefined {
    return this.data.lastLoginAt;
  }

  get createdAt(): Date {
    return this.data.createdAt!;
  }

  get updatedAt(): Date {
    return this.data.updatedAt!;
  }

  // Get all data without password
  toJSON(): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = this.data;
    return userWithoutPassword;
  }

  // Get all data including password (for database operations)
  toJSONWithPassword(): User {
    return { ...this.data };
  }

  // Validation methods
  static validateCreate(data: unknown): CreateUserDto {
    return CreateUserSchema.parse(data);
  }

  static validateUpdate(data: unknown): UpdateUserDto {
    return UpdateUserSchema.parse(data);
  }

  static validateChangePassword(data: unknown): ChangePasswordDto {
    return ChangePasswordSchema.parse(data);
  }

  static validateLogin(data: unknown): LoginDto {
    return LoginSchema.parse(data);
  }

  static validateId(id: unknown): string {
    return z.string().uuid('用户ID格式不正确').parse(id);
  }

  // Update user data
  update(updateData: UpdateUserDto): void {
    const validatedData = UpdateUserSchema.parse(updateData);
    // Only update fields that are actually provided
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof UpdateUserDto] !== undefined) {
        (this.data as any)[key] = validatedData[key as keyof UpdateUserDto];
      }
    });
    this.data.updatedAt = new Date();
  }

  // Password management
  async hashPassword(password: string): Promise<void> {
    const saltRounds = 12;
    this.data.password = await bcrypt.hash(password, saltRounds);
    this.data.updatedAt = new Date();
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.data.password);
  }

  async changePassword(changePasswordData: ChangePasswordDto): Promise<{ success: boolean; message?: string }> {
    const validatedData = ChangePasswordSchema.parse(changePasswordData);
    
    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(validatedData.currentPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, message: '当前密码不正确' };
    }

    // Check if new password is different from current
    const isSamePassword = await this.verifyPassword(validatedData.newPassword);
    if (isSamePassword) {
      return { success: false, message: '新密码不能与当前密码相同' };
    }

    // Hash and set new password
    await this.hashPassword(validatedData.newPassword);
    
    return { success: true, message: '密码修改成功' };
  }

  // JWT token management
  generateToken(secretKey: string, expiresIn: string | number = '24h'): string {
    const payload = {
      userId: this.data.id!,
      username: this.data.username,
      role: this.data.role,
    };

    return jwt.sign(payload, secretKey, { expiresIn } as any);
  }

  static verifyToken(token: string, secretKey: string): JwtPayload | null {
    try {
      return jwt.verify(token, secretKey) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  // Authentication methods
  static async authenticate(loginData: LoginDto, users: UserModel[], secretKey: string): Promise<AuthResult> {
    const validatedData = LoginSchema.parse(loginData);
    
    // Find user by username
    const user = users.find(u => u.username === validatedData.username);
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    // Check if user is active
    if (!user.isActive) {
      return { success: false, message: '用户账户已被禁用' };
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(validatedData.password);
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    // Update last login time
    user.data.lastLoginAt = new Date();
    user.data.updatedAt = new Date();

    // Generate token
    const token = user.generateToken(secretKey);

    return {
      success: true,
      user: user.toJSON(),
      token,
      message: '登录成功',
    };
  }

  // Business logic validation
  canBeDeleted(): { canDelete: boolean; reason?: string } {
    if (this.data.role === 'admin') {
      return { canDelete: false, reason: '管理员账户不能删除' };
    }

    if (!this.data.isActive) {
      return { canDelete: false, reason: '已禁用的账户不能删除，请先激活' };
    }

    return { canDelete: true };
  }

  // Permission checks
  hasPermission(permission: string): boolean {
    // Import permissions config dynamically to avoid circular dependency
    const { hasPermission } = require('../config/permissions');
    return hasPermission(this.data.role, permission);
  }

  canManageUsers(): boolean {
    return this.data.role === 'admin';
  }

  canDeleteTransactions(): boolean {
    return this.data.role === 'admin';
  }

  canManageLocations(): boolean {
    return this.data.role === 'admin';
  }

  // Helper methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Static factory methods
  static async create(data: CreateUserDto): Promise<UserModel> {
    const user = new UserModel(data);
    await user.hashPassword(data.password);
    return user;
  }

  static fromDatabase(data: User): UserModel {
    return new UserModel(data);
  }

  // Utility methods
  static validateUsernameUniqueness(username: string, existingUsernames: string[]): boolean {
    return !existingUsernames.includes(username);
  }

  static validateEmailUniqueness(email: string, existingEmails: string[]): boolean {
    return !existingEmails.includes(email);
  }

  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Password strength validation
  static validatePasswordStrength(password: string): { isStrong: boolean; suggestions: string[] } {
    const suggestions: string[] = [];
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

  // Session management
  static generateSessionId(): string {
    return crypto.randomUUID();
  }

  // Account lockout (for security)
  static shouldLockAccount(failedAttempts: number, maxAttempts: number = 5): boolean {
    return failedAttempts >= maxAttempts;
  }

  static calculateLockoutDuration(failedAttempts: number): number {
    // Progressive lockout: 5 min, 15 min, 30 min, 1 hour, 2 hours
    const durations = [5, 15, 30, 60, 120];
    const index = Math.min(failedAttempts - 5, durations.length - 1);
    return durations[index] * 60 * 1000; // Convert to milliseconds
  }
}

// Validation error class
export class UserValidationError extends Error {
  public readonly errors: z.ZodError;

  constructor(errors: z.ZodError) {
    super('User validation failed');
    this.name = 'UserValidationError';
    this.errors = errors;
  }

  getFormattedErrors(): Record<string, string> {
    const formatted: Record<string, string> = {};
    this.errors.issues.forEach((error: any) => {
      const path = error.path.join('.');
      formatted[path] = error.message;
    });
    return formatted;
  }
}

// User role constants
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  EMPLOYEE: 'employee' as const,
};

export const USER_ROLE_NAMES = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.EMPLOYEE]: '员工',
} as const;