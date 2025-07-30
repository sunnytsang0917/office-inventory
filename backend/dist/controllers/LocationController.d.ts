import { Request, Response, NextFunction } from 'express';
export declare class LocationController {
    private locationService;
    constructor();
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHierarchy: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRootLocations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getByCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getChildren: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getInventory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    setItemDefaultLocation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPath: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    batchUpdateStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default LocationController;
//# sourceMappingURL=LocationController.d.ts.map