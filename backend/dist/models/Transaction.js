"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionValidationError = exports.TransactionModel = exports.BatchTransactionSchema = exports.UpdateTransactionSchema = exports.CreateTransactionSchema = exports.TransactionSchema = void 0;
const zod_1 = require("zod");
exports.TransactionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    itemId: zod_1.z.string().uuid('物品ID格式不正确'),
    locationId: zod_1.z.string().uuid('库房位置ID格式不正确'),
    type: zod_1.z.enum(['inbound', 'outbound'], {
        errorMap: () => ({ message: '交易类型必须是inbound或outbound' })
    }),
    quantity: zod_1.z.number().positive('数量必须大于0'),
    date: zod_1.z.date(),
    operator: zod_1.z.string().min(1, '操作人不能为空').max(50, '操作人名称不能超过50个字符'),
    supplier: zod_1.z.string().max(100, '供应商名称不能超过100个字符').optional(),
    recipient: zod_1.z.string().max(50, '领用人名称不能超过50个字符').optional(),
    purpose: zod_1.z.string().max(200, '用途说明不能超过200个字符').optional(),
    batchId: zod_1.z.string().uuid('批次ID格式不正确').optional(),
    notes: zod_1.z.string().max(500, '备注不能超过500个字符').optional().default(''),
    createdAt: zod_1.z.date().optional(),
});
exports.CreateTransactionSchema = exports.TransactionSchema.omit({
    id: true,
    createdAt: true,
});
exports.UpdateTransactionSchema = zod_1.z.object({
    operator: zod_1.z.string().min(1, '操作人不能为空').max(50, '操作人名称不能超过50个字符').optional(),
    supplier: zod_1.z.string().max(100, '供应商名称不能超过100个字符').optional(),
    recipient: zod_1.z.string().max(50, '领用人名称不能超过50个字符').optional(),
    purpose: zod_1.z.string().max(200, '用途说明不能超过200个字符').optional(),
    notes: zod_1.z.string().max(500, '备注不能超过500个字符').optional(),
});
exports.BatchTransactionSchema = zod_1.z.object({
    transactions: zod_1.z.array(exports.CreateTransactionSchema),
    batchId: zod_1.z.string().uuid('批次ID格式不正确').optional(),
});
class TransactionModel {
    constructor(data) {
        this.data = exports.TransactionSchema.parse({
            ...data,
            id: data.id || this.generateId(),
            createdAt: data.createdAt || new Date(),
        });
    }
    get id() {
        return this.data.id;
    }
    get itemId() {
        return this.data.itemId;
    }
    get locationId() {
        return this.data.locationId;
    }
    get type() {
        return this.data.type;
    }
    get quantity() {
        return this.data.quantity;
    }
    get date() {
        return this.data.date;
    }
    get operator() {
        return this.data.operator;
    }
    get supplier() {
        return this.data.supplier;
    }
    get recipient() {
        return this.data.recipient;
    }
    get purpose() {
        return this.data.purpose;
    }
    get batchId() {
        return this.data.batchId;
    }
    get notes() {
        return this.data.notes || '';
    }
    get createdAt() {
        return this.data.createdAt;
    }
    toJSON() {
        return { ...this.data };
    }
    static validateCreate(data) {
        return exports.CreateTransactionSchema.parse(data);
    }
    static validateUpdate(data) {
        return exports.UpdateTransactionSchema.parse(data);
    }
    static validateBatch(data) {
        return exports.BatchTransactionSchema.parse(data);
    }
    static validateId(id) {
        return zod_1.z.string().uuid('交易ID格式不正确').parse(id);
    }
    update(updateData) {
        const validatedData = exports.UpdateTransactionSchema.parse(updateData);
        Object.keys(validatedData).forEach(key => {
            if (validatedData[key] !== undefined) {
                this.data[key] = validatedData[key];
            }
        });
    }
    validateBusinessRules() {
        const errors = [];
        if (this.data.type === 'inbound') {
            if (!this.data.supplier) {
                errors.push('入库操作必须指定供应商');
            }
            if (this.data.recipient) {
                errors.push('入库操作不应该有领用人');
            }
        }
        else if (this.data.type === 'outbound') {
            if (!this.data.recipient) {
                errors.push('出库操作必须指定领用人');
            }
            if (!this.data.purpose) {
                errors.push('出库操作必须指定用途');
            }
            if (this.data.supplier) {
                errors.push('出库操作不应该有供应商');
            }
        }
        if (this.data.date > new Date()) {
            errors.push('交易日期不能是未来时间');
        }
        if (this.data.quantity > 1000000) {
            errors.push('单次交易数量不能超过1,000,000');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    calculateInventoryImpact() {
        const quantityChange = this.data.type === 'inbound' ? this.data.quantity : -this.data.quantity;
        return {
            itemId: this.data.itemId,
            locationId: this.data.locationId,
            quantityChange,
            newStock: 0,
        };
    }
    canBeReversed() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (this.data.date < thirtyDaysAgo) {
            return { canReverse: false, reason: '超过30天的交易不能撤销' };
        }
        if (this.data.type === 'outbound') {
            return { canReverse: true };
        }
        return { canReverse: true };
    }
    generateReverseTransaction() {
        const reverseType = this.data.type === 'inbound' ? 'outbound' : 'inbound';
        return {
            itemId: this.data.itemId,
            locationId: this.data.locationId,
            type: reverseType,
            quantity: this.data.quantity,
            date: new Date(),
            operator: this.data.operator,
            supplier: reverseType === 'inbound' ? `撤销-${this.data.recipient || ''}` : undefined,
            recipient: reverseType === 'outbound' ? `撤销-${this.data.supplier || ''}` : undefined,
            purpose: `撤销交易: ${this.data.id}`,
            notes: `撤销原交易 ${this.data.id}`,
        };
    }
    generateId() {
        return crypto.randomUUID();
    }
    static create(data) {
        return new TransactionModel(data);
    }
    static fromDatabase(data) {
        return new TransactionModel(data);
    }
    static createBatch(batchData) {
        const batchId = batchData.batchId || crypto.randomUUID();
        return batchData.transactions.map(transactionData => {
            return new TransactionModel({
                ...transactionData,
                batchId,
            });
        });
    }
    static validateStockAvailability(outboundTransactions, currentStock) {
        const errors = [];
        const stockChanges = {};
        outboundTransactions.forEach(transaction => {
            if (transaction.type === 'outbound') {
                const key = `${transaction.itemId}-${transaction.locationId}`;
                stockChanges[key] = (stockChanges[key] || 0) + transaction.quantity;
            }
        });
        Object.entries(stockChanges).forEach(([key, requiredQuantity]) => {
            const currentStockLevel = currentStock[key] || 0;
            if (currentStockLevel < requiredQuantity) {
                errors.push(`位置 ${key} 库存不足，需要 ${requiredQuantity}，当前库存 ${currentStockLevel}`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static calculateTotalQuantity(transactions, type) {
        return transactions
            .filter(t => !type || t.type === type)
            .reduce((total, t) => total + t.quantity, 0);
    }
    static groupByDate(transactions) {
        const grouped = {};
        transactions.forEach(transaction => {
            const dateKey = transaction.date.toISOString().split('T')[0];
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(transaction);
        });
        return grouped;
    }
    static groupByLocation(transactions) {
        const grouped = {};
        transactions.forEach(transaction => {
            if (!grouped[transaction.locationId]) {
                grouped[transaction.locationId] = [];
            }
            grouped[transaction.locationId].push(transaction);
        });
        return grouped;
    }
}
exports.TransactionModel = TransactionModel;
class TransactionValidationError extends Error {
    constructor(errors) {
        super('Transaction validation failed');
        this.name = 'TransactionValidationError';
        this.errors = errors;
    }
    getFormattedErrors() {
        const formatted = {};
        this.errors.errors.forEach((error) => {
            const path = error.path.join('.');
            formatted[path] = error.message;
        });
        return formatted;
    }
}
exports.TransactionValidationError = TransactionValidationError;
//# sourceMappingURL=Transaction.js.map