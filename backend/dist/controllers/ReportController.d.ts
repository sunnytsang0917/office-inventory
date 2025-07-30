import { Request, Response } from 'express';
export declare class ReportController {
    private reportService;
    getMonthlyStats: (req: Request, res: Response) => Promise<void>;
    getItemUsageRanking: (req: Request, res: Response) => Promise<void>;
    getInventoryStatus: (req: Request, res: Response) => Promise<void>;
    getTransactionHistory: (req: Request, res: Response) => Promise<void>;
    getCustomRangeStats: (req: Request, res: Response) => Promise<void>;
    exportMonthlyStats: (req: Request, res: Response) => Promise<void>;
    exportItemUsageRanking: (req: Request, res: Response) => Promise<void>;
    exportInventoryStatus: (req: Request, res: Response) => Promise<void>;
    exportTransactionHistory: (req: Request, res: Response) => Promise<void>;
    getAvailableReports: (req: Request, res: Response) => Promise<void>;
    exportReport: (req: Request, res: Response) => Promise<void>;
}
export default ReportController;
//# sourceMappingURL=ReportController.d.ts.map