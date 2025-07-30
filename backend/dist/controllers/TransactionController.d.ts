import { Request, Response, NextFunction } from 'express';
export declare class TransactionController {
    private transactionService;
    createTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createInboundTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createOutboundTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createBatchTransactions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    batchInbound: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    batchOutbound: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTransactionHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTransactionStatistics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    downloadInboundTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    downloadOutboundTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default TransactionController;
//# sourceMappingURL=TransactionController.d.ts.map