import { pool } from '../config/database';
import {
    TransactionModel,
    CreateTransactionDto,
    UpdateTransactionDto,
    BatchTransactionDto,
    TransactionFilter,
    InventoryImpact
} from '../models/Transaction';
import { TransactionType, BatchResult, PaginatedResponse } from '../types';
import { ItemService } from './ItemService';
import { LocationService } from './LocationService';

export class TransactionService {
    private itemService = new ItemService();
    private locationService = new LocationService();

    // 创建单个交易记录
    async createTransaction(transactionData: CreateTransactionDto): Promise<TransactionModel> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 验证物品是否存在
            await this.itemService.getItem(transactionData.itemId);

            // 验证位置是否存在
            await this.locationService.getLocation(transactionData.locationId);

            // 如果是出库操作，检查库存是否充足
            if (transactionData.type === 'outbound') {
                const currentStock = await this.getCurrentStock(transactionData.itemId, transactionData.locationId);
                if (currentStock < transactionData.quantity) {
                    throw new Error(`库存不足，当前库存: ${currentStock}，需要出库: ${transactionData.quantity}`);
                }
            }

            // 创建交易记录
            const transaction = TransactionModel.create(transactionData);

            // 验证业务规则
            const validation = transaction.validateBusinessRules();
            if (!validation.isValid) {
                throw new Error(`业务规则验证失败: ${validation.errors.join(', ')}`);
            }

