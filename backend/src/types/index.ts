// 通用响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 用户角色
export type UserRole = 'admin' | 'employee';

// 交易类型
export type TransactionType = 'inbound' | 'outbound';

// 批量操作结果
export interface BatchResult {
  success: number;
  failed: number;
  errors: string[];
  details?: any[];
}