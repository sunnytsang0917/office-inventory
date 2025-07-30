import { Pool } from 'pg';
import { pool } from '../config/database';
import LocationModel, { LocationData, LocationFilter, LocationInventory, LocationWithChildren } from '../models/Location';

export class LocationService {
  private db: Pool;

  constructor(database: Pool = pool) {
    this.db = database;
  }

  // 创建位置
  async create(locationData: LocationData): Promise<LocationModel> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 验证父级位置（如果指定）
      let parentLocation: LocationModel | undefined;
      if (locationData.parentId) {
        const parentResult = await client.query(
          'SELECT * FROM locations WHERE id = $1 AND is_active = true',
          [locationData.parentId]
        );
        
        if (parentResult.rows.length === 0) {
          throw new Error('指定的父级位置不存在或已被禁用');
        }
        
        parentLocation = LocationModel.fromDatabase(parentResult.rows[0]);
      }

      // 验证层级结构
      LocationModel.validateHierarchy(locationData, parentLocation?.toJSON());

      // 检查位置编码是否已存在
      const codeCheckResult = await client.query(
        'SELECT id FROM locations WHERE code = $1',
        [locationData.code]
      );
      
      if (codeCheckResult.rows.length > 0) {
        throw new Error(`位置编码 "${locationData.code}" 已存在`);
      }

