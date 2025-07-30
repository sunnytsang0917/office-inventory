"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const database_1 = require("../config/database");
const Transaction_1 = require("../models/Transaction");
const ItemService_1 = require("./ItemService");
const LocationService_1 = require("./LocationService");
class TransactionService {
    constructor() {
        this.itemService = new ItemService_1.ItemService();
        this.locationService = new LocationService_1.LocationService();
    }
    async createTransaction(transactionData) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            await this.itemService.getItem(transactionData.itemId);
            await this.locationService.getLocation(transactionData.locationId);
            if (transactionData.type === 'outbound') {
                const currentStock = await this.getCurrentStock(transactionData.itemId, transactionData.locationId);
                if (currentStock < transactionData.quantity) {
                    throw new Error(`库存不足，当前库存: ${currentStock}，需要出库: ${transactionData.quantity}`);
                }
            }
            const transaction = Transaction_1.TransactionModel.create(transactionData);
            const validation = transaction.validateBusinessRules();
            if (!validation.isValid) {
                throw new Error(`业务规则验证失败: ${validation.errors.join(', ')}`);
            }
            const insertQuery = `
        INSERT INTO transactions (
          id, item_id, location_id, type, quantity, date, operator, 
          supplier, recipient, purpose, batch_id, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
            const values = [
                transaction.id,
                transaction.itemId,
                transaction.locationId,
                transaction.type,
                transaction.quantity,
                transaction.date,
                transaction.operator,
                transaction.supplier || null,
                transaction.recipient || null,
                transaction.purpose || null,
                transaction.batchId || null,
                transaction.notes,
                transaction.createdAt
            ];
            const result = await client.query(insertQuery, values);
            await client.query('COMMIT');
            return Transaction_1.TransactionModel.fromDatabase(result.rows[0]);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async createBatchTransactions(batchData) {
        const client = await database_1.pool.connect();
        const batchId = batchData.batchId || crypto.randomUUID();
        const results = {
            success: [],
            failed: [],
            batchId
        };
        try {
            await client.query('BEGIN');
            const outboundTransactions = batchData.transactions.filter(t => t.type === 'outbound');
            if (outboundTransactions.length > 0) {
                await this.validateBatchStockAvailability(outboundTransactions);
            }
            for (let i = 0; i < batchData.transactions.length; i++) {
                try {
                    const transactionData = { ...batchData.transactions[i], batchId };
                    await this.itemService.getItem(transactionData.itemId);
                    await this.locationService.getLocation(transactionData.locationId);
                    const transaction = Transaction_1.TransactionModel.create(transactionData);
                    const validation = transaction.validateBusinessRules();
                    if (!validation.isValid) {
                        throw new Error(validation.errors.join(', '));
                    }
                    const insertQuery = `
            INSERT INTO transactions (
              id, item_id, location_id, type, quantity, date, operator, 
              supplier, recipient, purpose, batch_id, notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
          `;
                    const values = [
                        transaction.id,
                        transaction.itemId,
                        transaction.locationId,
                        transaction.type,
                        transaction.quantity,
                        transaction.date,
                        transaction.operator,
                        transaction.supplier || null,
                        transaction.recipient || null,
                        transaction.purpose || null,
                        transaction.batchId,
                        transaction.notes,
                        transaction.createdAt
                    ];
                    const result = await client.query(insertQuery, values);
                    results.success.push(Transaction_1.TransactionModel.fromDatabase(result.rows[0]));
                }
                catch (error) {
                    results.failed.push({
                        index: i,
                        error: error instanceof Error ? error.message : '未知错误',
                        data: batchData.transactions[i]
                    });
                }
            }
            if (results.failed.length > 0) {
                await client.query('ROLLBACK');
                throw new Error(`批量操作失败，共 ${results.failed.length} 个交易失败`);
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
    async getTransaction(id) {
        const client = await database_1.pool.connect();
        try {
            const query = `
        SELECT t.*, i.name as item_name, l.name as location_name, l.code as location_code
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        JOIN locations l ON t.location_id = l.id
        WHERE t.id = $1
      `;
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                throw new Error('交易记录不存在');
            }
            return Transaction_1.TransactionModel.fromDatabase(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async getTransactionHistory(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            if (filter?.itemId) {
                whereClause += ` AND t.item_id = $${paramIndex++}`;
                values.push(filter.itemId);
            }
            if (filter?.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            if (filter?.type) {
                whereClause += ` AND t.type = $${paramIndex++}`;
                values.push(filter.type);
            }
            if (filter?.operator) {
                whereClause += ` AND t.operator ILIKE $${paramIndex++}`;
                values.push(`%${filter.operator}%`);
            }
            if (filter?.supplier) {
                whereClause += ` AND t.supplier ILIKE $${paramIndex++}`;
                values.push(`%${filter.supplier}%`);
            }
            if (filter?.recipient) {
                whereClause += ` AND t.recipient ILIKE $${paramIndex++}`;
                values.push(`%${filter.recipient}%`);
            }
            if (filter?.dateFrom) {
                whereClause += ` AND t.date >= $${paramIndex++}`;
                values.push(filter.dateFrom);
            }
            if (filter?.dateTo) {
                whereClause += ` AND t.date <= $${paramIndex++}`;
                values.push(filter.dateTo);
            }
            if (filter?.batchId) {
                whereClause += ` AND t.batch_id = $${paramIndex++}`;
                values.push(filter.batchId);
            }
            const page = filter?.page || 1;
            const limit = filter?.limit || 20;
            const offset = (page - 1) * limit;
            const sortBy = filter?.sortBy || 'date';
            const sortOrder = filter?.sortOrder || 'desc';
            const orderClause = `ORDER BY t.${sortBy} ${sortOrder.toUpperCase()}`;
            const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        ${whereClause}
      `;
            const countResult = await client.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);
            const dataQuery = `
        SELECT t.*, i.name as item_name, l.name as location_name, l.code as location_code
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        JOIN locations l ON t.location_id = l.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
            values.push(limit, offset);
            const dataResult = await client.query(dataQuery, values);
            const transactions = dataResult.rows.map(row => Transaction_1.TransactionModel.fromDatabase(row));
            return {
                data: transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        finally {
            client.release();
        }
    }
    async updateTransaction(id, updateData) {
        const client = await database_1.pool.connect();
        try {
            const existingTransaction = await this.getTransaction(id);
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            if (updateData.operator !== undefined) {
                updateFields.push(`operator = $${paramIndex++}`);
                values.push(updateData.operator);
            }
            if (updateData.supplier !== undefined) {
                updateFields.push(`supplier = $${paramIndex++}`);
                values.push(updateData.supplier);
            }
            if (updateData.recipient !== undefined) {
                updateFields.push(`recipient = $${paramIndex++}`);
                values.push(updateData.recipient);
            }
            if (updateData.purpose !== undefined) {
                updateFields.push(`purpose = $${paramIndex++}`);
                values.push(updateData.purpose);
            }
            if (updateData.notes !== undefined) {
                updateFields.push(`notes = $${paramIndex++}`);
                values.push(updateData.notes);
            }
            if (updateFields.length === 0) {
                return existingTransaction;
            }
            values.push(id);
            const updateQuery = `
        UPDATE transactions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(updateQuery, values);
            return Transaction_1.TransactionModel.fromDatabase(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async deleteTransaction(id) {
        const client = await database_1.pool.connect();
        try {
            await this.getTransaction(id);
            const canDelete = await this.canDeleteTransaction(id);
            if (!canDelete.allowed) {
                throw new Error(canDelete.reason);
            }
            const deleteQuery = 'DELETE FROM transactions WHERE id = $1';
            await client.query(deleteQuery, [id]);
        }
        finally {
            client.release();
        }
    }
    async getCurrentStock(itemId, locationId) {
        const client = await database_1.pool.connect();
        try {
            const query = `
        SELECT COALESCE(current_stock, 0) as stock
        FROM inventory_view 
        WHERE item_id = $1 AND location_id = $2
      `;
            const result = await client.query(query, [itemId, locationId]);
            return result.rows.length > 0 ? result.rows[0].stock : 0;
        }
        finally {
            client.release();
        }
    }
    async validateBatchStockAvailability(outboundTransactions) {
        const client = await database_1.pool.connect();
        try {
            const stockRequirements = {};
            outboundTransactions.forEach(transaction => {
                const key = `${transaction.itemId}-${transaction.locationId}`;
                stockRequirements[key] = (stockRequirements[key] || 0) + transaction.quantity;
            });
            for (const [key, requiredQuantity] of Object.entries(stockRequirements)) {
                const [itemId, locationId] = key.split('-');
                const currentStock = await this.getCurrentStock(itemId, locationId);
                if (currentStock < requiredQuantity) {
                    const itemQuery = 'SELECT name FROM items WHERE id = $1';
                    const locationQuery = 'SELECT name, code FROM locations WHERE id = $1';
                    const [itemResult, locationResult] = await Promise.all([
                        client.query(itemQuery, [itemId]),
                        client.query(locationQuery, [locationId])
                    ]);
                    const itemName = itemResult.rows[0]?.name || itemId;
                    const locationName = locationResult.rows[0]?.name || locationId;
                    const locationCode = locationResult.rows[0]?.code || '';
                    throw new Error(`物品"${itemName}"在位置"${locationName}(${locationCode})"库存不足，` +
                        `需要: ${requiredQuantity}，当前库存: ${currentStock}`);
                }
            }
        }
        finally {
            client.release();
        }
    }
    async canDeleteTransaction(id) {
        const client = await database_1.pool.connect();
        try {
            const query = 'SELECT * FROM transactions WHERE id = $1';
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                return { allowed: false, reason: '交易记录不存在' };
            }
            const transaction = result.rows[0];
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > 7) {
                return { allowed: false, reason: '超过7天的交易记录不能删除' };
            }
            if (transaction.batch_id) {
                const batchQuery = 'SELECT COUNT(*) as count FROM transactions WHERE batch_id = $1';
                const batchResult = await client.query(batchQuery, [transaction.batch_id]);
                const batchCount = parseInt(batchResult.rows[0].count);
                if (batchCount > 1) {
                    return { allowed: false, reason: '批量操作的交易记录不能单独删除' };
                }
            }
            return { allowed: true };
        }
        finally {
            client.release();
        }
    }
    async getTransactionStatistics(filter) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            if (filter?.dateFrom) {
                whereClause += ` AND t.date >= $${paramIndex++}`;
                values.push(filter.dateFrom);
            }
            if (filter?.dateTo) {
                whereClause += ` AND t.date <= $${paramIndex++}`;
                values.push(filter.dateTo);
            }
            if (filter?.itemId) {
                whereClause += ` AND t.item_id = $${paramIndex++}`;
                values.push(filter.itemId);
            }
            if (filter?.locationId) {
                whereClause += ` AND t.location_id = $${paramIndex++}`;
                values.push(filter.locationId);
            }
            const basicStatsQuery = `
        SELECT 
          SUM(CASE WHEN type = 'inbound' THEN quantity ELSE 0 END) as total_inbound,
          SUM(CASE WHEN type = 'outbound' THEN quantity ELSE 0 END) as total_outbound,
          COUNT(*) as transaction_count
        FROM transactions t
        ${whereClause}
      `;
            const topItemsQuery = `
        SELECT 
          t.item_id,
          i.name as item_name,
          SUM(t.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        ${whereClause}
        GROUP BY t.item_id, i.name
        ORDER BY total_quantity DESC
        LIMIT 10
      `;
            const topLocationsQuery = `
        SELECT 
          t.location_id,
          l.name as location_name,
          SUM(t.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM transactions t
        JOIN locations l ON t.location_id = l.id
        ${whereClause}
        GROUP BY t.location_id, l.name
        ORDER BY total_quantity DESC
        LIMIT 10
      `;
            const [basicStats, topItems, topLocations] = await Promise.all([
                client.query(basicStatsQuery, values),
                client.query(topItemsQuery, values),
                client.query(topLocationsQuery, values)
            ]);
            return {
                totalInbound: parseInt(basicStats.rows[0].total_inbound) || 0,
                totalOutbound: parseInt(basicStats.rows[0].total_outbound) || 0,
                transactionCount: parseInt(basicStats.rows[0].transaction_count) || 0,
                topItems: topItems.rows.map(row => ({
                    itemId: row.item_id,
                    itemName: row.item_name,
                    totalQuantity: parseInt(row.total_quantity),
                    transactionCount: parseInt(row.transaction_count)
                })),
                topLocations: topLocations.rows.map(row => ({
                    locationId: row.location_id,
                    locationName: row.location_name,
                    totalQuantity: parseInt(row.total_quantity),
                    transactionCount: parseInt(row.transaction_count)
                }))
            };
        }
        finally {
            client.release();
        }
    }
}
exports.TransactionService = TransactionService;
exports.default = TransactionService;
//# sourceMappingURL=TransactionService.js.map