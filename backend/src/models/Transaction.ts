import { z } from 'zod';
import { TransactionType } from '../types';

// Transaction validation schema
export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  itemId: z.string().uuid('物品ID格式不正确'),
  locationId: z.string().uuid('库房位置ID格式不正确'),
  type: z.enum(['inbound', 'outbound'], { 
    message: '交易类型必须是inbound或outbound'
  }),
  quantity: z.number().positive('数量必须大于0'),
  date: z.date(),
  operator: z.string().min(1, '操作人不能为空').max(50, '操作人名称不能超过50个字符'),
  supplier: z.string().max(100, '供应商名称不能超过100个字符').optional(),
  recipient: z.string().max(50, '领用人名称不能超过50个字符').optional(),
  purpose: z.string().max(200, '用途说明不能超过200个字符').optional(),
  batchId: z.string().uuid('批次ID格式不正确').optional(),
  notes: z.string().max(500, '备注不能超过500个字符').optional().default(''),
  createdAt: z.date().optional(),
});

// Create Transaction DTO schema (for creating new transactions)
export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
});

// Update Transaction DTO schema (for updating existing transactions) - limited fields
export const UpdateTransactionSchema = z.object({
  operator: z.string().min(1, '操作人不能为空').max(50, '操作人名称不能超过50个字符').optional(),
  supplier: z.string().max(100, '供应商名称不能超过100个字符').optional(),
  recipient: z.string().max(50, '领用人名称不能超过50个字符').optional(),
  purpose: z.string().max(200, '用途说明不能超过200个字符').optional(),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
});

// Batch transaction schema for bulk operations
export const BatchTransactionSchema = z.object({
  transactions: z.array(CreateTransactionSchema),
  batchId: z.string().uuid('批次ID格式不正确').optional(),
});

// TypeScript interfaces derived from schemas
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
export type BatchTransactionDto = z.infer<typeof BatchTransactionSchema>;

// Transaction filter interface for search and listing
export interface TransactionFilter {
  itemId?: string;
  locationId?: string;
  type?: TransactionType;
  operator?: string;
  supplier?: string;
  recipient?: string;
  dateFrom?: Date;
  dateTo?: Date;
  batchId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'quantity' | 'operator' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Inventory impact interface
export interface InventoryImpact {
  itemId: string;
  locationId: string;
  quantityChange: number; // positive for inbound, negative for outbound
  newStock: number;
}

// Transaction class with validation methods
export class TransactionModel {
  private data: Transaction;

  constructor(data: Partial<Transaction>) {
    this.data = TransactionSchema.parse({
      ...data,
      id: data.id || this.generateId(),
      createdAt: data.createdAt || new Date(),
    });
  }

  // Getters
  get id(): string {
    return this.data.id!;
  }

  get itemId(): string {
    return this.data.itemId;
  }

  get locationId(): string {
    return this.data.locationId;
  }

  get type(): TransactionType {
    return this.data.type;
  }

  get quantity(): number {
    return this.data.quantity;
  }

  get date(): Date {
    return this.data.date;
  }

  get operator(): string {
    return this.data.operator;
  }

  get supplier(): string | undefined {
    return this.data.supplier;
  }

  get recipient(): string | undefined {
    return this.data.recipient;
  }

  get purpose(): string | undefined {
    return this.data.purpose;
  }

  get batchId(): string | undefined {
    return this.data.batchId;
  }

  get notes(): string {
    return this.data.notes || '';
  }

  get createdAt(): Date {
    return this.data.createdAt!;
  }

  // Get all data
  toJSON(): Transaction {
    return { ...this.data };
  }

  // Validation methods
  static validateCreate(data: unknown): CreateTransactionDto {
    return CreateTransactionSchema.parse(data);
  }

  static validateUpdate(data: unknown): UpdateTransactionDto {
    return UpdateTransactionSchema.parse(data);
  }

  static validateBatch(data: unknown): BatchTransactionDto {
    return BatchTransactionSchema.parse(data);
  }

  static validateId(id: unknown): string {
    return z.string().uuid('交易ID格式不正确').parse(id);
  }

