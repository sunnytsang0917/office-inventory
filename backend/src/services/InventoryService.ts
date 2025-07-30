import { pool } from '../config/database';
import { ItemService } from './ItemService';
import { LocationService } from './LocationService';
import { TransactionService } from './TransactionService';

// 库存状态接口
export interface InventoryStatus {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  currentStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastTransactionDate?: Date;
}

// 库存详情接口
export interface InventoryDetail {
  itemId: string;
  itemName: string;
  category: string;
  specification?: string;
  unit: string;
  lowStockThreshold: number;
  totalStock: number;
  locationStocks: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    stock: number;
    isLowStock: boolean;
    lastTransactionDate?: Date;
  }>;
  recentTransactions: Array<{
    id: string;
    type: 'inbound' | 'outbound';
    quantity: number;
    date: Date;
    operator: string;
    locationName: string;
    locationCode: string;
    supplier?: string;
    recipient?: string;
    purpose?: string;
  }>;
}

// 库存搜索过滤器
export interface InventoryFilter {
  search?: string;
  category?: string;
  locationId?: string;
  isLowStock?: boolean;
  hasStock?: boolean;
  minStock?: number;
  maxStock?: number;
}

// 低库存预警项
export interface LowStockAlert {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  currentStock: number;
  lowStockThreshold: number;
  stockDeficit: number; // 缺货数量
  lastTransactionDate?: Date;
}

export class InventoryService {
  private itemService = new ItemService();
  private locationService = new LocationService();
  private transactionService = new TransactionService();

  // 获取库存总览状态
  async getInventoryStatus(filter?: InventoryFilter): Promise<InventoryStatus[]> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE iv.current_stock >= 0';
      const values: any[] = [];
      let paramIndex = 1;

      // 构建筛选条件
      if (filter?.search) {
        whereClause += ` AND (iv.item_name ILIKE $${paramIndex} OR iv.category ILIKE $${paramIndex + 1} OR iv.location_name ILIKE $${paramIndex + 2})`;
        const searchPattern = `%${filter.search}%`;
        values.push(searchPattern, searchPattern, searchPattern);
        paramIndex += 3;
      }

      if (filter?.category) {
        whereClause += ` AND iv.category = $${paramIndex++}`;
        values.push(filter.category);
      }

      if (filter?.locationId) {
        whereClause += ` AND iv.location_id = $${paramIndex++}`;
        values.push(filter.locationId);
      }

      if (filter?.hasStock !== undefined) {
        if (filter.hasStock) {
          whereClause += ` AND iv.current_stock > 0`;
        } else {
          whereClause += ` AND iv.current_stock = 0`;
        }
      }

      if (filter?.minStock !== undefined) {
        whereClause += ` AND iv.current_stock >= $${paramIndex++}`;
        values.push(filter.minStock);
      }

      if (filter?.maxStock !== undefined) {
        whereClause += ` AND iv.current_stock <= $${paramIndex++}`;
        values.push(filter.maxStock);
      }

      const query = `
        SELECT 
          iv.item_id,
          iv.item_name,
          iv.category,
          iv.unit,
          iv.location_id,
          iv.location_code,
          iv.location_name,
          iv.current_stock,
          i.low_stock_threshold,
          iv.last_transaction_date
        FROM inventory_view iv
        JOIN items i ON iv.item_id = i.id
        ${whereClause}
        ORDER BY iv.item_name, iv.location_code
      `;

      const result = await client.query(query, values);

      const inventoryStatus: InventoryStatus[] = result.rows.map(row => ({
        itemId: row.item_id,
        itemName: row.item_name,
        category: row.category,
        unit: row.unit,
        locationId: row.location_id,
        locationCode: row.location_code,
        locationName: row.location_name,
        currentStock: row.current_stock,
        lowStockThreshold: row.low_stock_threshold,
        isLowStock: row.current_stock <= row.low_stock_threshold,
        lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined
      }));

      // 如果筛选低库存，进一步过滤
      if (filter?.isLowStock !== undefined) {
        return inventoryStatus.filter(item => 
          filter.isLowStock ? item.isLowStock : !item.isLowStock
        );
      }

