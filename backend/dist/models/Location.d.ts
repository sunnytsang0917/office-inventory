import { z } from 'zod';
export declare const LocationCreateSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    level: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const LocationUpdateSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    level: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const LocationQuerySchema: z.ZodObject<{
    parentId: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    includeInactive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export interface LocationData {
    id?: string;
    code: string;
    name: string;
    description?: string;
    parentId?: string;
    level: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface LocationWithChildren extends LocationData {
    children?: LocationWithChildren[];
}
export interface LocationInventory {
    locationId: string;
    locationCode: string;
    locationName: string;
    itemId: string;
    itemName: string;
    currentStock: number;
    lastTransactionDate?: Date;
}
export interface LocationFilter {
    parentId?: string;
    level?: number;
    isActive?: boolean;
    includeInactive?: boolean;
    search?: string;
}
export declare class LocationModel {
    private data;
    constructor(data: LocationData);
    static validateCreate(data: unknown): LocationData;
    static validateUpdate(data: unknown): Partial<LocationData>;
    static validateQuery(data: unknown): LocationFilter;
    get id(): string | undefined;
    get code(): string;
    get name(): string;
    get description(): string | undefined;
    get parentId(): string | undefined;
    get level(): number;
    get isActive(): boolean;
    get createdAt(): Date | undefined;
    get updatedAt(): Date | undefined;
    isRoot(): boolean;
    canHaveChildren(): boolean;
    getFullPath(): string;
    static validateHierarchy(location: LocationData, parentLocation?: LocationData): void;
    update(updateData: Partial<LocationData>): void;
    toJSON(): LocationData;
    static fromDatabase(dbData: any): LocationModel;
    toDatabaseFormat(): any;
    static buildHierarchy(locations: LocationModel[]): LocationWithChildren[];
    static getAllChildrenIds(locationId: string, locations: LocationModel[]): string[];
}
export default LocationModel;
//# sourceMappingURL=Location.d.ts.map