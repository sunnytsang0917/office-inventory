"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchImportService = void 0;
const ExcelService_1 = __importDefault(require("./ExcelService"));
const ItemService_1 = __importDefault(require("./ItemService"));
const TransactionService_1 = __importDefault(require("./TransactionService"));
class BatchImportService {
    constructor(pool) {
        this.pool = pool;
        this.excelService = new ExcelService_1.default();
        this.itemService = new ItemService_1.default(pool);
        this.transactionService = new TransactionService_1.default(pool);
    }
    async importItems(buffer, options = {}) {
        const { skipErrors = false, validateOnly = false, batchSize = 100 } = options;
        try {
            const parseResult = await this.excelService.parseItemsExcel(buffer);
            if (parseResult.errors.length > 0 && !skipErrors) {
                return {
                    success: 0,
                    failed: parseResult.errors.length,
                    errors: parseResult.errors.map(err => `第${err.row}行: ${err.message}`),
                    details: parseResult.errors
                };
            }
            if (validateOnly) {
                return {
                    success: parseResult.data.length,
                    failed: parseResult.errors.length,
                    errors: parseResult.errors.map(err => `第${err.row}行: ${err.message}`),
                    details: parseResult.errors
                };
            }
            const result = {
                success: 0,
                failed: 0,
                errors: [],
                importedItems: []
            };
            for (let i = 0; i < parseResult.data.length; i += batchSize) {
                const batch = parseResult.data.slice(i, i + batchSize);
                const batchResult = await this.processBatchItems(batch, skipErrors);
                result.success += batchResult.success;
                result.failed += batchResult.failed;
                result.errors.push(...batchResult.errors);
                if (batchResult.importedItems) {
                    result.importedItems.push(...batchResult.importedItems);
                }
            }
            return result;
        }
        catch (error) {
            throw new Error(`批量导入物品失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    async importInboundTransactions(buffer, options = {}) {
        return this.importTransactions(buffer, 'inbound', options);
    }
    async importOutboundTransactions(buffer, options = {}) {
        return this.importTransactions(buffer, 'outbound', options);
    }
    async importTransactions(buffer, type, options = {}) {
        const { skipErrors = false, validateOnly = false, batchSize = 50 } = options;
        try {
            const parseResult = type === 'inbound'
                ? await this.excelService.parseInboundTransactionsExcel(buffer)
                : await this.excelService.parseOutboundTransactionsExcel(buffer);
            if (parseResult.errors.length > 0 && !skipErrors) {
                return {
                    success: 0,
                    failed: parseResult.errors.length,
                    errors: parseResult.errors.map(err => `第${err.row}行: ${err.message}`),
                    details: parseResult.errors
                };
            }
            if (validateOnly) {
                return {
                    success: parseResult.data.length,
                    failed: parseResult.errors.length,
                    errors: parseResult.errors.map(err => `第${err.row}行: ${err.message}`),
                    details: parseResult.errors
                };
            }
            const result = {
                success: 0,
                failed: 0,
                errors: [],
                importedTransactions: []
            };
            for (let i = 0; i < parseResult.data.length; i += batchSize) {
                const batch = parseResult.data.slice(i, i + batchSize);
                const batchResult = await this.processBatchTransactions(batch, skipErrors);
                result.success += batchResult.success;
                result.failed += batchResult.failed;
                result.errors.push(...batchResult.errors);
                if (batchResult.importedTransactions) {
                    result.importedTransactions.push(...batchResult.importedTransactions);
                }
            }
            return result;
        }
        catch (error) {
            throw new Error(`批量导入${type === 'inbound' ? '入库' : '出库'}交易失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    async processBatchItems(items, skipErrors) {
        const client = await this.pool.connect();
        const result = {
            success: 0,
            failed: 0,
            errors: [],
            importedItems: []
        };
        try {
            await client.query('BEGIN');
            for (const [index, itemData] of items.entries()) {
                try {
                    const createdItem = await this.itemService.createItem(itemData);
                    result.success++;
                    result.importedItems.push(createdItem.id);
                }
                catch (error) {
                    result.failed++;
                    const errorMessage = `物品 "${itemData.name}": ${error instanceof Error ? error.message : '未知错误'}`;
                    result.errors.push(errorMessage);
                    if (!skipErrors) {
                        await client.query('ROLLBACK');
                        throw new Error(`批量导入在第${index + 1}个物品时失败: ${errorMessage}`);
                    }
                }
            }
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async processBatchTransactions(transactions, skipErrors) {
        const client = await this.pool.connect();
        const result = {
            success: 0,
            failed: 0,
            errors: [],
            importedTransactions: []
        };
        try {
            await client.query('BEGIN');
            for (const [index, transactionData] of transactions.entries()) {
                try {
                    const createdTransaction = await this.transactionService.createTransaction(transactionData);
                    result.success++;
                    result.importedTransactions.push(createdTransaction.id);
                }
                catch (error) {
                    result.failed++;
                    const errorMessage = `交易 "${transactionData.itemId}": ${error instanceof Error ? error.message : '未知错误'}`;
                    result.errors.push(errorMessage);
                    if (!skipErrors) {
                        await client.query('ROLLBACK');
                        throw new Error(`批量导入在第${index + 1}个交易时失败: ${errorMessage}`);
                    }
                }
            }
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async validateImportData(buffer, type) {
        try {
            let parseResult;
            switch (type) {
                case 'items':
                    parseResult = await this.excelService.parseItemsExcel(buffer);
                    break;
                case 'inbound':
                    parseResult = await this.excelService.parseInboundTransactionsExcel(buffer);
                    break;
                case 'outbound':
                    parseResult = await this.excelService.parseOutboundTransactionsExcel(buffer);
                    break;
                default:
                    throw new Error('不支持的导入类型');
            }
            const totalRows = parseResult.data.length + parseResult.errors.length;
            const validRows = parseResult.data.length;
            return {
                isValid: parseResult.errors.length === 0,
                totalRows,
                validRows,
                errors: parseResult.errors
            };
        }
        catch (error) {
            throw new Error(`验证导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    getImportTemplate(type) {
        switch (type) {
            case 'items':
                return this.excelService.generateItemTemplate();
            case 'inbound':
                return this.excelService.generateInboundTemplate();
            case 'outbound':
                return this.excelService.generateOutboundTemplate();
            default:
                throw new Error('不支持的模板类型');
        }
    }
    async checkImportPrerequisites(transactions) {
        const result = {
            isValid: true,
            missingItems: [],
            missingLocations: [],
            insufficientStock: []
        };
        const itemIds = [...new Set(transactions.map(t => t.itemId))];
        const locationIds = [...new Set(transactions.map(t => t.locationId))];
        try {
            for (const itemId of itemIds) {
                try {
                    await this.itemService.getItemById(itemId);
                }
                catch (error) {
                    result.missingItems.push(itemId);
                    result.isValid = false;
                }
            }
            const outboundTransactions = transactions.filter(t => t.type === 'outbound');
            if (outboundTransactions.length > 0) {
                const stockRequirements = new Map();
                outboundTransactions.forEach(transaction => {
                    const key = `${transaction.itemId}-${transaction.locationId}`;
                    const current = stockRequirements.get(key) || 0;
                    stockRequirements.set(key, current + transaction.quantity);
                });
                for (const [key, requiredQuantity] of stockRequirements) {
                    const [itemId, locationId] = key.split('-');
                    try {
                    }
                    catch (error) {
                        result.insufficientStock.push({
                            itemId,
                            locationId,
                            required: requiredQuantity,
                            available: 0
                        });
                        result.isValid = false;
                    }
                }
            }
        }
        catch (error) {
            throw new Error(`检查导入前置条件失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        return result;
    }
}
exports.BatchImportService = BatchImportService;
exports.default = BatchImportService;
//# sourceMappingURL=BatchImportService.js.map