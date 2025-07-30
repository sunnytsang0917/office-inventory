import { z } from 'zod';
export declare const ItemSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    specification: z.ZodOptional<z.ZodString>;
    unit: z.ZodString;
    defaultLocationId: z.ZodOptional<z.ZodString>;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const CreateItemSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    specification: z.ZodOptional<z.ZodString>;
    unit: z.ZodString;
    defaultLocationId: z.ZodOptional<z.ZodString>;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const UpdateItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    specification: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodString>;
    defaultLocationId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lowStockThreshold: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, z.core.$strip>;
export interface ItemData {
    name: string;
    category: string;
    specification?: string;
    unit: string;
    defaultLocationId?: string;
    lowStockThreshold: number;
}
export interface ItemFilter {
    category?: string;
    search?: string;
    defaultLocationId?: string;
    hasDefaultLocation?: boolean;
}
export interface ItemWithInventory {
    id: string;
    name: string;
    category: string;
    specification?: string;
    unit: string;
    defaultLocationId?: string;
    defaultLocationName?: string;
    lowStockThreshold: number;
    totalStock: number;
    locationStocks: Array<{
        locationId: string;
        locationCode: string;
        locationName: string;
        stock: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ItemModel {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly specification?: string;
    readonly unit: string;
    readonly defaultLocationId?: string;
    readonly lowStockThreshold: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(data: {
        id: string;
        name: string;
        category: string;
        specification?: string;
        unit: string;
        defaultLocationId?: string;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
    });
    static fromDatabase(row: any): ItemModel;
    toJSON(): {
        id: string;
        name: string;
        category: string;
        specification: string | undefined;
        unit: string;
        defaultLocationId: string | undefined;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
    };
    static validate(data: any): ItemData;
    static validateUpdate(data: any): Partial<ItemData>;
    isLowStock(currentStock: number): boolean;
}
export default ItemModel;
//# sourceMappingURL=Item.d.ts.map