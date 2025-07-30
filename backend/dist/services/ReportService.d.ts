import { MonthlyStatsData, ItemUsageRankingData, InventoryStatusData, TransactionHistoryData } from './ReportExportService';
export interface ReportDateRange {
    startDate: Date;
    endDate: Date;
}
export interface MonthlyStatsFilter extends ReportDateRange {
    locationId?: string;
    category?: string;
}
export interface ItemUsageFilter extends ReportDateRange {
    locationId?: string;
    category?: string;
    limit?: number;
}
export interface InventoryStatusFilter {
    locationId?: string;
    category?: string;
    lowStockOnly?: boolean;
}
export interface TransactionHistoryFilter extends ReportDateRange {
    itemId?: string;
    locationId?: string;
    type?: 'inbound' | 'outbound';
    operator?: string;
    limit?: number;
    offset?: number;
}
export declare class ReportService {
    getMonthlyStats(filter: MonthlyStatsFilter): Promise<MonthlyStatsData[]>;
    getItemUsageRanking(filter: ItemUsageFilter): Promise<ItemUsageRankingData[]>;
    getInventoryStatus(filter: InventoryStatusFilter): Promise<InventoryStatusData[]>;
    getTransactionHistory(filter: TransactionHistoryFilter): Promise<{
        data: TransactionHistoryData[];
        total: number;
    }>;
    getCustomRangeStats(filter: ReportDateRange & {
        locationId?: string;
        category?: string;
    }): Promise<{
        summary: {
            totalInbound: number;
            totalOutbound: number;
            netChange: number;
            transactionCount: number;
            uniqueItems: number;
            uniqueLocations: number;
        };
        dailyStats: Array<{
            date: string;
            inbound: number;
            outbound: number;
            netChange: number;
        }>;
        topItems: Array<{
            itemName: string;
            category: string;
            totalQuantity: number;
            transactionCount: number;
        }>;
        topLocations: Array<{
            locationName: string;
            totalQuantity: number;
            transactionCount: number;
        }>;
    }>;
    getAvailableReports(): Array<{
        type: string;
        name: string;
        description: string;
        supportedFormats: string[];
    }>;
}
export default ReportService;
//# sourceMappingURL=ReportService.d.ts.map