export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export type UserRole = 'admin' | 'employee';
export type TransactionType = 'inbound' | 'outbound';
export interface BatchResult {
    success: number;
    failed: number;
    errors: string[];
    details?: any[];
}
//# sourceMappingURL=index.d.ts.map