            // 插入交易记录
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
            return TransactionModel.fromDatabase(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }  // 批量创建交易记录
    async createBatchTransactions(batchData: BatchTransactionDto): Promise<{
        success: TransactionModel[];
        failed: Array<{ index: number; error: string; data: CreateTransactionDto }>;
        batchId: string;
    }> {
        const client = await pool.connect();
        const batchId = batchData.batchId || crypto.randomUUID();
        const results = {
            success: [] as TransactionModel[],
            failed: [] as Array<{ index: number; error: string; data: CreateTransactionDto }>,
            batchId
        };

        try {
            await client.query('BEGIN');

            // 预先验证所有交易的库存可用性（仅对出库操作）
            const outboundTransactions = batchData.transactions.filter(t => t.type === 'outbound');
            if (outboundTransactions.length > 0) {
                await this.validateBatchStockAvailability(outboundTransactions);
            }

            // 逐个处理交易
            for (let i = 0; i < batchData.transactions.length; i++) {
                try {
                    const transactionData = { ...batchData.transactions[i], batchId };

                    // 验证物品和位置
                    await this.itemService.getItem(transactionData.itemId);
                    await this.locationService.getLocation(transactionData.locationId);

                    // 创建交易记录
                    const transaction = TransactionModel.create(transactionData);

                    // 验证业务规则
                    const validation = transaction.validateBusinessRules();
                    if (!validation.isValid) {
                        throw new Error(validation.errors.join(', '));
                    }

                    // 插入交易记录
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
                    results.success.push(TransactionModel.fromDatabase(result.rows[0]));
                } catch (error) {
                    results.failed.push({
                        index: i,
                        error: error instanceof Error ? error.message : '未知错误',
                        data: batchData.transactions[i]
                    });
                }
            }

            // 如果有失败的交易，回滚整个批次
            if (results.failed.length > 0) {
                await client.query('ROLLBACK');
                throw new Error(`批量操作失败，共 ${results.failed.length} 个交易失败`);
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

    // 获取交易记录详情
    async getTransaction(id: string): Promise<TransactionModel> {
        const client = await pool.connect();
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

            return TransactionModel.fromDatabase(result.rows[0]);
        } finally {
            client.release();
        }
    }
    // 获取交易历史记录（支持分页和筛选）
    async getTransactionHistory(filter?: TransactionFilter): Promise<PaginatedResponse<TransactionModel>> {
        const client = await pool.connect();
        try {
            let whereClause = 'WHERE 1=1';
            const values: any[] = [];
            let paramIndex = 1;

            // 构建筛选条件
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

            // 分页参数
            const page = filter?.page || 1;
            const limit = filter?.limit || 20;
            const offset = (page - 1) * limit;

            // 排序
            const sortBy = filter?.sortBy || 'date';
            const sortOrder = filter?.sortOrder || 'desc';
            const orderClause = `ORDER BY t.${sortBy} ${sortOrder.toUpperCase()}`;

            // 查询总数
            const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        ${whereClause}
      `;
            const countResult = await client.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);

            // 查询数据
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

            const transactions = dataResult.rows.map(row => TransactionModel.fromDatabase(row));

            return {
                data: transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } finally {
            client.release();
        }
    }

    // 更新交易记录（仅限部分字段）
    async updateTransaction(id: string, updateData: UpdateTransactionDto): Promise<TransactionModel> {
        const client = await pool.connect();
        try {
            // 验证交易记录是否存在
            const existingTransaction = await this.getTransaction(id);

            // 构建更新字段
            const updateFields: string[] = [];
            const values: any[] = [];
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
            return TransactionModel.fromDatabase(result.rows[0]);
        } finally {
            client.release();
        }
    }

    // 删除交易记录（软删除或硬删除）
    async deleteTransaction(id: string): Promise<void> {
        const client = await pool.connect();
        try {
            // 验证交易记录是否存在
            await this.getTransaction(id);

            // 检查是否可以删除（例如，是否是最近的交易）
            const canDelete = await this.canDeleteTransaction(id);
            if (!canDelete.allowed) {
                throw new Error(canDelete.reason);
            }

            const deleteQuery = 'DELETE FROM transactions WHERE id = $1';
            await client.query(deleteQuery, [id]);
        } finally {
            client.release();
        }
    }

    // 获取物品在指定位置的当前库存
    private async getCurrentStock(itemId: string, locationId: string): Promise<number> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT COALESCE(current_stock, 0) as stock
        FROM inventory_view 
        WHERE item_id = $1 AND location_id = $2
      `;

            const result = await client.query(query, [itemId, locationId]);
            return result.rows.length > 0 ? result.rows[0].stock : 0;
        } finally {
            client.release();
        }
    }

    // 验证批量出库操作的库存可用性
    private async validateBatchStockAvailability(outboundTransactions: CreateTransactionDto[]): Promise<void> {
        const client = await pool.connect();
        try {
            // 按物品和位置分组计算需要的总数量
            const stockRequirements: Record<string, number> = {};

            outboundTransactions.forEach(transaction => {
                const key = `${transaction.itemId}-${transaction.locationId}`;
                stockRequirements[key] = (stockRequirements[key] || 0) + transaction.quantity;
            });

            // 检查每个位置的库存是否充足
            for (const [key, requiredQuantity] of Object.entries(stockRequirements)) {
                const [itemId, locationId] = key.split('-');
                const currentStock = await this.getCurrentStock(itemId, locationId);

                if (currentStock < requiredQuantity) {
                    // 获取物品和位置名称用于错误信息
                    const itemQuery = 'SELECT name FROM items WHERE id = $1';
                    const locationQuery = 'SELECT name, code FROM locations WHERE id = $1';

                    const [itemResult, locationResult] = await Promise.all([
                        client.query(itemQuery, [itemId]),
                        client.query(locationQuery, [locationId])
                    ]);

                    const itemName = itemResult.rows[0]?.name || itemId;
                    const locationName = locationResult.rows[0]?.name || locationId;
                    const locationCode = locationResult.rows[0]?.code || '';

                    throw new Error(
                        `物品"${itemName}"在位置"${locationName}(${locationCode})"库存不足，` +
                        `需要: ${requiredQuantity}，当前库存: ${currentStock}`
                    );
                }
            }
        } finally {
            client.release();
        }
    }

    // 检查交易记录是否可以删除
    private async canDeleteTransaction(id: string): Promise<{ allowed: boolean; reason?: string }> {
        const client = await pool.connect();
        try {
            // 获取交易记录
            const query = 'SELECT * FROM transactions WHERE id = $1';
            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                return { allowed: false, reason: '交易记录不存在' };
            }

            const transaction = result.rows[0];
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

            // 超过7天的交易不允许删除
            if (daysDiff > 7) {
                return { allowed: false, reason: '超过7天的交易记录不能删除' };
            }

            // 如果是批量操作的一部分，需要检查整个批次
            if (transaction.batch_id) {
                const batchQuery = 'SELECT COUNT(*) as count FROM transactions WHERE batch_id = $1';
                const batchResult = await client.query(batchQuery, [transaction.batch_id]);
                const batchCount = parseInt(batchResult.rows[0].count);

                if (batchCount > 1) {
                    return { allowed: false, reason: '批量操作的交易记录不能单独删除' };
                }
            }

            return { allowed: true };
        } finally {
            client.release();
        }
    }

    // 获取交易统计信息
    async getTransactionStatistics(filter?: {
        dateFrom?: Date;
        dateTo?: Date;
        itemId?: string;
        locationId?: string;
    }): Promise<{
        totalInbound: number;
        totalOutbound: number;
        transactionCount: number;
        topItems: Array<{ itemId: string; itemName: string; totalQuantity: number; transactionCount: number }>;
        topLocations: Array<{ locationId: string; locationName: string; totalQuantity: number; transactionCount: number }>;
    }> {
        const client = await pool.connect();
        try {
            let whereClause = 'WHERE 1=1';
            const values: any[] = [];
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

            // 基础统计
            const basicStatsQuery = `
        SELECT 
          SUM(CASE WHEN type = 'inbound' THEN quantity ELSE 0 END) as total_inbound,
          SUM(CASE WHEN type = 'outbound' THEN quantity ELSE 0 END) as total_outbound,
          COUNT(*) as transaction_count
        FROM transactions t
        ${whereClause}
      `;

            // 热门物品统计
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

            // 热门位置统计
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
        } finally {
            client.release();
        }
    }
}

export default TransactionService;