      return inventoryStatus;
    } finally {
      client.release();
    }
  }

  // 获取物品库存详情
  async getItemInventory(itemId: string): Promise<InventoryDetail> {
    const client = await pool.connect();
    try {
      // 验证物品是否存在
      const item = await this.itemService.getItem(itemId);

      // 获取物品在各位置的库存信息
      const inventoryQuery = `
        SELECT 
          iv.location_id,
          iv.location_code,
          iv.location_name,
          iv.current_stock,
          iv.last_transaction_date
        FROM inventory_view iv
        WHERE iv.item_id = $1 AND iv.current_stock >= 0
        ORDER BY iv.location_code
      `;

      const inventoryResult = await client.query(inventoryQuery, [itemId]);

      // 获取最近的交易记录
      const transactionsQuery = `
        SELECT 
          t.id,
          t.type,
          t.quantity,
          t.date,
          t.operator,
          t.supplier,
          t.recipient,
          t.purpose,
          l.name as location_name,
          l.code as location_code
        FROM transactions t
        JOIN locations l ON t.location_id = l.id
        WHERE t.item_id = $1
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT 20
      `;

      const transactionsResult = await client.query(transactionsQuery, [itemId]);

      const totalStock = inventoryResult.rows.reduce((sum, row) => sum + row.current_stock, 0);

      const locationStocks = inventoryResult.rows.map(row => ({
        locationId: row.location_id,
        locationCode: row.location_code,
        locationName: row.location_name,
        stock: row.current_stock,
        isLowStock: row.current_stock <= item.lowStockThreshold,
        lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined
      }));

      const recentTransactions = transactionsResult.rows.map(row => ({
        id: row.id,
        type: row.type as 'inbound' | 'outbound',
        quantity: row.quantity,
        date: new Date(row.date),
        operator: row.operator,
        locationName: row.location_name,
        locationCode: row.location_code,
        supplier: row.supplier,
        recipient: row.recipient,
        purpose: row.purpose
      }));

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        lowStockThreshold: item.lowStockThreshold,
        totalStock,
        locationStocks,
        recentTransactions
      };
    } finally {
      client.release();
    }
  }

  // 搜索库存
  async searchInventory(query: string): Promise<InventoryStatus[]> {
    return this.getInventoryStatus({ search: query });
  }

  // 获取低库存预警列表
  async getLowStockItems(threshold?: number): Promise<LowStockAlert[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          iv.item_id,
          iv.item_name,
          iv.category,
          iv.unit,
          iv.location_id,
          iv.location_code,
          iv.location_name,
          iv.current_stock,
          i.low_stock_threshold,
          iv.last_transaction_date
        FROM inventory_view iv
        JOIN items i ON iv.item_id = i.id
        WHERE iv.current_stock <= COALESCE($1, i.low_stock_threshold)
          AND i.low_stock_threshold > 0
        ORDER BY 
          (i.low_stock_threshold - iv.current_stock) DESC,
          iv.item_name,
          iv.location_code
      `;

      const result = await client.query(query, [threshold]);

      return result.rows.map(row => ({
        itemId: row.item_id,
        itemName: row.item_name,
        category: row.category,
        unit: row.unit,
        locationId: row.location_id,
        locationCode: row.location_code,
        locationName: row.location_name,
        currentStock: row.current_stock,
        lowStockThreshold: row.low_stock_threshold,
        stockDeficit: Math.max(0, row.low_stock_threshold - row.current_stock),
        lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined
      }));
    } finally {
      client.release();
    }
  }

  // 获取位置库存汇总
  async getLocationInventorySummary(locationId: string): Promise<{
    locationInfo: {
      id: string;
      code: string;
      name: string;
      description?: string;
    };
    totalItems: number;
    totalStock: number;
    lowStockItems: number;
    items: Array<{
      itemId: string;
      itemName: string;
      category: string;
      unit: string;
      currentStock: number;
      lowStockThreshold: number;
      isLowStock: boolean;
      lastTransactionDate?: Date;
    }>;
  }> {
    const client = await pool.connect();
    try {
      // 验证位置是否存在
      const location = await this.locationService.getLocation(locationId);

      // 获取该位置的所有库存信息
      const inventoryQuery = `
        SELECT 
          iv.item_id,
          iv.item_name,
          iv.category,
          iv.unit,
          iv.current_stock,
          i.low_stock_threshold,
          iv.last_transaction_date
        FROM inventory_view iv
        JOIN items i ON iv.item_id = i.id
        WHERE iv.location_id = $1 AND iv.current_stock > 0
        ORDER BY iv.item_name
      `;

      const result = await client.query(inventoryQuery, [locationId]);

      const items = result.rows.map(row => ({
        itemId: row.item_id,
        itemName: row.item_name,
        category: row.category,
        unit: row.unit,
        currentStock: row.current_stock,
        lowStockThreshold: row.low_stock_threshold,
        isLowStock: row.current_stock <= row.low_stock_threshold,
        lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined
      }));

      const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
      const lowStockItems = items.filter(item => item.isLowStock).length;

      return {
        locationInfo: {
          id: location.id!,
          code: location.code,
          name: location.name,
          description: location.description
        },
        totalItems: items.length,
        totalStock,
        lowStockItems,
        items
      };
    } finally {
      client.release();
    }
  }

  // 获取库存统计信息
  async getInventoryStatistics(): Promise<{
    totalItems: number;
    totalLocations: number;
    totalStock: number;
    lowStockAlerts: number;
    zeroStockItems: number;
    topCategories: Array<{
      category: string;
      itemCount: number;
      totalStock: number;
    }>;
    topLocations: Array<{
      locationId: string;
      locationCode: string;
      locationName: string;
      itemCount: number;
      totalStock: number;
    }>;
  }> {
    const client = await pool.connect();
    try {
      // 基础统计
      const basicStatsQuery = `
        SELECT 
          COUNT(DISTINCT iv.item_id) as total_items,
          COUNT(DISTINCT iv.location_id) as total_locations,
          SUM(iv.current_stock) as total_stock,
          COUNT(CASE WHEN iv.current_stock <= i.low_stock_threshold AND i.low_stock_threshold > 0 THEN 1 END) as low_stock_alerts,
          COUNT(CASE WHEN iv.current_stock = 0 THEN 1 END) as zero_stock_items
        FROM inventory_view iv
        JOIN items i ON iv.item_id = i.id
      `;

      // 按类别统计
      const categoryStatsQuery = `
        SELECT 
          iv.category,
          COUNT(DISTINCT iv.item_id) as item_count,
          SUM(iv.current_stock) as total_stock
        FROM inventory_view iv
        GROUP BY iv.category
        ORDER BY total_stock DESC
        LIMIT 10
      `;

      // 按位置统计
      const locationStatsQuery = `
        SELECT 
          iv.location_id,
          iv.location_code,
          iv.location_name,
          COUNT(DISTINCT iv.item_id) as item_count,
          SUM(iv.current_stock) as total_stock
        FROM inventory_view iv
        WHERE iv.current_stock > 0
        GROUP BY iv.location_id, iv.location_code, iv.location_name
        ORDER BY total_stock DESC
        LIMIT 10
      `;

      const [basicStats, categoryStats, locationStats] = await Promise.all([
        client.query(basicStatsQuery),
        client.query(categoryStatsQuery),
        client.query(locationStatsQuery)
      ]);

      return {
        totalItems: parseInt(basicStats.rows[0].total_items) || 0,
        totalLocations: parseInt(basicStats.rows[0].total_locations) || 0,
        totalStock: parseInt(basicStats.rows[0].total_stock) || 0,
        lowStockAlerts: parseInt(basicStats.rows[0].low_stock_alerts) || 0,
        zeroStockItems: parseInt(basicStats.rows[0].zero_stock_items) || 0,
        topCategories: categoryStats.rows.map(row => ({
          category: row.category,
          itemCount: parseInt(row.item_count),
          totalStock: parseInt(row.total_stock)
        })),
        topLocations: locationStats.rows.map(row => ({
          locationId: row.location_id,
          locationCode: row.location_code,
          locationName: row.location_name,
          itemCount: parseInt(row.item_count),
          totalStock: parseInt(row.total_stock)
        }))
      };
    } finally {
      client.release();
    }
  }

  // 获取库存变化历史
  async getInventoryHistory(itemId: string, locationId?: string, days: number = 30): Promise<Array<{
    date: string;
    inbound: number;
    outbound: number;
    netChange: number;
    runningStock: number;
  }>> {
    const client = await pool.connect();
    try {
      // 验证物品是否存在
      await this.itemService.getItem(itemId);

      let whereClause = 'WHERE t.item_id = $1';
      const values: any[] = [itemId];
      let paramIndex = 2;

      if (locationId) {
        whereClause += ` AND t.location_id = $${paramIndex++}`;
        values.push(locationId);
      }

      // 获取指定天数内的交易记录
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      whereClause += ` AND t.date >= $${paramIndex++}`;
      values.push(startDate.toISOString().split('T')[0]);

      const query = `
        WITH daily_transactions AS (
          SELECT 
            DATE(t.date) as transaction_date,
            SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE 0 END) as daily_inbound,
            SUM(CASE WHEN t.type = 'outbound' THEN t.quantity ELSE 0 END) as daily_outbound
          FROM transactions t
          ${whereClause}
          GROUP BY DATE(t.date)
        ),
        date_series AS (
          SELECT generate_series(
            DATE($${paramIndex}),
            CURRENT_DATE,
            '1 day'::interval
          )::date as date
        )
        SELECT 
          ds.date::text as date,
          COALESCE(dt.daily_inbound, 0) as inbound,
          COALESCE(dt.daily_outbound, 0) as outbound,
          COALESCE(dt.daily_inbound, 0) - COALESCE(dt.daily_outbound, 0) as net_change
        FROM date_series ds
        LEFT JOIN daily_transactions dt ON ds.date = dt.transaction_date
        ORDER BY ds.date
      `;

      values.push(startDate.toISOString().split('T')[0]);
      const result = await client.query(query, values);

      // 计算累计库存
      let runningStock = 0;
      
      // 获取起始库存
      const initialStockQuery = `
        SELECT COALESCE(SUM(
          CASE WHEN t.type = 'inbound' THEN t.quantity ELSE -t.quantity END
        ), 0) as initial_stock
        FROM transactions t
        WHERE t.item_id = $1 
          ${locationId ? 'AND t.location_id = $2' : ''}
          AND t.date < $${locationId ? '3' : '2'}
      `;

      const initialStockValues = [itemId];
      if (locationId) {
        initialStockValues.push(locationId);
      }
      initialStockValues.push(startDate.toISOString().split('T')[0]);

      const initialStockResult = await client.query(initialStockQuery, initialStockValues);
      runningStock = parseInt(initialStockResult.rows[0].initial_stock) || 0;

      return result.rows.map(row => {
        runningStock += row.net_change;
        return {
          date: row.date,
          inbound: row.inbound,
          outbound: row.outbound,
          netChange: row.net_change,
          runningStock
        };
      });
    } finally {
      client.release();
    }
  }
}

export default InventoryService;