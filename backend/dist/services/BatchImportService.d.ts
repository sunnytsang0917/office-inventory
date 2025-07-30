import { Pool } from 'pg';
import { CreateTransactionDto } from '../models/Transaction';
import { BatchResult } from '../types';
export interface BatchImportResult extends BatchResult {
    importedItems?: string[];
    importedTransactions?: string[];
}
export interface BatchImportOptions {
    skipErrors?: boolean;
    validateOnly?: boolean;
    batchSize?: number;
}
export declare class BatchImportService {
    private excelService;
    private itemService;
    private transactionService;
    private pool;
    constructor(pool: Pool);
    importItems(buffer: Buffer, options?: BatchImportOptions): Promise<BatchImportResult>;
    importInboundTransactions(buffer: Buffer, options?: BatchImportOptions): Promise<BatchImportResult>;
    importOutboundTransactions(buffer: Buffer, options?: BatchImportOptions): Promise<BatchImportResult>;
    private importTransactions;
    private processBatchItems;
    private processBatchTransactions;
    validateImportData(buffer: Buffer, type: 'items' | 'inbound' | 'outbound'): Promise<{
        isValid: boolean;
        totalRows: number;
        validRows: number;
        errors: Array<{
            row: number;
            message: string;
            column?: string;
        }>;
    }>;
    getImportTemplate(type: 'items' | 'inbound' | 'outbound'): Buffer;
    checkImportPrerequisites(transactions: CreateTransactionDto[]): Promise<{
        isValid: boolean;
        missingItems: string[];
        missingLocations: string[];
        insufficientStock: Array<{
            itemId: string;
            locationId: string;
            required: number;
            available: number;
        }>;
    }>;
}
export default BatchImportService;
//# sourceMappingURL=BatchImportService.d.ts.map