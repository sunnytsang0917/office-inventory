export interface InventoryStatus {
    itemId: string;
    itemName: string;
    category: string;
    unit: string;
    locationId: string;
    locationCode: string;
    locationName: string;
    currentStock: number;
    lowStockThreshold: number;
    isLowStock: boolean;
    lastTransactionDate?: Date;
}
export interface InventoryDetail {
    itemId: string;
    itemName: string;
    category: string;
    specification?: string;
    unit: string;
    lowStockThreshold: number;
    totalStock: number;
    locationStocks: Array<{
        locationId: string;
        locationCode: string;
        locationName: string;
        stock: number;
        isLowStock: boolean;
        lastTransactionDate?: Date;
    }>;
    recentTransactions: Array<{
        id: string;
        type: 'inbound' | 'outbound';
        quantity: number;
        date: Date;
        operator: string;
        locationName: string;
        locationCode: string;
        supplier?: string;
        recipient?: string;
        purpose?: string;
    }>;
}
export interface InventoryFilter {
    search?: string;
    category?: string;
    locationId?: string;
    isLowStock?: boolean;
    hasStock?: boolean;
    minStock?: number;
    maxStock?: number;
}
export interface LowStockAlert {
    itemId: string;
    itemName: string;
    category: string;
    unit: string;
    locationId: string;
    locationCode: string;
    locationName: string;
    currentStock: number;
    lowStockThreshold: number;
    stockDeficit: number;
    lastTransactionDate?: Date;
}
export declare class InventoryService {
    private itemService;
    private locationService;
    private transactionService;
    getInventoryStatus(filter?: InventoryFilter): Promise<InventoryStatus[]>;
    getItemInventory(itemId: string): Promise<InventoryDetail>;
    searchInventory(query: string): Promise<InventoryStatus[]>;
    getLowStockItems(threshold?: number): Promise<LowStockAlert[]>;
    getLocationInventorySummary(locationId: string): Promise<{
        locationInfo: {
            id: string;
            code: string;
            name: string;
            description?: string;
        };
        totalItems: number;
        totalStock: number;
        lowStockItems: number;
        items: Array<{
            itemId: string;
            itemName: string;
            category: string;
            unit: string;
            currentStock: number;
            lowStockThreshold: number;
            isLowStock: boolean;
            lastTransactionDate?: Date;
        }>;
    }>;
    getInventoryStatistics(): Promise<{
        totalItems: number;
        totalLocations: number;
        totalStock: number;
        lowStockAlerts: number;
        zeroStockItems: number;
        topCategories: Array<{
            category: string;
            itemCount: number;
            totalStock: number;
        }>;
        topLocations: Array<{
            locationId: string;
            locationCode: string;
            locationName: string;
            itemCount: number;
            totalStock: number;
        }>;
    }>;
    getInventoryHistory(itemId: string, locationId?: string, days?: number): Promise<Array<{
        date: string;
        inbound: number;
        outbound: number;
        netChange: number;
        runningStock: number;
    }>>;
}
export default InventoryService;
//# sourceMappingURL=InventoryService.d.ts.map