  // Update transaction data (limited fields)
  update(updateData: UpdateTransactionDto): void {
    const validatedData = UpdateTransactionSchema.parse(updateData);
    // Only update fields that are actually provided
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof UpdateTransactionDto] !== undefined) {
        (this.data as any)[key] = validatedData[key as keyof UpdateTransactionDto];
      }
    });
  }

  // Business logic validation
  validateBusinessRules(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate transaction type specific fields
    if (this.data.type === 'inbound') {
      if (!this.data.supplier) {
        errors.push('入库操作必须指定供应商');
      }
      if (this.data.recipient) {
        errors.push('入库操作不应该有领用人');
      }
    } else if (this.data.type === 'outbound') {
      if (!this.data.recipient) {
        errors.push('出库操作必须指定领用人');
      }
      if (!this.data.purpose) {
        errors.push('出库操作必须指定用途');
      }
      if (this.data.supplier) {
        errors.push('出库操作不应该有供应商');
      }
    }

    // Validate date is not in the future
    if (this.data.date > new Date()) {
      errors.push('交易日期不能是未来时间');
    }

    // Validate quantity is reasonable (not too large)
    if (this.data.quantity > 1000000) {
      errors.push('单次交易数量不能超过1,000,000');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Calculate inventory impact
  calculateInventoryImpact(): InventoryImpact {
    const quantityChange = this.data.type === 'inbound' ? this.data.quantity : -this.data.quantity;
    
    return {
      itemId: this.data.itemId,
      locationId: this.data.locationId,
      quantityChange,
      newStock: 0, // This would be calculated with current stock
    };
  }

  // Check if transaction can be reversed/cancelled
  canBeReversed(): { canReverse: boolean; reason?: string } {
    // Check if transaction is too old (e.g., more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (this.data.date < thirtyDaysAgo) {
      return { canReverse: false, reason: '超过30天的交易不能撤销' };
    }

    // For outbound transactions, check if there's enough stock to reverse
    if (this.data.type === 'outbound') {
      // This would typically check current stock levels
      // For now, we'll assume it's possible
      return { canReverse: true };
    }

    return { canReverse: true };
  }

  // Generate reverse transaction
  generateReverseTransaction(): CreateTransactionDto {
    const reverseType: TransactionType = this.data.type === 'inbound' ? 'outbound' : 'inbound';
    
    return {
      itemId: this.data.itemId,
      locationId: this.data.locationId,
      type: reverseType,
      quantity: this.data.quantity,
      date: new Date(),
      operator: this.data.operator,
      supplier: reverseType === 'inbound' ? `撤销-${this.data.recipient || ''}` : undefined,
      recipient: reverseType === 'outbound' ? `撤销-${this.data.supplier || ''}` : undefined,
      purpose: `撤销交易: ${this.data.id}`,
      notes: `撤销原交易 ${this.data.id}`,
    };
  }

  // Helper methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Static factory methods
  static create(data: CreateTransactionDto): TransactionModel {
    return new TransactionModel(data);
  }

  static fromDatabase(data: Transaction): TransactionModel {
    return new TransactionModel(data);
  }

  // Utility methods for batch operations
  static createBatch(batchData: BatchTransactionDto): TransactionModel[] {
    const batchId = batchData.batchId || crypto.randomUUID();
    
    return batchData.transactions.map(transactionData => {
      return new TransactionModel({
        ...transactionData,
        batchId,
      });
    });
  }

  static validateStockAvailability(
    outboundTransactions: TransactionModel[], 
    currentStock: Record<string, number>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stockChanges: Record<string, number> = {};

    // Calculate total stock changes by location
    outboundTransactions.forEach(transaction => {
      if (transaction.type === 'outbound') {
        const key = `${transaction.itemId}-${transaction.locationId}`;
        stockChanges[key] = (stockChanges[key] || 0) + transaction.quantity;
      }
    });

    // Check if stock is sufficient
    Object.entries(stockChanges).forEach(([key, requiredQuantity]) => {
      const currentStockLevel = currentStock[key] || 0;
      if (currentStockLevel < requiredQuantity) {
        errors.push(`位置 ${key} 库存不足，需要 ${requiredQuantity}，当前库存 ${currentStockLevel}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Statistical methods
  static calculateTotalQuantity(transactions: TransactionModel[], type?: TransactionType): number {
    return transactions
      .filter(t => !type || t.type === type)
      .reduce((total, t) => total + t.quantity, 0);
  }

  static groupByDate(transactions: TransactionModel[]): Record<string, TransactionModel[]> {
    const grouped: Record<string, TransactionModel[]> = {};
    
    transactions.forEach(transaction => {
      const dateKey = transaction.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return grouped;
  }

  static groupByLocation(transactions: TransactionModel[]): Record<string, TransactionModel[]> {
    const grouped: Record<string, TransactionModel[]> = {};
    
    transactions.forEach(transaction => {
      if (!grouped[transaction.locationId]) {
        grouped[transaction.locationId] = [];
      }
      grouped[transaction.locationId].push(transaction);
    });

    return grouped;
  }
}

// Validation error class
export class TransactionValidationError extends Error {
  public readonly errors: z.ZodError;

  constructor(errors: z.ZodError) {
    super('Transaction validation failed');
    this.name = 'TransactionValidationError';
    this.errors = errors;
  }

  getFormattedErrors(): Record<string, string> {
    const formatted: Record<string, string> = {};
    this.errors.issues.forEach((error: any) => {
      const path = error.path.join('.');
      formatted[path] = error.message;
    });
    return formatted;
  }
}