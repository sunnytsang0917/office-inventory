"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const database_1 = require("../config/database");
const date_fns_1 = require("date-fns");
class ReportService {
    async getMonthlyStats(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE t.date >= $1 AND t.date <= $2';
            const values = [filter.startDate, filter.endDate];
            let paramIndex = 3;
            if (filter.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter.category) {
                whereClause += ` AND i.category = $${paramIndex++}`;
                values.push(filter.category);
            }
            const query = `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', t.date), 'YYYY-MM') as month,
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE 0 END) as inbound_total,
          SUM(CASE WHEN t.type = 'outbound' THEN t.quantity ELSE 0 END) as outbound_total,
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE -t.quantity END) as net_change,
          COUNT(DISTINCT t.item_id) as item_count
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
        GROUP BY DATE_TRUNC('month', t.date)
        ORDER BY month ASC
      `;
            const result = await client.query(query, values);
            return result.rows.map(row => ({
                month: row.month,
                inboundTotal: parseInt(row.inbound_total) || 0,
                outboundTotal: parseInt(row.outbound_total) || 0,
                netChange: parseInt(row.net_change) || 0,
                itemCount: parseInt(row.item_count) || 0
            }));
        }
        finally {
            client.release();
        }
    }
    async getItemUsageRanking(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE t.date >= $1 AND t.date <= $2 AND t.type = \'outbound\'';
            const values = [filter.startDate, filter.endDate];
            let paramIndex = 3;
            if (filter.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter.category) {
                whereClause += ` AND i.category = $${paramIndex++}`;
                values.push(filter.category);
            }
            const limit = filter.limit || 20;
            const query = `
        SELECT 
          i.name as item_name,
          i.category,
          SUM(t.quantity) as total_outbound,
          COUNT(t.id) as frequency,
          MAX(t.date) as last_used_date
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
        GROUP BY i.id, i.name, i.category
        ORDER BY total_outbound DESC, frequency DESC
        LIMIT $${paramIndex}
      `;
            values.push(limit);
            const result = await client.query(query, values);
            return result.rows.map(row => ({
                itemName: row.item_name,
                category: row.category,
                totalOutbound: parseInt(row.total_outbound) || 0,
                frequency: parseInt(row.frequency) || 0,
                lastUsedDate: (0, date_fns_1.format)(new Date(row.last_used_date), 'yyyy-MM-dd')
            }));
        }
        finally {
            client.release();
        }
    }
    async getInventoryStatus(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            if (filter.locationId) {
                whereClause += ` AND iv.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter.category) {
                whereClause += ` AND i.category = $${paramIndex++}`;
                values.push(filter.category);
            }
            if (filter.lowStockOnly) {
                whereClause += ` AND iv.current_stock <= i.low_stock_threshold`;
            }
            const query = `
        SELECT 
          i.name as item_name,
          i.category,
          l.name as location_name,
          COALESCE(iv.current_stock, 0) as current_stock,
          i.low_stock_threshold,
          CASE 
            WHEN COALESCE(iv.current_stock, 0) = 0 THEN 'out_of_stock'
            WHEN COALESCE(iv.current_stock, 0) <= i.low_stock_threshold THEN 'low'
            ELSE 'normal'
          END as status,
          COALESCE(iv.last_transaction_date, i.created_at) as last_transaction_date
        FROM items i
        CROSS JOIN locations l
        LEFT JOIN inventory_view iv ON i.id = iv.item_id AND l.id = iv.location_id
        ${whereClause}
        ORDER BY i.category, i.name, l.name
      `;
            const result = await client.query(query, values);
            return result.rows.map(row => ({
                itemName: row.item_name,
                category: row.category,
                locationName: row.location_name,
                currentStock: parseInt(row.current_stock) || 0,
                lowStockThreshold: parseInt(row.low_stock_threshold) || 0,
                status: row.status,
                lastTransactionDate: (0, date_fns_1.format)(new Date(row.last_transaction_date), 'yyyy-MM-dd')
            }));
        }
        finally {
            client.release();
        }
    }
    async getTransactionHistory(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE t.date >= $1 AND t.date <= $2';
            const values = [filter.startDate, filter.endDate];
            let paramIndex = 3;
            if (filter.itemId) {
                whereClause += ` AND t.item_id = $${paramIndex++}`;
                values.push(filter.itemId);
            }
            if (filter.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter.type) {
                whereClause += ` AND t.type = $${paramIndex++}`;
                values.push(filter.type);
            }
            if (filter.operator) {
                whereClause += ` AND t.operator ILIKE $${paramIndex++}`;
                values.push(`%${filter.operator}%`);
            }
            const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        JOIN locations l ON t.location_id = l.id
        ${whereClause}
      `;
            const countResult = await client.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);
            const limit = filter.limit || 100;
            const offset = filter.offset || 0;
            const dataQuery = `
        SELECT 
          t.date,
          i.name as item_name,
          l.name as location_name,
          t.type,
          t.quantity,
          t.operator,
          t.supplier,
          t.recipient,
          t.purpose
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        JOIN locations l ON t.location_id = l.id
        ${whereClause}
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
            values.push(limit, offset);
            const dataResult = await client.query(dataQuery, values);
            const data = dataResult.rows.map(row => ({
                date: (0, date_fns_1.format)(new Date(row.date), 'yyyy-MM-dd'),
                itemName: row.item_name,
                locationName: row.location_name,
                type: row.type,
                quantity: parseInt(row.quantity),
                operator: row.operator,
                supplier: row.supplier || undefined,
                recipient: row.recipient || undefined,
                purpose: row.purpose || undefined
            }));
            return { data, total };
        }
        finally {
            client.release();
        }
    }
    async getCustomRangeStats(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE t.date >= $1 AND t.date <= $2';
            const values = [filter.startDate, filter.endDate];
            let paramIndex = 3;
            if (filter.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter.category) {
                whereClause += ` AND i.category = $${paramIndex++}`;
                values.push(filter.category);
            }
            const summaryQuery = `
        SELECT 
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE 0 END) as total_inbound,
          SUM(CASE WHEN t.type = 'outbound' THEN t.quantity ELSE 0 END) as total_outbound,
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE -t.quantity END) as net_change,
          COUNT(*) as transaction_count,
          COUNT(DISTINCT t.item_id) as unique_items,
          COUNT(DISTINCT t.location_id) as unique_locations
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
      `;
            const dailyStatsQuery = `
        SELECT 
          DATE(t.date) as date,
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE 0 END) as inbound,
          SUM(CASE WHEN t.type = 'outbound' THEN t.quantity ELSE 0 END) as outbound,
          SUM(CASE WHEN t.type = 'inbound' THEN t.quantity ELSE -t.quantity END) as net_change
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
        GROUP BY DATE(t.date)
        ORDER BY date ASC
      `;
            const topItemsQuery = `
        SELECT 
          i.name as item_name,
          i.category,
          SUM(t.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
        GROUP BY i.id, i.name, i.category
        ORDER BY total_quantity DESC
        LIMIT 10
      `;
            const topLocationsQuery = `
        SELECT 
          l.name as location_name,
          SUM(t.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        JOIN locations l ON t.location_id = l.id
        ${whereClause}
        GROUP BY l.id, l.name
        ORDER BY total_quantity DESC
        LIMIT 10
      `;
            const [summaryResult, dailyStatsResult, topItemsResult, topLocationsResult] = await Promise.all([
                client.query(summaryQuery, values),
                client.query(dailyStatsQuery, values),
                client.query(topItemsQuery, values),
                client.query(topLocationsQuery, values)
            ]);
            const summary = summaryResult.rows[0];
            return {
                summary: {
                    totalInbound: parseInt(summary.total_inbound) || 0,
                    totalOutbound: parseInt(summary.total_outbound) || 0,
                    netChange: parseInt(summary.net_change) || 0,
                    transactionCount: parseInt(summary.transaction_count) || 0,
                    uniqueItems: parseInt(summary.unique_items) || 0,
                    uniqueLocations: parseInt(summary.unique_locations) || 0
                },
                dailyStats: dailyStatsResult.rows.map(row => ({
                    date: (0, date_fns_1.format)(new Date(row.date), 'yyyy-MM-dd'),
                    inbound: parseInt(row.inbound) || 0,
                    outbound: parseInt(row.outbound) || 0,
                    netChange: parseInt(row.net_change) || 0
                })),
                topItems: topItemsResult.rows.map(row => ({
                    itemName: row.item_name,
                    category: row.category,
                    totalQuantity: parseInt(row.total_quantity) || 0,
                    transactionCount: parseInt(row.transaction_count) || 0
                })),
                topLocations: topLocationsResult.rows.map(row => ({
                    locationName: row.location_name,
                    totalQuantity: parseInt(row.total_quantity) || 0,
                    transactionCount: parseInt(row.transaction_count) || 0
                }))
            };
        }
        finally {
            client.release();
        }
    }
    getAvailableReports() {
        return [
            {
                type: 'monthly-stats',
                name: '月度统计报表',
                description: '按月统计入库、出库数量和净变化',
                supportedFormats: ['xlsx', 'csv']
            },
            {
                type: 'item-usage',
                name: '物品使用排行',
                description: '按出库数量和频次排序的物品使用情况',
                supportedFormats: ['xlsx', 'csv']
            },
            {
                type: 'inventory-status',
                name: '库存状态报表',
                description: '当前库存状态，包括低库存预警',
                supportedFormats: ['xlsx', 'csv']
            },
            {
                type: 'transaction-history',
                name: '交易历史报表',
                description: '详细的出入库交易记录',
                supportedFormats: ['xlsx', 'csv']
            },
            {
                type: 'custom-range',
                name: '自定义时间范围统计',
                description: '指定时间范围内的综合统计分析',
                supportedFormats: ['xlsx', 'csv']
            }
        ];
    }
}
exports.ReportService = ReportService;
exports.default = ReportService;
//# sourceMappingURL=ReportService.js.map