      // 插入新位置
      const insertResult = await client.query(
        `INSERT INTO locations (code, name, description, parent_id, level, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          locationData.code,
          locationData.name,
          locationData.description,
          locationData.parentId,
          locationData.level,
          locationData.isActive
        ]
      );

      await client.query('COMMIT');
      
      return LocationModel.fromDatabase(insertResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 根据ID获取位置
  async getById(id: string): Promise<LocationModel | null> {
    const result = await this.db.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return LocationModel.fromDatabase(result.rows[0]);
  }

  // 根据编码获取位置
  async getByCode(code: string): Promise<LocationModel | null> {
    const result = await this.db.query(
      'SELECT * FROM locations WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return LocationModel.fromDatabase(result.rows[0]);
  }

  // 获取位置列表
  async list(filter: LocationFilter = {}): Promise<LocationModel[]> {
    let query = 'SELECT * FROM locations WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // 添加过滤条件
    if (filter.parentId !== undefined) {
      if (filter.parentId === null || filter.parentId === '') {
        query += ' AND parent_id IS NULL';
      } else {
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
    } else if (filter.isActive !== undefined) {
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
    return result.rows.map(row => LocationModel.fromDatabase(row));
  }

  // 获取层级结构
  async getHierarchy(includeInactive: boolean = false): Promise<LocationWithChildren[]> {
    const locations = await this.list({ includeInactive });
    return LocationModel.buildHierarchy(locations);
  }

  // 获取子级位置
  async getChildren(parentId: string, includeInactive: boolean = false): Promise<LocationModel[]> {
    return this.list({ parentId, includeInactive });
  }

  // 获取根级位置
  async getRootLocations(includeInactive: boolean = false): Promise<LocationModel[]> {
    return this.list({ parentId: '', includeInactive });
  }

  // 更新位置
  async update(id: string, updateData: Partial<LocationData>): Promise<LocationModel> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 获取当前位置
      const currentResult = await client.query(
        'SELECT * FROM locations WHERE id = $1',
        [id]
      );
      
      if (currentResult.rows.length === 0) {
        throw new Error('位置不存在');
      }

      const currentLocation = LocationModel.fromDatabase(currentResult.rows[0]);

      // 如果更新编码，检查是否重复
      if (updateData.code && updateData.code !== currentLocation.code) {
        const codeCheckResult = await client.query(
          'SELECT id FROM locations WHERE code = $1 AND id != $2',
          [updateData.code, id]
        );
        
        if (codeCheckResult.rows.length > 0) {
          throw new Error(`位置编码 "${updateData.code}" 已存在`);
        }
      }

      // 如果更新父级位置或层级，验证层级结构
      if (updateData.parentId !== undefined || updateData.level !== undefined) {
        let parentLocation: LocationModel | undefined;
        const newParentId = updateData.parentId !== undefined ? updateData.parentId : currentLocation.parentId;
        
        if (newParentId) {
          // 检查不能将位置设置为自己的子级
          if (newParentId === id) {
            throw new Error('不能将位置设置为自己的父级');
          }

          // 检查不能形成循环引用
          const allLocations = await this.list({ includeInactive: true });
          const childrenIds = LocationModel.getAllChildrenIds(id, allLocations);
          if (childrenIds.includes(newParentId)) {
            throw new Error('不能将位置设置为自己子级的父级，这会形成循环引用');
          }

          const parentResult = await client.query(
            'SELECT * FROM locations WHERE id = $1',
            [newParentId]
          );
          
          if (parentResult.rows.length === 0) {
            throw new Error('指定的父级位置不存在');
          }
          
          parentLocation = LocationModel.fromDatabase(parentResult.rows[0]);
        }

        // 构建新的位置数据进行验证
        const newLocationData = {
          ...currentLocation.toJSON(),
          ...updateData,
        };

        LocationModel.validateHierarchy(newLocationData, parentLocation?.toJSON());
      }

      // 构建更新查询
      const updateFields: string[] = [];
      const updateParams: any[] = [];
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
      
      return LocationModel.fromDatabase(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 删除位置
  async delete(id: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 检查位置是否存在
      const locationResult = await client.query(
        'SELECT * FROM locations WHERE id = $1',
        [id]
      );
      
      if (locationResult.rows.length === 0) {
        throw new Error('位置不存在');
      }

      // 检查是否有子级位置
      const childrenResult = await client.query(
        'SELECT COUNT(*) as count FROM locations WHERE parent_id = $1',
        [id]
      );
      
      if (parseInt(childrenResult.rows[0].count) > 0) {
        throw new Error('不能删除有子级位置的位置，请先删除或移动子级位置');
      }

      // 检查是否有库存记录
      const inventoryResult = await client.query(
        'SELECT COUNT(*) as count FROM transactions WHERE location_id = $1',
        [id]
      );
      
      if (parseInt(inventoryResult.rows[0].count) > 0) {
        throw new Error('不能删除有库存记录的位置');
      }

      // 检查是否有物品使用此位置作为默认位置
      const itemsResult = await client.query(
        'SELECT COUNT(*) as count FROM items WHERE default_location_id = $1',
        [id]
      );
      
      if (parseInt(itemsResult.rows[0].count) > 0) {
        throw new Error('不能删除被物品设置为默认位置的位置');
      }

      // 删除位置
      await client.query('DELETE FROM locations WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 获取位置库存信息
  async getLocationInventory(locationId: string): Promise<LocationInventory[]> {
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

  // 设置物品的默认位置
  async setItemDefaultLocation(itemId: string, locationId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 检查位置是否存在且激活
      const locationResult = await client.query(
        'SELECT * FROM locations WHERE id = $1 AND is_active = true',
        [locationId]
      );
      
      if (locationResult.rows.length === 0) {
        throw new Error('指定的位置不存在或已被禁用');
      }

      // 检查物品是否存在
      const itemResult = await client.query(
        'SELECT * FROM items WHERE id = $1',
        [itemId]
      );
      
      if (itemResult.rows.length === 0) {
        throw new Error('指定的物品不存在');
      }

      // 更新物品的默认位置
      await client.query(
        'UPDATE items SET default_location_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [locationId, itemId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 获取位置路径（从根到当前位置）
  async getLocationPath(locationId: string): Promise<LocationModel[]> {
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
    return result.rows.map(row => LocationModel.fromDatabase(row));
  }

  // 获取位置（别名方法，用于兼容）
  async getLocation(id: string): Promise<LocationModel> {
    const location = await this.getById(id);
    if (!location) {
      throw new Error('位置不存在');
    }
    return location;
  }

  // 批量更新位置状态
  async batchUpdateStatus(locationIds: string[], isActive: boolean): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 如果要禁用位置，检查是否有库存
      if (!isActive) {
        const inventoryResult = await client.query(
          'SELECT COUNT(*) as count FROM transactions WHERE location_id = ANY($1)',
          [locationIds]
        );
        
        if (parseInt(inventoryResult.rows[0].count) > 0) {
          throw new Error('不能禁用有库存记录的位置');
        }
      }

      // 批量更新状态
      await client.query(
        'UPDATE locations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
        [isActive, locationIds]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default LocationService;