"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemService = void 0;
const database_1 = require("../config/database");
const Item_1 = require("../models/Item");
const LocationService_1 = require("./LocationService");
class ItemService {
    constructor() {
        this.locationService = new LocationService_1.LocationService();
    }
    async createItem(itemData) {
        const client = await database_1.pool.connect();
        try {
            if (itemData.defaultLocationId) {
                await this.locationService.getLocation(itemData.defaultLocationId);
            }
            const query = `
        INSERT INTO items (name, category, specification, unit, default_location_id, low_stock_threshold)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
            const values = [
                itemData.name,
                itemData.category,
                itemData.specification || null,
                itemData.unit,
                itemData.defaultLocationId || null,
                itemData.lowStockThreshold
            ];
            const result = await client.query(query, values);
            return Item_1.ItemModel.fromDatabase(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async getItem(id) {
        const client = await database_1.pool.connect();
        try {
            const query = 'SELECT * FROM items WHERE id = $1';
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                throw new Error('物品不存在');
            }
            return Item_1.ItemModel.fromDatabase(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async getItemWithInventory(id) {
        const client = await database_1.pool.connect();
        try {
            const itemQuery = `
        SELECT i.*, l.name as default_location_name 
        FROM items i
        LEFT JOIN locations l ON i.default_location_id = l.id
        WHERE i.id = $1
      `;
            const itemResult = await client.query(itemQuery, [id]);
            if (itemResult.rows.length === 0) {
                throw new Error('物品不存在');
            }
            const item = itemResult.rows[0];
            const inventoryQuery = `
        SELECT 
          location_id,
          location_code,
          location_name,
          current_stock as stock
        FROM inventory_view 
        WHERE item_id = $1 AND current_stock > 0
        ORDER BY location_code
      `;
            const inventoryResult = await client.query(inventoryQuery, [id]);
            const totalStock = inventoryResult.rows.reduce((sum, row) => sum + row.stock, 0);
            return {
                id: item.id,
                name: item.name,
                category: item.category,
                specification: item.specification,
                unit: item.unit,
                defaultLocationId: item.default_location_id,
                defaultLocationName: item.default_location_name,
                lowStockThreshold: item.low_stock_threshold,
                totalStock,
                locationStocks: inventoryResult.rows.map(row => ({
                    locationId: row.location_id,
                    locationCode: row.location_code,
                    locationName: row.location_name,
                    stock: row.stock
                })),
                createdAt: new Date(item.created_at),
                updatedAt: new Date(item.updated_at)
            };
        }
        finally {
            client.release();
        }
    }
    async updateItem(id, itemData) {
        const client = await database_1.pool.connect();
        try {
            await this.getItem(id);
            if (itemData.defaultLocationId) {
                await this.locationService.getLocation(itemData.defaultLocationId);
            }
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            if (itemData.name !== undefined) {
                updateFields.push(`name = $${paramIndex++}`);
                values.push(itemData.name);
            }
            if (itemData.category !== undefined) {
                updateFields.push(`category = $${paramIndex++}`);
                values.push(itemData.category);
            }
            if (itemData.specification !== undefined) {
                updateFields.push(`specification = $${paramIndex++}`);
                values.push(itemData.specification);
            }
            if (itemData.unit !== undefined) {
                updateFields.push(`unit = $${paramIndex++}`);
                values.push(itemData.unit);
            }
            if (itemData.defaultLocationId !== undefined) {
                updateFields.push(`default_location_id = $${paramIndex++}`);
                values.push(itemData.defaultLocationId);
            }
            if (itemData.lowStockThreshold !== undefined) {
                updateFields.push(`low_stock_threshold = $${paramIndex++}`);
                values.push(itemData.lowStockThreshold);
            }
            if (updateFields.length === 0) {
                return await this.getItem(id);
            }
            values.push(id);
            const query = `
        UPDATE items 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(query, values);
            return Item_1.ItemModel.fromDatabase(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async deleteItem(id) {
        const client = await database_1.pool.connect();
        try {
            await this.getItem(id);
            const inventoryQuery = `
        SELECT COUNT(*) as count 
        FROM inventory_view 
        WHERE item_id = $1 AND current_stock > 0
      `;
            const inventoryResult = await client.query(inventoryQuery, [id]);
            if (parseInt(inventoryResult.rows[0].count) > 0) {
                throw new Error('无法删除有库存记录的物品');
            }
            const transactionQuery = 'SELECT COUNT(*) as count FROM transactions WHERE item_id = $1';
            const transactionResult = await client.query(transactionQuery, [id]);
            if (parseInt(transactionResult.rows[0].count) > 0) {
                throw new Error('无法删除有交易记录的物品');
            }
            const deleteQuery = 'DELETE FROM items WHERE id = $1';
            await client.query(deleteQuery, [id]);
        }
        finally {
            client.release();
        }
    }
    async listItems(filter) {
        const client = await database_1.pool.connect();
        try {
            let query = 'SELECT * FROM items WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            if (filter?.category) {
                query += ` AND category = $${paramIndex++}`;
                values.push(filter.category);
            }
            if (filter?.search) {
                query += ` AND (name ILIKE $${paramIndex++} OR specification ILIKE $${paramIndex++})`;
                values.push(`%${filter.search}%`, `%${filter.search}%`);
                paramIndex++;
            }
            if (filter?.defaultLocationId) {
                query += ` AND default_location_id = $${paramIndex++}`;
                values.push(filter.defaultLocationId);
            }
            if (filter?.hasDefaultLocation !== undefined) {
                if (filter.hasDefaultLocation) {
                    query += ` AND default_location_id IS NOT NULL`;
                }
                else {
                    query += ` AND default_location_id IS NULL`;
                }
            }
            query += ' ORDER BY name';
            const result = await client.query(query, values);
            return result.rows.map(row => Item_1.ItemModel.fromDatabase(row));
        }
        finally {
            client.release();
        }
    }
    async getCategories() {
        const client = await database_1.pool.connect();
        try {
            const query = 'SELECT DISTINCT category FROM items ORDER BY category';
            const result = await client.query(query);
            return result.rows.map(row => row.category);
        }
        finally {
            client.release();
        }
    }
    async batchImportItems(items) {
        const client = await database_1.pool.connect();
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        try {
            await client.query('BEGIN');
            for (let i = 0; i < items.length; i++) {
                try {
                    const validatedData = Item_1.ItemModel.validate(items[i]);
                    if (validatedData.defaultLocationId) {
                        await this.locationService.getLocation(validatedData.defaultLocationId);
                    }
                    const existingQuery = 'SELECT id FROM items WHERE name = $1 AND category = $2';
                    const existingResult = await client.query(existingQuery, [validatedData.name, validatedData.category]);
                    if (existingResult.rows.length > 0) {
                        throw new Error('物品已存在');
                    }
                    const insertQuery = `
            INSERT INTO items (name, category, specification, unit, default_location_id, low_stock_threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
                    const values = [
                        validatedData.name,
                        validatedData.category,
                        validatedData.specification || null,
                        validatedData.unit,
                        validatedData.defaultLocationId || null,
                        validatedData.lowStockThreshold
                    ];
                    await client.query(insertQuery, values);
                    results.success++;
                }
                catch (error) {
                    results.failed++;
                    results.errors.push({
                        index: i,
                        error: error instanceof Error ? error.message : '未知错误',
                        data: items[i]
                    });
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        return results;
    }
}
exports.ItemService = ItemService;
exports.default = ItemService;
//# sourceMappingURL=ItemService.js.map