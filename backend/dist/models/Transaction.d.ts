import { z } from 'zod';
import { TransactionType } from '../types';
export declare const TransactionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    itemId: z.ZodString;
    locationId: z.ZodString;
    type: z.ZodEnum<{
        inbound: "inbound";
        outbound: "outbound";
    }>;
    quantity: z.ZodNumber;
    date: z.ZodDate;
    operator: z.ZodString;
    supplier: z.ZodOptional<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    batchId: z.ZodOptional<z.ZodString>;
    notes: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare const CreateTransactionSchema: z.ZodObject<{
    type: z.ZodEnum<{
        inbound: "inbound";
        outbound: "outbound";
    }>;
    itemId: z.ZodString;
    locationId: z.ZodString;
    date: z.ZodDate;
    quantity: z.ZodNumber;
    operator: z.ZodString;
    supplier: z.ZodOptional<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    batchId: z.ZodOptional<z.ZodString>;
    notes: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const UpdateTransactionSchema: z.ZodObject<{
    operator: z.ZodOptional<z.ZodString>;
    supplier: z.ZodOptional<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BatchTransactionSchema: z.ZodObject<{
    transactions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            inbound: "inbound";
            outbound: "outbound";
        }>;
        itemId: z.ZodString;
        locationId: z.ZodString;
        date: z.ZodDate;
        quantity: z.ZodNumber;
        operator: z.ZodString;
        supplier: z.ZodOptional<z.ZodString>;
        recipient: z.ZodOptional<z.ZodString>;
        purpose: z.ZodOptional<z.ZodString>;
        batchId: z.ZodOptional<z.ZodString>;
        notes: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    batchId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
export type BatchTransactionDto = z.infer<typeof BatchTransactionSchema>;
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
export interface InventoryImpact {
    itemId: string;
    locationId: string;
    quantityChange: number;
    newStock: number;
}
export declare class TransactionModel {
    private data;
    constructor(data: Partial<Transaction>);
    get id(): string;
    get itemId(): string;
    get locationId(): string;
    get type(): TransactionType;
    get quantity(): number;
    get date(): Date;
    get operator(): string;
    get supplier(): string | undefined;
    get recipient(): string | undefined;
    get purpose(): string | undefined;
    get batchId(): string | undefined;
    get notes(): string;
    get createdAt(): Date;
    toJSON(): Transaction;
    static validateCreate(data: unknown): CreateTransactionDto;
    static validateUpdate(data: unknown): UpdateTransactionDto;
    static validateBatch(data: unknown): BatchTransactionDto;
    static validateId(id: unknown): string;
    update(updateData: UpdateTransactionDto): void;
    validateBusinessRules(): {
        isValid: boolean;
        errors: string[];
    };
    calculateInventoryImpact(): InventoryImpact;
    canBeReversed(): {
        canReverse: boolean;
        reason?: string;
    };
    generateReverseTransaction(): CreateTransactionDto;
    private generateId;
    static create(data: CreateTransactionDto): TransactionModel;
    static fromDatabase(data: Transaction): TransactionModel;
    static createBatch(batchData: BatchTransactionDto): TransactionModel[];
    static validateStockAvailability(outboundTransactions: TransactionModel[], currentStock: Record<string, number>): {
        isValid: boolean;
        errors: string[];
    };
    static calculateTotalQuantity(transactions: TransactionModel[], type?: TransactionType): number;
    static groupByDate(transactions: TransactionModel[]): Record<string, TransactionModel[]>;
    static groupByLocation(transactions: TransactionModel[]): Record<string, TransactionModel[]>;
}
export declare class TransactionValidationError extends Error {
    readonly errors: z.ZodError;
    constructor(errors: z.ZodError);
    getFormattedErrors(): Record<string, string>;
}
//# sourceMappingURL=Transaction.d.ts.map