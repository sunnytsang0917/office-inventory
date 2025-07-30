import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { ApiResponse } from '../types';
export declare class AuthController {
    private static users;
    static initialize(): Promise<void>;
    static login(req: Request, res: Response<ApiResponse<{
        user: any;
        token: string;
        expiresIn: string;
    }>>): Promise<void>;
    static logout(req: Request, res: Response<ApiResponse>): Promise<void>;
    static refreshToken(req: Request, res: Response<ApiResponse<{
        token: string;
        expiresIn: string;
    }>>): Promise<void>;
    static getCurrentUser(req: Request, res: Response<ApiResponse<any>>): Promise<void>;
    static changePassword(req: Request, res: Response<ApiResponse>): Promise<void>;
    static validateToken(req: Request, res: Response<ApiResponse<{
        valid: boolean;
        user?: any;
    }>>): Promise<void>;
    static getAllUsers(req: Request, res: Response<ApiResponse<any[]>>): Promise<void>;
    static addUser(userData: any): Promise<UserModel>;
    static getUserByUsername(username: string): UserModel | undefined;
    static clearUsers(): void;
}
//# sourceMappingURL=AuthController.d.ts.map