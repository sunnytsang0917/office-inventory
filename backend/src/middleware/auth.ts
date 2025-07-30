import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, UserModel } from '../models/User';
import { ApiResponse } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user information to request object
 */
export const authenticateToken = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    // Verify token
    const decoded = UserModel.verifyToken(token, config.jwt.secret);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: '访问令牌无效或已过期',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: '身份验证失败',
      error: 'AUTHENTICATION_FAILED'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't fail if no token is provided
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = UserModel.verifyToken(token, config.jwt.secret);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Token Refresh Utility
 * Generates a new token for the authenticated user
 */
export const refreshToken = (req: Request, res: Response<ApiResponse>): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Create a temporary user model to generate new token
    const tempUser = new UserModel({
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      email: '', // These fields are not needed for token generation
      password: '',
      name: '',
    });

    const newToken = tempUser.generateToken(config.jwt.secret, config.jwt.expiresIn);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        token: newToken,
        expiresIn: config.jwt.expiresIn
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: '令牌刷新失败',
      error: 'TOKEN_REFRESH_FAILED'
    });
  }
};

/**
 * Middleware to check if user is authenticated
 * Returns user info if authenticated
 */
export const getCurrentUser = (req: Request, res: Response<ApiResponse>): void => {
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
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: 'GET_USER_FAILED'
    });
  }
};

/**
 * Utility function to extract token from request
 */
export const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.split(' ')[1] || null;
};

/**
 * Utility function to check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Utility function to get token expiration time
 */
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to validate token format
 */
export const validateTokenFormat = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Role-based Authorization Middleware
 * Checks if the authenticated user has the required role
 */
export const requireRole = (requiredRole: 'admin' | 'employee') => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
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
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Admin Only Middleware
 * Shortcut for requiring admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Permission-based Authorization Middleware
 * Checks if the authenticated user has the required permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // Create a temporary user model to check permissions
      const tempUser = new UserModel({
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        email: '', // These fields are not needed for permission check
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
    } catch (error) {
      console.error('Permission authorization error:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Multiple Permissions Middleware
 * Checks if the authenticated user has ALL of the required permissions
 */
export const requireAllPermissions = (permissions: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const tempUser = new UserModel({
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
    } catch (error) {
      console.error('Multiple permissions authorization error:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Any Permission Middleware
 * Checks if the authenticated user has ANY of the required permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const tempUser = new UserModel({
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
    } catch (error) {
      console.error('Any permission authorization error:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Resource Owner Middleware
 * Checks if the authenticated user owns the resource or is an admin
 */
export const requireOwnershipOrAdmin = (getUserIdFromRequest: (req: Request) => string) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Check if user owns the resource
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
    } catch (error) {
      console.error('Ownership authorization error:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: 'AUTHORIZATION_FAILED'
      });
    }
  };
};

/**
 * Conditional Permission Middleware
 * Applies different permission checks based on conditions
 */
export const conditionalPermission = (
  condition: (req: Request) => boolean,
  truePermissions: string[],
  falsePermissions: string[]
) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const permissions = condition(req) ? truePermissions : falsePermissions;
    return requireAllPermissions(permissions)(req, res, next);
  };
};

/**
 * Rate Limiting by Role Middleware
 * Different rate limits for different roles (placeholder for future implementation)
 */
export const rateLimitByRole = (adminLimit: number, employeeLimit: number) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    // This is a placeholder for rate limiting implementation
    // In a real application, you would implement actual rate limiting logic here
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // For now, just pass through - actual rate limiting would be implemented here
    next();
  };
};

/**
 * Utility function to check if user has admin privileges
 */
export const isAdmin = (req: Request): boolean => {
  return req.user?.role === 'admin';
};

/**
 * Utility function to check if user has employee privileges
 */
export const isEmployee = (req: Request): boolean => {
  return req.user?.role === 'employee';
};

/**
 * Utility function to get user permissions
 */
export const getUserPermissions = (req: Request): string[] => {
  if (!req.user) {
    return [];
  }

  const tempUser = new UserModel({
    id: req.user.userId,
    username: req.user.username,
    role: req.user.role,
    email: '',
    password: '',
    name: '',
  });

  // Define all possible permissions
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