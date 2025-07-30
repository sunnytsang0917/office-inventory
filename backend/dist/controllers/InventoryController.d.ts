import { Request, Response } from 'express';
export declare class InventoryController {
    private inventoryService;
    getInventoryStatus: (req: Request, res: Response) => Promise<void>;
    getItemInventory: (req: Request, res: Response) => Promise<void>;
    searchInventory: (req: Request, res: Response) => Promise<void>;
    getLowStockItems: (req: Request, res: Response) => Promise<void>;
    getLocationInventorySummary: (req: Request, res: Response) => Promise<void>;
    getInventoryStatistics: (req: Request, res: Response) => Promise<void>;
    getInventoryHistory: (req: Request, res: Response) => Promise<void>;
    getInventoryOverview: (req: Request, res: Response) => Promise<void>;
    checkStockAvailability: (req: Request, res: Response) => Promise<void>;
}
export default InventoryController;
//# sourceMappingURL=InventoryController.d.ts.map