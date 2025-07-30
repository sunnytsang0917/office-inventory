import { Pool } from 'pg';
import LocationModel, { LocationData, LocationFilter, LocationInventory, LocationWithChildren } from '../models/Location';
export declare class LocationService {
    private db;
    constructor(database?: Pool);
    create(locationData: LocationData): Promise<LocationModel>;
    getById(id: string): Promise<LocationModel | null>;
    getByCode(code: string): Promise<LocationModel | null>;
    list(filter?: LocationFilter): Promise<LocationModel[]>;
    getHierarchy(includeInactive?: boolean): Promise<LocationWithChildren[]>;
    getChildren(parentId: string, includeInactive?: boolean): Promise<LocationModel[]>;
    getRootLocations(includeInactive?: boolean): Promise<LocationModel[]>;
    update(id: string, updateData: Partial<LocationData>): Promise<LocationModel>;
    delete(id: string): Promise<void>;
    getLocationInventory(locationId: string): Promise<LocationInventory[]>;
    setItemDefaultLocation(itemId: string, locationId: string): Promise<void>;
    getLocationPath(locationId: string): Promise<LocationModel[]>;
    getLocation(id: string): Promise<LocationModel>;
    batchUpdateStatus(locationIds: string[], isActive: boolean): Promise<void>;
}
export default LocationService;
//# sourceMappingURL=LocationService.d.ts.map