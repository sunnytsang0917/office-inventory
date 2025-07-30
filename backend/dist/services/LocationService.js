"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const database_1 = require("../config/database");
const Location_1 = __importDefault(require("../models/Location"));
class LocationService {
    constructor(database = database_1.pool) {
        this.db = database;
    }
    async create(locationData) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            let parentLocation;
            if (locationData.parentId) {
                const parentResult = await client.query('SELECT * FROM locations WHERE id = $1 AND is_active = true', [locationData.parentId]);
                if (parentResult.rows.length === 0) {
                    throw new Error('指定的父级位置不存在或已被禁用');
                }
                parentLocation = Location_1.default.fromDatabase(parentResult.rows[0]);
            }
            Location_1.default.validateHierarchy(locationData, parentLocation?.toJSON());
            const codeCheckResult = await client.query('SELECT id FROM locations WHERE code = $1', [locationData.code]);
            if (codeCheckResult.rows.length > 0) {
                throw new Error(`位置编码 "${locationData.code}" 已存在`);
            }
            const insertResult = await client.query(`INSERT INTO locations (code, name, description, parent_id, level, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                locationData.code,
                locationData.name,
                locationData.description,
                locationData.parentId,
                locationData.level,
                locationData.isActive
            ]);
            await client.query('COMMIT');
            return Location_1.default.fromDatabase(insertResult.rows[0]);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getById(id) {
        const result = await this.db.query('SELECT * FROM locations WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return Location_1.default.fromDatabase(result.rows[0]);
    }
    async getByCode(code) {
        const result = await this.db.query('SELECT * FROM locations WHERE code = $1', [code]);
        if (result.rows.length === 0) {
            return null;
        }
        return Location_1.default.fromDatabase(result.rows[0]);
    }
    async list(filter = {}) {
        let query = 'SELECT * FROM locations WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filter.parentId !== undefined) {
            if (filter.parentId === null || filter.parentId === '') {
                query += ' AND parent_id IS NULL';
            }
            else {
                query += ` AND parent_id = $${paramIndex}`;
                params.push(filter.parentId);
                paramIndex++;
            }
        }
        if (filter.level !== undefined) {
            query += ` AND level = $${paramIndex}`;
            params.push(filter.level);
            paramIndex++;
        }
        if (!filter.includeInactive) {
            query += ' AND is_active = true';
        }
        else if (filter.isActive !== undefined) {
            query += ` AND is_active = $${paramIndex}`;
            params.push(filter.isActive);
            paramIndex++;
        }
        if (filter.search) {
            query += ` AND (code ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
            params.push(`%${filter.search}%`);
            paramIndex++;
        }
        query += ' ORDER BY level ASC, code ASC';
        const result = await this.db.query(query, params);
        return result.rows.map(row => Location_1.default.fromDatabase(row));
    }
    async getHierarchy(includeInactive = false) {
        const locations = await this.list({ includeInactive });
        return Location_1.default.buildHierarchy(locations);
    }
    async getChildren(parentId, includeInactive = false) {
        return this.list({ parentId, includeInactive });
    }
    async getRootLocations(includeInactive = false) {
        return this.list({ parentId: '', includeInactive });
    }
    async update(id, updateData) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const currentResult = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
            if (currentResult.rows.length === 0) {
                throw new Error('位置不存在');
            }
            const currentLocation = Location_1.default.fromDatabase(currentResult.rows[0]);
            if (updateData.code && updateData.code !== currentLocation.code) {
                const codeCheckResult = await client.query('SELECT id FROM locations WHERE code = $1 AND id != $2', [updateData.code, id]);
                if (codeCheckResult.rows.length > 0) {
                    throw new Error(`位置编码 "${updateData.code}" 已存在`);
                }
            }
            if (updateData.parentId !== undefined || updateData.level !== undefined) {
                let parentLocation;
                const newParentId = updateData.parentId !== undefined ? updateData.parentId : currentLocation.parentId;
                if (newParentId) {
                    if (newParentId === id) {
                        throw new Error('不能将位置设置为自己的父级');
                    }
                    const allLocations = await this.list({ includeInactive: true });
                    const childrenIds = Location_1.default.getAllChildrenIds(id, allLocations);
                    if (childrenIds.includes(newParentId)) {
                        throw new Error('不能将位置设置为自己子级的父级，这会形成循环引用');
                    }
                    const parentResult = await client.query('SELECT * FROM locations WHERE id = $1', [newParentId]);
                    if (parentResult.rows.length === 0) {
                        throw new Error('指定的父级位置不存在');
                    }
                    parentLocation = Location_1.default.fromDatabase(parentResult.rows[0]);
                }
                const newLocationData = {
                    ...currentLocation.toJSON(),
                    ...updateData,
                };
                Location_1.default.validateHierarchy(newLocationData, parentLocation?.toJSON());
            }
            const updateFields = [];
            const updateParams = [];
            let paramIndex = 1;
            if (updateData.code !== undefined) {
                updateFields.push(`code = $${paramIndex}`);
                updateParams.push(updateData.code);
                paramIndex++;
            }
            if (updateData.name !== undefined) {
                updateFields.push(`name = $${paramIndex}`);
                updateParams.push(updateData.name);
                paramIndex++;
            }
            if (updateData.description !== undefined) {
                updateFields.push(`description = $${paramIndex}`);
                updateParams.push(updateData.description);
                paramIndex++;
            }
            if (updateData.parentId !== undefined) {
                updateFields.push(`parent_id = $${paramIndex}`);
                updateParams.push(updateData.parentId || null);
                paramIndex++;
            }
            if (updateData.level !== undefined) {
                updateFields.push(`level = $${paramIndex}`);
                updateParams.push(updateData.level);
                paramIndex++;
            }
            if (updateData.isActive !== undefined) {
                updateFields.push(`is_active = $${paramIndex}`);
                updateParams.push(updateData.isActive);
                paramIndex++;
            }
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateParams.push(id);
            const updateQuery = `
        UPDATE locations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
            const updateResult = await client.query(updateQuery, updateParams);
            await client.query('COMMIT');
            return Location_1.default.fromDatabase(updateResult.rows[0]);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async delete(id) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const locationResult = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
            if (locationResult.rows.length === 0) {
                throw new Error('位置不存在');
            }
            const childrenResult = await client.query('SELECT COUNT(*) as count FROM locations WHERE parent_id = $1', [id]);
            if (parseInt(childrenResult.rows[0].count) > 0) {
                throw new Error('不能删除有子级位置的位置，请先删除或移动子级位置');
            }
            const inventoryResult = await client.query('SELECT COUNT(*) as count FROM transactions WHERE location_id = $1', [id]);
            if (parseInt(inventoryResult.rows[0].count) > 0) {
                throw new Error('不能删除有库存记录的位置');
            }
            const itemsResult = await client.query('SELECT COUNT(*) as count FROM items WHERE default_location_id = $1', [id]);
            if (parseInt(itemsResult.rows[0].count) > 0) {
                throw new Error('不能删除被物品设置为默认位置的位置');
            }
            await client.query('DELETE FROM locations WHERE id = $1', [id]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getLocationInventory(locationId) {
        const query = `
      SELECT 
        iv.location_id,
        iv.location_code,
        iv.location_name,
        iv.item_id,
        iv.item_name,
        iv.current_stock,
        iv.last_transaction_date
      FROM inventory_view iv
      WHERE iv.location_id = $1 AND iv.current_stock > 0
      ORDER BY iv.item_name ASC
    `;
        const result = await this.db.query(query, [locationId]);
        return result.rows.map(row => ({
            locationId: row.location_id,
            locationCode: row.location_code,
            locationName: row.location_name,
            itemId: row.item_id,
            itemName: row.item_name,
            currentStock: row.current_stock,
            lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined,
        }));
    }
    async setItemDefaultLocation(itemId, locationId) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const locationResult = await client.query('SELECT * FROM locations WHERE id = $1 AND is_active = true', [locationId]);
            if (locationResult.rows.length === 0) {
                throw new Error('指定的位置不存在或已被禁用');
            }
            const itemResult = await client.query('SELECT * FROM items WHERE id = $1', [itemId]);
            if (itemResult.rows.length === 0) {
                throw new Error('指定的物品不存在');
            }
            await client.query('UPDATE items SET default_location_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [locationId, itemId]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getLocationPath(locationId) {
        const query = `
      WITH RECURSIVE location_path AS (
        -- 起始位置
        SELECT id, code, name, description, parent_id, level, is_active, created_at, updated_at, 0 as depth
        FROM locations 
        WHERE id = $1
        
        UNION ALL
        
        -- 递归查找父级
        SELECT l.id, l.code, l.name, l.description, l.parent_id, l.level, l.is_active, l.created_at, l.updated_at, lp.depth + 1
        FROM locations l
        INNER JOIN location_path lp ON l.id = lp.parent_id
      )
      SELECT * FROM location_path 
      ORDER BY depth DESC
    `;
        const result = await this.db.query(query, [locationId]);
        return result.rows.map(row => Location_1.default.fromDatabase(row));
    }
    async getLocation(id) {
        const location = await this.getById(id);
        if (!location) {
            throw new Error('位置不存在');
        }
        return location;
    }
    async batchUpdateStatus(locationIds, isActive) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            if (!isActive) {
                const inventoryResult = await client.query('SELECT COUNT(*) as count FROM transactions WHERE location_id = ANY($1)', [locationIds]);
                if (parseInt(inventoryResult.rows[0].count) > 0) {
                    throw new Error('不能禁用有库存记录的位置');
                }
            }
            await client.query('UPDATE locations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)', [isActive, locationIds]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.LocationService = LocationService;
exports.default = LocationService;
//# sourceMappingURL=LocationService.js.map