import { Request, Response, NextFunction } from 'express';
export declare class ItemController {
    private itemService;
    createItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    batchImportItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    downloadTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default ItemController;
//# sourceMappingURL=ItemController.d.ts.map