import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../models/User';
import { ApiResponse } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const refreshToken: (req: Request, res: Response<ApiResponse>) => void;
export declare const getCurrentUser: (req: Request, res: Response<ApiResponse>) => void;
export declare const extractTokenFromRequest: (req: Request) => string | null;
export declare const isTokenExpired: (token: string) => boolean;
export declare const getTokenExpirationTime: (token: string) => Date | null;
export declare const validateTokenFormat: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (requiredRole: "admin" | "employee") => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const requireAllPermissions: (permissions: string[]) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const requireAnyPermission: (permissions: string[]) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const requireOwnershipOrAdmin: (getUserIdFromRequest: (req: Request) => string) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const conditionalPermission: (condition: (req: Request) => boolean, truePermissions: string[], falsePermissions: string[]) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const rateLimitByRole: (adminLimit: number, employeeLimit: number) => (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const isAdmin: (req: Request) => boolean;
export declare const isEmployee: (req: Request) => boolean;
export declare const getUserPermissions: (req: Request) => string[];
//# sourceMappingURL=auth.d.ts.map