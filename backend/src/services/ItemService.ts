import { pool } from '../config/database';
import { ItemModel, ItemData, ItemFilter, ItemWithInventory } from '../models/Item';
import { LocationService } from './LocationService';

export class ItemService {
  private locationService = new LocationService();

  // 创建物品
  async createItem(itemData: ItemData): Promise<ItemModel> {
    const client = await pool.connect();
    try {
      // 验证默认位置是否存在
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
      return ItemModel.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // 获取物品详情
  async getItem(id: string): Promise<ItemModel> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM items WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('物品不存在');
      }

      return ItemModel.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // 获取物品详情（包含库存信息）
  async getItemWithInventory(id: string): Promise<ItemWithInventory> {
    const client = await pool.connect();
    try {
      // 获取物品基本信息
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

      // 获取库存信息
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
    } finally {
      client.release();
    }
  }

  // 更新物品
  async updateItem(id: string, itemData: Partial<ItemData>): Promise<ItemModel> {
    const client = await pool.connect();
    try {
      // 验证物品是否存在
      await this.getItem(id);

      // 验证默认位置是否存在
      if (itemData.defaultLocationId) {
        await this.locationService.getLocation(itemData.defaultLocationId);
      }

      const updateFields: string[] = [];
      const values: any[] = [];
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
      return ItemModel.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // 删除物品
  async deleteItem(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      // 验证物品是否存在
      await this.getItem(id);

      // 检查是否有库存记录
      const inventoryQuery = `
        SELECT COUNT(*) as count 
        FROM inventory_view 
        WHERE item_id = $1 AND current_stock > 0
      `;
      const inventoryResult = await client.query(inventoryQuery, [id]);
      
      if (parseInt(inventoryResult.rows[0].count) > 0) {
        throw new Error('无法删除有库存记录的物品');
      }

      // 检查是否有交易记录
      const transactionQuery = 'SELECT COUNT(*) as count FROM transactions WHERE item_id = $1';
      const transactionResult = await client.query(transactionQuery, [id]);
      
      if (parseInt(transactionResult.rows[0].count) > 0) {
        throw new Error('无法删除有交易记录的物品');
      }

      const deleteQuery = 'DELETE FROM items WHERE id = $1';
      await client.query(deleteQuery, [id]);
    } finally {
      client.release();
    }
  }

  // 获取物品列表
  async listItems(filter?: ItemFilter): Promise<ItemModel[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM items WHERE 1=1';
      const values: any[] = [];
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
        } else {
          query += ` AND default_location_id IS NULL`;
        }
      }

      query += ' ORDER BY name';

      const result = await client.query(query, values);
      return result.rows.map(row => ItemModel.fromDatabase(row));
    } finally {
      client.release();
    }
  }

  // 获取物品分类列表
  async getCategories(): Promise<string[]> {
    const client = await pool.connect();
    try {
      const query = 'SELECT DISTINCT category FROM items ORDER BY category';
      const result = await client.query(query);
      return result.rows.map(row => row.category);
    } finally {
      client.release();
    }
  }

  // 批量导入物品
  async batchImportItems(items: ItemData[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string; data: ItemData }>;
  }> {
    const client = await pool.connect();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string; data: ItemData }>
    };

    try {
      await client.query('BEGIN');

      for (let i = 0; i < items.length; i++) {
        try {
          // 验证数据
          const validatedData = ItemModel.validate(items[i]);
          
          // 验证默认位置是否存在
          if (validatedData.defaultLocationId) {
            await this.locationService.getLocation(validatedData.defaultLocationId);
          }

          // 检查是否已存在同名物品
          const existingQuery = 'SELECT id FROM items WHERE name = $1 AND category = $2';
          const existingResult = await client.query(existingQuery, [validatedData.name, validatedData.category]);
          
          if (existingResult.rows.length > 0) {
            throw new Error('物品已存在');
          }

          // 插入物品
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
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error instanceof Error ? error.message : '未知错误',
            data: items[i]
          });
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }
}

export default ItemService;