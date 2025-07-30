"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Transaction_1 = require("../Transaction");
(0, vitest_1.describe)('TransactionModel', () => {
    let validInboundData;
    let validOutboundData;
    (0, vitest_1.beforeEach)(() => {
        validInboundData = {
            itemId: '123e4567-e89b-12d3-a456-426614174000',
            locationId: '123e4567-e89b-12d3-a456-426614174001',
            type: 'inbound',
            quantity: 100,
            date: new Date('2024-01-15'),
            operator: '张三',
            supplier: '供应商A',
            notes: '入库备注',
        };
        validOutboundData = {
            itemId: '123e4567-e89b-12d3-a456-426614174000',
            locationId: '123e4567-e89b-12d3-a456-426614174001',
            type: 'outbound',
            quantity: 50,
            date: new Date('2024-01-16'),
            operator: '李四',
            recipient: '王五',
            purpose: '办公使用',
            notes: '出库备注',
        };
    });
    (0, vitest_1.describe)('创建交易', () => {
        (0, vitest_1.it)('应该成功创建入库交易', () => {
            const transaction = Transaction_1.TransactionModel.create(validInboundData);
            (0, vitest_1.expect)(transaction.itemId).toBe(validInboundData.itemId);
            (0, vitest_1.expect)(transaction.locationId).toBe(validInboundData.locationId);
            (0, vitest_1.expect)(transaction.type).toBe(validInboundData.type);
            (0, vitest_1.expect)(transaction.quantity).toBe(validInboundData.quantity);
            (0, vitest_1.expect)(transaction.date).toEqual(validInboundData.date);
            (0, vitest_1.expect)(transaction.operator).toBe(validInboundData.operator);
            (0, vitest_1.expect)(transaction.supplier).toBe(validInboundData.supplier);
            (0, vitest_1.expect)(transaction.notes).toBe(validInboundData.notes);
            (0, vitest_1.expect)(transaction.id).toBeDefined();
            (0, vitest_1.expect)(transaction.createdAt).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('应该成功创建出库交易', () => {
            const transaction = Transaction_1.TransactionModel.create(validOutboundData);
            (0, vitest_1.expect)(transaction.itemId).toBe(validOutboundData.itemId);
            (0, vitest_1.expect)(transaction.locationId).toBe(validOutboundData.locationId);
            (0, vitest_1.expect)(transaction.type).toBe(validOutboundData.type);
            (0, vitest_1.expect)(transaction.quantity).toBe(validOutboundData.quantity);
            (0, vitest_1.expect)(transaction.date).toEqual(validOutboundData.date);
            (0, vitest_1.expect)(transaction.operator).toBe(validOutboundData.operator);
            (0, vitest_1.expect)(transaction.recipient).toBe(validOutboundData.recipient);
            (0, vitest_1.expect)(transaction.purpose).toBe(validOutboundData.purpose);
            (0, vitest_1.expect)(transaction.notes).toBe(validOutboundData.notes);
        });
        (0, vitest_1.it)('应该为可选字段设置默认值', () => {
            const minimalData = {
                itemId: '123e4567-e89b-12d3-a456-426614174000',
                locationId: '123e4567-e89b-12d3-a456-426614174001',
                type: 'inbound',
                quantity: 10,
                date: new Date(),
                operator: '操作员',
                supplier: '供应商',
            };
            const transaction = Transaction_1.TransactionModel.create(minimalData);
            (0, vitest_1.expect)(transaction.notes).toBe('');
            (0, vitest_1.expect)(transaction.recipient).toBeUndefined();
            (0, vitest_1.expect)(transaction.purpose).toBeUndefined();
            (0, vitest_1.expect)(transaction.batchId).toBeUndefined();
        });
        (0, vitest_1.it)('应该生成唯一的ID', () => {
            const transaction1 = Transaction_1.TransactionModel.create(validInboundData);
            const transaction2 = Transaction_1.TransactionModel.create(validInboundData);
            (0, vitest_1.expect)(transaction1.id).not.toBe(transaction2.id);
            (0, vitest_1.expect)(transaction1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });
    });
    (0, vitest_1.describe)('数据验证', () => {
        (0, vitest_1.it)('应该拒绝无效的物品ID', () => {
            const invalidData = { ...validInboundData, itemId: 'invalid-uuid' };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝无效的位置ID', () => {
            const invalidData = { ...validInboundData, locationId: 'invalid-uuid' };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝无效的交易类型', () => {
            const invalidData = { ...validInboundData, type: 'invalid' };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝零或负数数量', () => {
            const invalidData1 = { ...validInboundData, quantity: 0 };
            const invalidData2 = { ...validInboundData, quantity: -10 };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData1)).toThrow();
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData2)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝空的操作人', () => {
            const invalidData = { ...validInboundData, operator: '' };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝过长的操作人名称', () => {
            const invalidData = { ...validInboundData, operator: 'a'.repeat(51) };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝过长的供应商名称', () => {
            const invalidData = { ...validInboundData, supplier: 'a'.repeat(101) };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝过长的领用人名称', () => {
            const invalidData = { ...validOutboundData, recipient: 'a'.repeat(51) };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝过长的用途说明', () => {
            const invalidData = { ...validOutboundData, purpose: 'a'.repeat(201) };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
        (0, vitest_1.it)('应该拒绝过长的备注', () => {
            const invalidData = { ...validInboundData, notes: 'a'.repeat(501) };
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateCreate(invalidData)).toThrow();
        });
    });
    (0, vitest_1.describe)('更新交易', () => {
        let transaction;
        (0, vitest_1.beforeEach)(() => {
            transaction = Transaction_1.TransactionModel.create(validInboundData);
        });
        (0, vitest_1.it)('应该成功更新允许的字段', () => {
            const updateData = {
                operator: '更新后的操作员',
                supplier: '更新后的供应商',
                notes: '更新后的备注',
            };
            transaction.update(updateData);
            (0, vitest_1.expect)(transaction.operator).toBe(updateData.operator);
            (0, vitest_1.expect)(transaction.supplier).toBe(updateData.supplier);
            (0, vitest_1.expect)(transaction.notes).toBe(updateData.notes);
            (0, vitest_1.expect)(transaction.quantity).toBe(validInboundData.quantity);
            (0, vitest_1.expect)(transaction.type).toBe(validInboundData.type);
        });
        (0, vitest_1.it)('应该允许部分更新', () => {
            const updateData = {
                notes: '仅更新备注',
            };
            transaction.update(updateData);
            (0, vitest_1.expect)(transaction.notes).toBe(updateData.notes);
            (0, vitest_1.expect)(transaction.operator).toBe(validInboundData.operator);
        });
        (0, vitest_1.it)('应该验证更新数据', () => {
            const invalidUpdateData = {
                operator: '',
            };
            (0, vitest_1.expect)(() => transaction.update(invalidUpdateData)).toThrow();
        });
    });
    (0, vitest_1.describe)('业务规则验证', () => {
        (0, vitest_1.it)('应该验证入库交易的业务规则', () => {
            const transaction = Transaction_1.TransactionModel.create(validInboundData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('应该验证出库交易的业务规则', () => {
            const transaction = Transaction_1.TransactionModel.create(validOutboundData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('应该拒绝入库交易缺少供应商', () => {
            const invalidData = { ...validInboundData };
            delete invalidData.supplier;
            const transaction = Transaction_1.TransactionModel.create(invalidData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('入库操作必须指定供应商');
        });
        (0, vitest_1.it)('应该拒绝出库交易缺少领用人', () => {
            const invalidData = { ...validOutboundData };
            delete invalidData.recipient;
            const transaction = Transaction_1.TransactionModel.create(invalidData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('出库操作必须指定领用人');
        });
        (0, vitest_1.it)('应该拒绝出库交易缺少用途', () => {
            const invalidData = { ...validOutboundData };
            delete invalidData.purpose;
            const transaction = Transaction_1.TransactionModel.create(invalidData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('出库操作必须指定用途');
        });
        (0, vitest_1.it)('应该拒绝未来日期的交易', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const invalidData = { ...validInboundData, date: futureDate };
            const transaction = Transaction_1.TransactionModel.create(invalidData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('交易日期不能是未来时间');
        });
        (0, vitest_1.it)('应该拒绝过大的数量', () => {
            const invalidData = { ...validInboundData, quantity: 2000000 };
            const transaction = Transaction_1.TransactionModel.create(invalidData);
            const result = transaction.validateBusinessRules();
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('单次交易数量不能超过1,000,000');
        });
    });
    (0, vitest_1.describe)('库存影响计算', () => {
        (0, vitest_1.it)('应该正确计算入库交易的库存影响', () => {
            const transaction = Transaction_1.TransactionModel.create(validInboundData);
            const impact = transaction.calculateInventoryImpact();
            (0, vitest_1.expect)(impact.itemId).toBe(validInboundData.itemId);
            (0, vitest_1.expect)(impact.locationId).toBe(validInboundData.locationId);
            (0, vitest_1.expect)(impact.quantityChange).toBe(validInboundData.quantity);
        });
        (0, vitest_1.it)('应该正确计算出库交易的库存影响', () => {
            const transaction = Transaction_1.TransactionModel.create(validOutboundData);
            const impact = transaction.calculateInventoryImpact();
            (0, vitest_1.expect)(impact.itemId).toBe(validOutboundData.itemId);
            (0, vitest_1.expect)(impact.locationId).toBe(validOutboundData.locationId);
            (0, vitest_1.expect)(impact.quantityChange).toBe(-validOutboundData.quantity);
        });
    });
    (0, vitest_1.describe)('交易撤销', () => {
        (0, vitest_1.it)('应该允许撤销最近的交易', () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 1);
            const recentTransaction = Transaction_1.TransactionModel.create({
                ...validInboundData,
                date: recentDate,
            });
            const result = recentTransaction.canBeReversed();
            (0, vitest_1.expect)(result.canReverse).toBe(true);
        });
        (0, vitest_1.it)('应该拒绝撤销过期的交易', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);
            const oldTransaction = Transaction_1.TransactionModel.create({
                ...validInboundData,
                date: oldDate,
            });
            const result = oldTransaction.canBeReversed();
            (0, vitest_1.expect)(result.canReverse).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('超过30天的交易不能撤销');
        });
        (0, vitest_1.it)('应该生成正确的撤销交易', () => {
            const transaction = Transaction_1.TransactionModel.create(validInboundData);
            const reverseTransaction = transaction.generateReverseTransaction();
            (0, vitest_1.expect)(reverseTransaction.type).toBe('outbound');
            (0, vitest_1.expect)(reverseTransaction.quantity).toBe(validInboundData.quantity);
            (0, vitest_1.expect)(reverseTransaction.itemId).toBe(validInboundData.itemId);
            (0, vitest_1.expect)(reverseTransaction.locationId).toBe(validInboundData.locationId);
            (0, vitest_1.expect)(reverseTransaction.purpose).toContain('撤销交易');
        });
    });
    (0, vitest_1.describe)('批量操作', () => {
        (0, vitest_1.it)('应该创建批量交易', () => {
            const batchData = {
                transactions: [validInboundData, validOutboundData],
            };
            const transactions = Transaction_1.TransactionModel.createBatch(batchData);
            (0, vitest_1.expect)(transactions).toHaveLength(2);
            (0, vitest_1.expect)(transactions[0].batchId).toBeDefined();
            (0, vitest_1.expect)(transactions[1].batchId).toBe(transactions[0].batchId);
        });
        (0, vitest_1.it)('应该验证库存可用性', () => {
            const outboundTransactions = [
                Transaction_1.TransactionModel.create(validOutboundData),
                Transaction_1.TransactionModel.create({ ...validOutboundData, quantity: 30 }),
            ];
            const currentStock = {
                [`${validOutboundData.itemId}-${validOutboundData.locationId}`]: 100,
            };
            const result = Transaction_1.TransactionModel.validateStockAvailability(outboundTransactions, currentStock);
            (0, vitest_1.expect)(result.isValid).toBe(true);
        });
        (0, vitest_1.it)('应该检测库存不足', () => {
            const outboundTransactions = [
                Transaction_1.TransactionModel.create({ ...validOutboundData, quantity: 60 }),
                Transaction_1.TransactionModel.create({ ...validOutboundData, quantity: 50 }),
            ];
            const currentStock = {
                [`${validOutboundData.itemId}-${validOutboundData.locationId}`]: 100,
            };
            const result = Transaction_1.TransactionModel.validateStockAvailability(outboundTransactions, currentStock);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors[0]).toContain('库存不足');
        });
    });
    (0, vitest_1.describe)('统计方法', () => {
        let transactions;
        (0, vitest_1.beforeEach)(() => {
            transactions = [
                Transaction_1.TransactionModel.create(validInboundData),
                Transaction_1.TransactionModel.create(validOutboundData),
                Transaction_1.TransactionModel.create({ ...validInboundData, quantity: 200 }),
            ];
        });
        (0, vitest_1.it)('应该计算总数量', () => {
            const totalInbound = Transaction_1.TransactionModel.calculateTotalQuantity(transactions, 'inbound');
            const totalOutbound = Transaction_1.TransactionModel.calculateTotalQuantity(transactions, 'outbound');
            const totalAll = Transaction_1.TransactionModel.calculateTotalQuantity(transactions);
            (0, vitest_1.expect)(totalInbound).toBe(300);
            (0, vitest_1.expect)(totalOutbound).toBe(50);
            (0, vitest_1.expect)(totalAll).toBe(350);
        });
        (0, vitest_1.it)('应该按日期分组', () => {
            const grouped = Transaction_1.TransactionModel.groupByDate(transactions);
            (0, vitest_1.expect)(Object.keys(grouped)).toHaveLength(2);
            (0, vitest_1.expect)(grouped['2024-01-15']).toHaveLength(2);
            (0, vitest_1.expect)(grouped['2024-01-16']).toHaveLength(1);
        });
        (0, vitest_1.it)('应该按位置分组', () => {
            const grouped = Transaction_1.TransactionModel.groupByLocation(transactions);
            (0, vitest_1.expect)(Object.keys(grouped)).toHaveLength(1);
            (0, vitest_1.expect)(grouped[validInboundData.locationId]).toHaveLength(3);
        });
    });
    (0, vitest_1.describe)('静态验证方法', () => {
        (0, vitest_1.it)('应该验证创建数据', () => {
            const validData = Transaction_1.TransactionModel.validateCreate(validInboundData);
            (0, vitest_1.expect)(validData.itemId).toBe(validInboundData.itemId);
            (0, vitest_1.expect)(validData.type).toBe(validInboundData.type);
        });
        (0, vitest_1.it)('应该验证更新数据', () => {
            const updateData = { operator: '新操作员' };
            const validData = Transaction_1.TransactionModel.validateUpdate(updateData);
            (0, vitest_1.expect)(validData.operator).toBe(updateData.operator);
        });
        (0, vitest_1.it)('应该验证批量数据', () => {
            const batchData = {
                transactions: [validInboundData],
            };
            const validData = Transaction_1.TransactionModel.validateBatch(batchData);
            (0, vitest_1.expect)(validData.transactions).toHaveLength(1);
        });
        (0, vitest_1.it)('应该验证ID格式', () => {
            const validId = '123e4567-e89b-12d3-a456-426614174000';
            (0, vitest_1.expect)(Transaction_1.TransactionModel.validateId(validId)).toBe(validId);
            (0, vitest_1.expect)(() => Transaction_1.TransactionModel.validateId('invalid-id')).toThrow();
        });
    });
    (0, vitest_1.describe)('数据序列化', () => {
        (0, vitest_1.it)('应该正确序列化为JSON', () => {
            const transaction = Transaction_1.TransactionModel.create(validInboundData);
            const json = transaction.toJSON();
            (0, vitest_1.expect)(json).toHaveProperty('id');
            (0, vitest_1.expect)(json).toHaveProperty('itemId', validInboundData.itemId);
            (0, vitest_1.expect)(json).toHaveProperty('locationId', validInboundData.locationId);
            (0, vitest_1.expect)(json).toHaveProperty('type', validInboundData.type);
            (0, vitest_1.expect)(json).toHaveProperty('quantity', validInboundData.quantity);
            (0, vitest_1.expect)(json).toHaveProperty('operator', validInboundData.operator);
            (0, vitest_1.expect)(json).toHaveProperty('createdAt');
        });
    });
    (0, vitest_1.describe)('从数据库创建', () => {
        (0, vitest_1.it)('应该从数据库数据创建交易实例', () => {
            const dbData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                itemId: '123e4567-e89b-12d3-a456-426614174001',
                locationId: '123e4567-e89b-12d3-a456-426614174002',
                type: 'inbound',
                quantity: 150,
                date: new Date('2024-01-10'),
                operator: '数据库操作员',
                supplier: '数据库供应商',
                notes: '数据库备注',
                createdAt: new Date('2024-01-10T10:00:00Z'),
            };
            const transaction = Transaction_1.TransactionModel.fromDatabase(dbData);
            (0, vitest_1.expect)(transaction.id).toBe(dbData.id);
            (0, vitest_1.expect)(transaction.itemId).toBe(dbData.itemId);
            (0, vitest_1.expect)(transaction.locationId).toBe(dbData.locationId);
            (0, vitest_1.expect)(transaction.type).toBe(dbData.type);
            (0, vitest_1.expect)(transaction.quantity).toBe(dbData.quantity);
            (0, vitest_1.expect)(transaction.operator).toBe(dbData.operator);
            (0, vitest_1.expect)(transaction.supplier).toBe(dbData.supplier);
            (0, vitest_1.expect)(transaction.notes).toBe(dbData.notes);
            (0, vitest_1.expect)(transaction.createdAt).toEqual(dbData.createdAt);
        });
    });
});
//# sourceMappingURL=Transaction.test.js.map