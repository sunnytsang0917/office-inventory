import { ItemModel, ItemData, ItemFilter, ItemWithInventory } from '../models/Item';
export declare class ItemService {
    private locationService;
    createItem(itemData: ItemData): Promise<ItemModel>;
    getItem(id: string): Promise<ItemModel>;
    getItemWithInventory(id: string): Promise<ItemWithInventory>;
    updateItem(id: string, itemData: Partial<ItemData>): Promise<ItemModel>;
    deleteItem(id: string): Promise<void>;
    listItems(filter?: ItemFilter): Promise<ItemModel[]>;
    getCategories(): Promise<string[]>;
    batchImportItems(items: ItemData[]): Promise<{
        success: number;
        failed: number;
        errors: Array<{
            index: number;
            error: string;
            data: ItemData;
        }>;
    }>;
}
export default ItemService;
//# sourceMappingURL=ItemService.d.ts.map