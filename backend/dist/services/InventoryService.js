"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const database_1 = require("../config/database");
const ItemService_1 = require("./ItemService");
const LocationService_1 = require("./LocationService");
const TransactionService_1 = require("./TransactionService");
class InventoryService {
    constructor() {
        this.itemService = new ItemService_1.ItemService();
        this.locationService = new LocationService_1.LocationService();
        this.transactionService = new TransactionService_1.TransactionService();
    }
    async getInventoryStatus(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE iv.current_stock >= 0';
            const values = [];
            let paramIndex = 1;
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
                }
                else {
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
            const inventoryStatus = result.rows.map(row => ({
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
            if (filter?.isLowStock !== undefined) {
                return inventoryStatus.filter(item => filter.isLowStock ? item.isLowStock : !item.isLowStock);
            }
            return inventoryStatus;
        }
        finally {
            client.release();
        }
    }
    async getItemInventory(itemId) {
        const client = await database_1.pool.connect();
        try {
            const item = await this.itemService.getItem(itemId);
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
                type: row.type,
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
        }
        finally {
            client.release();
        }
    }
    async searchInventory(query) {
        return this.getInventoryStatus({ search: query });
    }
    async getLowStockItems(threshold) {
        const client = await database_1.pool.connect();
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
        }
        finally {
            client.release();
        }
    }
    async getLocationInventorySummary(locationId) {
        const client = await database_1.pool.connect();
        try {
            const location = await this.locationService.getLocation(locationId);
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
                    id: location.id,
                    code: location.code,
                    name: location.name,
                    description: location.description
                },
                totalItems: items.length,
                totalStock,
                lowStockItems,
                items
            };
        }
        finally {
            client.release();
        }
    }
    async getInventoryStatistics() {
        const client = await database_1.pool.connect();
        try {
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
        }
        finally {
            client.release();
        }
    }
    async getInventoryHistory(itemId, locationId, days = 30) {
        const client = await database_1.pool.connect();
        try {
            await this.itemService.getItem(itemId);
            let whereClause = 'WHERE t.item_id = $1';
            const values = [itemId];
            let paramIndex = 2;
            if (locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(locationId);
            }
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            whereClause += ` AND t.date >= $${paramIndex++}`;
            values.push(startDate);
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
            values.push(startDate.toISOString());
            const result = await client.query(query, values);
            let runningStock = 0;
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
            initialStockValues.push(startDate);
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
        }
        finally {
            client.release();
        }
    }
}
exports.InventoryService = InventoryService;
exports.default = InventoryService;
//# sourceMappingURL=InventoryService.js.map