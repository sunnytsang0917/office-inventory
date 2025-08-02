import { ApiClient, TokenManager } from './api';

// 认证相关类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'employee';
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 认证API服务
export class AuthApi {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await ApiClient.post<LoginResponse>('/auth/login', credentials);
    
    // 保存tokens
    TokenManager.setToken(response.token);
    if (response.refreshToken) {
      TokenManager.setRefreshToken(response.refreshToken);
    }
    
    return response;
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      await ApiClient.post('/auth/logout');
    } finally {
      // 无论请求是否成功，都清除本地tokens
      TokenManager.clearTokens();
    }
  }

  // 刷新token
  static async refreshToken(): Promise<{ token: string }> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await ApiClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });

    // 更新token
    TokenManager.setToken(response.token);
    return response;
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<User> {
    return ApiClient.get<User>('/auth/me');
  }

  // 修改密码
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    return ApiClient.post('/auth/change-password', data);
  }

  // 验证token
  static async validateToken(): Promise<{ valid: boolean; user?: User }> {
    const token = TokenManager.getToken();
    if (!token) {
      return { valid: false };
    }

    try {
      const response = await ApiClient.post<{ valid: boolean; user?: User }>('/auth/validate', {
        token,
      });
      return response;
    } catch {
      return { valid: false };
    }
  }

  // 获取所有用户（仅管理员）
  static async getAllUsers(): Promise<User[]> {
    return ApiClient.get<User[]>('/auth/users');
  }

  // 检查用户是否已登录
  static isLoggedIn(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  // 获取当前用户角色
  static getCurrentUserRole(): string | null {
    const token = TokenManager.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }

  // 检查用户是否为管理员
  static isAdmin(): boolean {
    return this.getCurrentUserRole() === 'admin';
  }
}