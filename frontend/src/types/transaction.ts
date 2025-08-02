// 交易记录相关类型定义

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date: string;
  operator: string;       // 操作人
  supplier?: string;      // 供应商（入库时）
  recipient?: string;     // 领用人（出库时）
  purpose?: string;       // 用途（出库时）
  batchId?: string;       // 批量操作ID
  createdAt: string;
}

export interface CreateInboundDto {
  itemId: string;
  locationId: string;
  quantity: number;
  supplier?: string;
  operator: string;
  date?: string;
}

export interface CreateOutboundDto {
  itemId: string;
  locationId: string;
  quantity: number;
  recipient: string;
  purpose?: string;
  operator: string;
  date?: string;
}

export interface TransactionFilter {
  itemId?: string;
  locationId?: string;
  type?: 'inbound' | 'outbound';
  startDate?: string;
  endDate?: string;
  operator?: string;
  batchId?: string;
}

export interface BatchResult {
  success: number;
  failed: number;
  errors: BatchError[];
  transactions: Transaction[];
}

export interface BatchError {
  row: number;
  itemName?: string;
  locationName?: string;
  error: string;
}

// 库存状态接口
export interface InventoryStatus {
  itemId: string;
  itemName: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  currentStock: number;
  minStock: number;
  isLowStock: boolean;
  lastTransactionDate?: string;
}

// 位置库存接口
export interface LocationInventory {
  locationId: string;
  locationName: string;
  locationCode: string;
  items: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    isLowStock: boolean;
  }[];
}