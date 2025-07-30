export interface ReportData {
    [key: string]: any;
}
export interface ExportConfig {
    filename: string;
    sheetName: string;
    headers: Array<{
        key: string;
        title: string;
        width?: number;
    }>;
}
export interface MonthlyStatsData {
    month: string;
    inboundTotal: number;
    outboundTotal: number;
    netChange: number;
    itemCount: number;
}
export interface ItemUsageRankingData {
    itemName: string;
    category: string;
    totalOutbound: number;
    frequency: number;
    lastUsedDate: string;
}
export interface InventoryStatusData {
    itemName: string;
    category: string;
    locationName: string;
    currentStock: number;
    lowStockThreshold: number;
    status: 'normal' | 'low' | 'out_of_stock';
    lastTransactionDate: string;
}
export interface TransactionHistoryData {
    date: string;
    itemName: string;
    locationName: string;
    type: 'inbound' | 'outbound';
    quantity: number;
    operator: string;
    supplier?: string;
    recipient?: string;
    purpose?: string;
}
export declare class ReportExportService {
    static exportMonthlyStats(data: MonthlyStatsData[]): Buffer;
    static exportItemUsageRanking(data: ItemUsageRankingData[]): Buffer;
    static exportInventoryStatus(data: InventoryStatusData[]): Buffer;
    static exportTransactionHistory(data: TransactionHistoryData[]): Buffer;
    static exportToCSV(data: ReportData[], headers: Array<{
        key: string;
        title: string;
    }>): string;
    static exportMonthlyStatsToCSV(data: MonthlyStatsData[]): string;
    static exportItemUsageRankingToCSV(data: ItemUsageRankingData[]): string;
    static exportInventoryStatusToCSV(data: InventoryStatusData[]): string;
    static exportTransactionHistoryToCSV(data: TransactionHistoryData[]): string;
    private static exportToExcel;
    static getExportFilename(reportType: string, format?: 'xlsx' | 'csv'): string;
}
export default ReportExportService;
//# sourceMappingURL=ReportExportService.d.ts.map