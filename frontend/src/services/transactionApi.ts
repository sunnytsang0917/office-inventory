import { ApiClient } from './api';
import { Transaction } from '../types/transaction';

// 交易相关类型定义
export interface CreateTransactionRequest {
  itemId: string;
  locationId: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date?: string;
  operator: string;
  supplier?: string;
  recipient?: string;
  purpose?: string;
}

export interface CreateInboundTransactionRequest {
  itemId: string;
  locationId: string;
  quantity: number;
  date?: string;
  operator: string;
  supplier?: string;
}

export interface CreateOutboundTransactionRequest {
  itemId: string;
  locationId: string;
  quantity: number;
  date?: string;
  operator: string;
  recipient?: string;
  purpose?: string;
}

export interface BatchTransactionRequest {
  transactions: CreateTransactionRequest[];
}

export interface TransactionFilter {
  type?: 'inbound' | 'outbound';
  itemId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  operator?: string;
  page?: number;
  limit?: number;
}

export interface TransactionStatistics {
  totalTransactions: number;
  totalInbound: number;
  totalOutbound: number;
  todayTransactions: number;
  thisWeekTransactions: number;
  thisMonthTransactions: number;
  topItems: Array<{
    itemId: string;
    itemName: string;
    transactionCount: number;
    totalQuantity: number;
  }>;
  topLocations: Array<{
    locationId: string;
    locationName: string;
    transactionCount: number;
    totalQuantity: number;
  }>;
}

export interface BatchImportResult {
  success: boolean;
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  transactions: Transaction[];
}

// 交易API服务
export class TransactionApi {
  // 创建交易记录
  static async createTransaction(transaction: CreateTransactionRequest): Promise<Transaction> {
    return ApiClient.post<Transaction>('/transactions', transaction);
  }

  // 创建入库记录
  static async createInboundTransaction(transaction: CreateInboundTransactionRequest): Promise<Transaction> {
    return ApiClient.post<Transaction>('/transactions/inbound', transaction);
  }

  // 创建出库记录
  static async createOutboundTransaction(transaction: CreateOutboundTransactionRequest): Promise<Transaction> {
    return ApiClient.post<Transaction>('/transactions/outbound', transaction);
  }

  // 批量创建交易记录
  static async createBatchTransactions(request: BatchTransactionRequest): Promise<Transaction[]> {
    return ApiClient.post<Transaction[]>('/transactions/batch', request);
  }

  // 获取交易历史记录
  static async getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]> {
    const params = new URLSearchParams();
    
    if (filter?.type) params.append('type', filter.type);
    if (filter?.itemId) params.append('itemId', filter.itemId);
    if (filter?.locationId) params.append('locationId', filter.locationId);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.operator) params.append('operator', filter.operator);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';
    
    return ApiClient.get<Transaction[]>(url);
  }

  // 获取交易记录详情
  static async getTransaction(id: string): Promise<Transaction> {
    return ApiClient.get<Transaction>(`/transactions/${id}`);
  }

  // 更新交易记录（仅管理员）
  static async updateTransaction(id: string, transaction: Partial<CreateTransactionRequest>): Promise<Transaction> {
    return ApiClient.put<Transaction>(`/transactions/${id}`, transaction);
  }

  // 删除交易记录（仅管理员）
  static async deleteTransaction(id: string): Promise<void> {
    return ApiClient.delete(`/transactions/${id}`);
  }

  // 获取交易统计信息
  static async getTransactionStatistics(startDate?: string, endDate?: string): Promise<TransactionStatistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `/transactions/statistics?${queryString}` : '/transactions/statistics';
    
    return ApiClient.get<TransactionStatistics>(url);
  }

  // Excel批量入库
  static async batchInbound(file: File): Promise<BatchImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return ApiClient.upload<BatchImportResult>('/transactions/inbound/batch-upload', formData);
  }

  // Excel批量出库
  static async batchOutbound(file: File): Promise<BatchImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return ApiClient.upload<BatchImportResult>('/transactions/outbound/batch-upload', formData);
  }

  // 下载入库模板
  static async downloadInboundTemplate(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/transactions/inbound/template/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download inbound template');
    }

    return response.blob();
  }

  // 下载出库模板
  static async downloadOutboundTemplate(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/transactions/outbound/template/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download outbound template');
    }

    return response.blob();
  }

  // 获取入库记录
  static async getInboundTransactions(filter?: Omit<TransactionFilter, 'type'>): Promise<Transaction[]> {
    return this.getTransactionHistory({ ...filter, type: 'inbound' });
  }

  // 获取出库记录
  static async getOutboundTransactions(filter?: Omit<TransactionFilter, 'type'>): Promise<Transaction[]> {
    return this.getTransactionHistory({ ...filter, type: 'outbound' });
  }

  // 获取物品的交易历史
  static async getItemTransactionHistory(itemId: string, locationId?: string): Promise<Transaction[]> {
    const filter: TransactionFilter = { itemId };
    if (locationId) {
      filter.locationId = locationId;
    }
    return this.getTransactionHistory(filter);
  }

  // 获取位置的交易历史
  static async getLocationTransactionHistory(locationId: string): Promise<Transaction[]> {
    return this.getTransactionHistory({ locationId });
  }
}