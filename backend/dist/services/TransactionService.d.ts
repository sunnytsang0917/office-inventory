import { TransactionModel, CreateTransactionDto, UpdateTransactionDto, BatchTransactionDto, TransactionFilter } from '../models/Transaction';
import { PaginatedResponse } from '../types';
export declare class TransactionService {
    private itemService;
    private locationService;
    createTransaction(transactionData: CreateTransactionDto): Promise<TransactionModel>;
    createBatchTransactions(batchData: BatchTransactionDto): Promise<{
        success: TransactionModel[];
        failed: Array<{
            index: number;
            error: string;
            data: CreateTransactionDto;
        }>;
        batchId: string;
    }>;
    getTransaction(id: string): Promise<TransactionModel>;
    getTransactionHistory(filter?: TransactionFilter): Promise<PaginatedResponse<TransactionModel>>;
    updateTransaction(id: string, updateData: UpdateTransactionDto): Promise<TransactionModel>;
    deleteTransaction(id: string): Promise<void>;
    private getCurrentStock;
    private validateBatchStockAvailability;
    private canDeleteTransaction;
    getTransactionStatistics(filter?: {
        dateFrom?: Date;
        dateTo?: Date;
        itemId?: string;
        locationId?: string;
    }): Promise<{
        totalInbound: number;
        totalOutbound: number;
        transactionCount: number;
        topItems: Array<{
            itemId: string;
            itemName: string;
            totalQuantity: number;
            transactionCount: number;
        }>;
        topLocations: Array<{
            locationId: string;
            locationName: string;
            totalQuantity: number;
            transactionCount: number;
        }>;
    }>;
}
export default TransactionService;
//# sourceMappingURL=TransactionService.d.ts.map