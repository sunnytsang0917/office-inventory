import { ApiClient } from './api';

// 报表相关类型定义
export interface MonthlyStats {
  month: string;
  inboundTotal: number;
  outboundTotal: number;
  transactionCount: number;
}

export interface ItemUsageRank {
  itemId: string;
  itemName: string;
  category: string;
  outboundCount: number;
  outboundQuantity: number;
  rank: number;
}

export interface InventoryStatusReport {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  totalStock: number;
  minStock: number;
  isLowStock: boolean;
  locations: Array<{
    locationId: string;
    locationName: string;
    locationCode: string;
    currentStock: number;
    isLowStock: boolean;
  }>;
}

export interface TransactionHistoryReport {
  id: string;
  itemId: string;
  itemName: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date: string;
  operator: string;
  supplier?: string;
  recipient?: string;
  purpose?: string;
}

export interface CustomRangeStats {
  startDate: string;
  endDate: string;
  totalInbound: number;
  totalOutbound: number;
  totalTransactions: number;
  dailyStats: Array<{
    date: string;
    inboundQuantity: number;
    outboundQuantity: number;
    transactionCount: number;
  }>;
  categoryStats: Array<{
    category: string;
    inboundQuantity: number;
    outboundQuantity: number;
    itemCount: number;
  }>;
  topItems: Array<{
    itemId: string;
    itemName: string;
    category: string;
    totalQuantity: number;
    transactionCount: number;
  }>;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
}

// 报表API服务
export class ReportApi {
  // 获取可用报表类型
  static async getAvailableReports(): Promise<ReportType[]> {
    return ApiClient.get<ReportType[]>('/reports/types');
  }

  // 获取月度统计报表
  static async getMonthlyStats(startMonth?: string, endMonth?: string): Promise<MonthlyStats[]> {
    const params = new URLSearchParams();
    if (startMonth) params.append('startMonth', startMonth);
    if (endMonth) params.append('endMonth', endMonth);

    const queryString = params.toString();
    const url = queryString ? `/reports/monthly-stats?${queryString}` : '/reports/monthly-stats';
    
    return ApiClient.get<MonthlyStats[]>(url);
  }

  // 导出月度统计报表
  static async exportMonthlyStats(format: 'csv' | 'excel' = 'csv', startMonth?: string, endMonth?: string): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startMonth) params.append('startMonth', startMonth);
    if (endMonth) params.append('endMonth', endMonth);

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/reports/monthly-stats/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export monthly stats');
    }

    return response.blob();
  }

  // 获取物品使用排行报表
  static async getItemUsageRanking(startDate?: string, endDate?: string, limit?: number): Promise<ItemUsageRank[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/reports/item-usage?${queryString}` : '/reports/item-usage';
    
    return ApiClient.get<ItemUsageRank[]>(url);
  }

  // 导出物品使用排行报表
  static async exportItemUsageRanking(format: 'csv' | 'excel' = 'csv', startDate?: string, endDate?: string, limit?: number): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/reports/item-usage/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export item usage ranking');
    }

    return response.blob();
  }

  // 获取库存状态报表
  static async getInventoryStatus(): Promise<InventoryStatusReport[]> {
    return ApiClient.get<InventoryStatusReport[]>('/reports/inventory-status');
  }

  // 导出库存状态报表
  static async exportInventoryStatus(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/reports/inventory-status/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export inventory status');
    }

    return response.blob();
  }

  // 获取交易历史报表
  static async getTransactionHistory(startDate?: string, endDate?: string, type?: 'inbound' | 'outbound'): Promise<TransactionHistoryReport[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);

    const queryString = params.toString();
    const url = queryString ? `/reports/transaction-history?${queryString}` : '/reports/transaction-history';
    
    return ApiClient.get<TransactionHistoryReport[]>(url);
  }

  // 导出交易历史报表
  static async exportTransactionHistory(format: 'csv' | 'excel' = 'csv', startDate?: string, endDate?: string, type?: 'inbound' | 'outbound'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/reports/transaction-history/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export transaction history');
    }

    return response.blob();
  }

  // 获取自定义时间范围统计
  static async getCustomRangeStats(startDate: string, endDate: string): Promise<CustomRangeStats> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    return ApiClient.get<CustomRangeStats>(`/reports/custom-range?${params.toString()}`);
  }

  // 通用导出接口
  static async exportReport(reportType: string, format: 'csv' | 'excel' = 'csv', params?: Record<string, string>): Promise<Blob> {
    const searchParams = new URLSearchParams();
    searchParams.append('format', format);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/reports/export/${reportType}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export ${reportType} report`);
    }

    return response.blob();
  }

  // 下载文件的工具方法
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // 生成报表文件名
  static generateReportFilename(reportType: string, format: 'csv' | 'excel', date?: string): string {
    const timestamp = date || new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    
    const reportNames: Record<string, string> = {
      'monthly-stats': '月度统计报表',
      'item-usage': '物品使用排行报表',
      'inventory-status': '库存状态报表',
      'transaction-history': '交易历史报表',
      'custom-range': '自定义时间范围统计报表',
    };

    const reportName = reportNames[reportType] || reportType;
    return `${reportName}_${timestamp}.${extension}`;
  }
}