import { z } from 'zod';
import { UserRole } from '../types';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<{
        admin: "admin";
        employee: "employee";
    }>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    lastLoginAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare const CreateUserSchema: z.ZodObject<{
    password: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<{
        admin: "admin";
        employee: "employee";
    }>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        admin: "admin";
        employee: "employee";
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export declare const LoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export interface JwtPayload {
    userId: string;
    username: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
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
export interface AuthResult {
    success: boolean;
    user?: Omit<User, 'password'>;
    token?: string;
    message?: string;
}
export declare class UserModel {
    private data;
    constructor(data: Partial<User>);
    get id(): string;
    get username(): string;
    get email(): string;
    get name(): string;
    get role(): UserRole;
    get isActive(): boolean;
    get lastLoginAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Omit<User, 'password'>;
    toJSONWithPassword(): User;
    static validateCreate(data: unknown): CreateUserDto;
    static validateUpdate(data: unknown): UpdateUserDto;
    static validateChangePassword(data: unknown): ChangePasswordDto;
    static validateLogin(data: unknown): LoginDto;
    static validateId(id: unknown): string;
    update(updateData: UpdateUserDto): void;
    hashPassword(password: string): Promise<void>;
    verifyPassword(password: string): Promise<boolean>;
    changePassword(changePasswordData: ChangePasswordDto): Promise<{
        success: boolean;
        message?: string;
    }>;
    generateToken(secretKey: string, expiresIn?: string | number): string;
    static verifyToken(token: string, secretKey: string): JwtPayload | null;
    static authenticate(loginData: LoginDto, users: UserModel[], secretKey: string): Promise<AuthResult>;
    canBeDeleted(): {
        canDelete: boolean;
        reason?: string;
    };
    hasPermission(permission: string): boolean;
    canManageUsers(): boolean;
    canDeleteTransactions(): boolean;
    canManageLocations(): boolean;
    private generateId;
    static create(data: CreateUserDto): Promise<UserModel>;
    static fromDatabase(data: User): UserModel;
    static validateUsernameUniqueness(username: string, existingUsernames: string[]): boolean;
    static validateEmailUniqueness(email: string, existingEmails: string[]): boolean;
    static generateRandomPassword(length?: number): string;
    static validatePasswordStrength(password: string): {
        isStrong: boolean;
        suggestions: string[];
    };
    static generateSessionId(): string;
    static shouldLockAccount(failedAttempts: number, maxAttempts?: number): boolean;
    static calculateLockoutDuration(failedAttempts: number): number;
}
export declare class UserValidationError extends Error {
    readonly errors: z.ZodError;
    constructor(errors: z.ZodError);
    getFormattedErrors(): Record<string, string>;
}
export declare const USER_ROLES: {
    ADMIN: "admin";
    EMPLOYEE: "employee";
};
export declare const USER_ROLE_NAMES: {
    readonly admin: "管理员";
    readonly employee: "员工";
};
//# sourceMappingURL=User.d.ts.map