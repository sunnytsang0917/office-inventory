import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionModel, CreateTransactionDto, UpdateTransactionDto, BatchTransactionDto } from '../Transaction';

describe('TransactionModel', () => {
  let validInboundData: CreateTransactionDto;
  let validOutboundData: CreateTransactionDto;

  beforeEach(() => {
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

  describe('创建交易', () => {
    it('应该成功创建入库交易', () => {
      const transaction = TransactionModel.create(validInboundData);
      
      expect(transaction.itemId).toBe(validInboundData.itemId);
      expect(transaction.locationId).toBe(validInboundData.locationId);
      expect(transaction.type).toBe(validInboundData.type);
      expect(transaction.quantity).toBe(validInboundData.quantity);
      expect(transaction.date).toEqual(validInboundData.date);
      expect(transaction.operator).toBe(validInboundData.operator);
      expect(transaction.supplier).toBe(validInboundData.supplier);
      expect(transaction.notes).toBe(validInboundData.notes);
      expect(transaction.id).toBeDefined();
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it('应该成功创建出库交易', () => {
      const transaction = TransactionModel.create(validOutboundData);
      
      expect(transaction.itemId).toBe(validOutboundData.itemId);
      expect(transaction.locationId).toBe(validOutboundData.locationId);
      expect(transaction.type).toBe(validOutboundData.type);
      expect(transaction.quantity).toBe(validOutboundData.quantity);
      expect(transaction.date).toEqual(validOutboundData.date);
      expect(transaction.operator).toBe(validOutboundData.operator);
      expect(transaction.recipient).toBe(validOutboundData.recipient);
      expect(transaction.purpose).toBe(validOutboundData.purpose);
      expect(transaction.notes).toBe(validOutboundData.notes);
    });

    it('应该为可选字段设置默认值', () => {
      const minimalData = {
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        locationId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'inbound' as const,
        quantity: 10,
        date: new Date(),
        operator: '操作员',
        supplier: '供应商',
      };
      
      const transaction = TransactionModel.create(minimalData);
      
      expect(transaction.notes).toBe('');
      expect(transaction.recipient).toBeUndefined();
      expect(transaction.purpose).toBeUndefined();
      expect(transaction.batchId).toBeUndefined();
    });

    it('应该生成唯一的ID', () => {
      const transaction1 = TransactionModel.create(validInboundData);
      const transaction2 = TransactionModel.create(validInboundData);
      
      expect(transaction1.id).not.toBe(transaction2.id);
      expect(transaction1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('数据验证', () => {
    it('应该拒绝无效的物品ID', () => {
      const invalidData = { ...validInboundData, itemId: 'invalid-uuid' };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝无效的位置ID', () => {
      const invalidData = { ...validInboundData, locationId: 'invalid-uuid' };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝无效的交易类型', () => {
      const invalidData = { ...validInboundData, type: 'invalid' as any };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝零或负数数量', () => {
      const invalidData1 = { ...validInboundData, quantity: 0 };
      const invalidData2 = { ...validInboundData, quantity: -10 };
      
      expect(() => TransactionModel.validateCreate(invalidData1)).toThrow();
      expect(() => TransactionModel.validateCreate(invalidData2)).toThrow();
    });

    it('应该拒绝空的操作人', () => {
      const invalidData = { ...validInboundData, operator: '' };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝过长的操作人名称', () => {
      const invalidData = { ...validInboundData, operator: 'a'.repeat(51) };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝过长的供应商名称', () => {
      const invalidData = { ...validInboundData, supplier: 'a'.repeat(101) };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝过长的领用人名称', () => {
      const invalidData = { ...validOutboundData, recipient: 'a'.repeat(51) };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝过长的用途说明', () => {
      const invalidData = { ...validOutboundData, purpose: 'a'.repeat(201) };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });

    it('应该拒绝过长的备注', () => {
      const invalidData = { ...validInboundData, notes: 'a'.repeat(501) };
      
      expect(() => TransactionModel.validateCreate(invalidData)).toThrow();
    });
  });

  describe('更新交易', () => {
    let transaction: TransactionModel;

    beforeEach(() => {
      transaction = TransactionModel.create(validInboundData);
    });

    it('应该成功更新允许的字段', () => {
      const updateData: UpdateTransactionDto = {
        operator: '更新后的操作员',
        supplier: '更新后的供应商',
        notes: '更新后的备注',
      };

      transaction.update(updateData);
      
      expect(transaction.operator).toBe(updateData.operator);
      expect(transaction.supplier).toBe(updateData.supplier);
      expect(transaction.notes).toBe(updateData.notes);
      
      // 其他字段应该保持不变
      expect(transaction.quantity).toBe(validInboundData.quantity);
      expect(transaction.type).toBe(validInboundData.type);
    });

    it('应该允许部分更新', () => {
      const updateData: UpdateTransactionDto = {
        notes: '仅更新备注',
      };

      transaction.update(updateData);
      
      expect(transaction.notes).toBe(updateData.notes);
      expect(transaction.operator).toBe(validInboundData.operator);
    });

    it('应该验证更新数据', () => {
      const invalidUpdateData = {
        operator: '', // 空操作员应该被拒绝
      };

      expect(() => transaction.update(invalidUpdateData)).toThrow();
    });
  });

  describe('业务规则验证', () => {
    it('应该验证入库交易的业务规则', () => {
      const transaction = TransactionModel.create(validInboundData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该验证出库交易的业务规则', () => {
      const transaction = TransactionModel.create(validOutboundData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝入库交易缺少供应商', () => {
      const invalidData = { ...validInboundData };
      delete invalidData.supplier;
      
      const transaction = TransactionModel.create(invalidData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('入库操作必须指定供应商');
    });

    it('应该拒绝出库交易缺少领用人', () => {
      const invalidData = { ...validOutboundData };
      delete invalidData.recipient;
      
      const transaction = TransactionModel.create(invalidData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('出库操作必须指定领用人');
    });

    it('应该拒绝出库交易缺少用途', () => {
      const invalidData = { ...validOutboundData };
      delete invalidData.purpose;
      
      const transaction = TransactionModel.create(invalidData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('出库操作必须指定用途');
    });

    it('应该拒绝未来日期的交易', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidData = { ...validInboundData, date: futureDate };
      const transaction = TransactionModel.create(invalidData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('交易日期不能是未来时间');
    });

    it('应该拒绝过大的数量', () => {
      const invalidData = { ...validInboundData, quantity: 2000000 };
      const transaction = TransactionModel.create(invalidData);
      const result = transaction.validateBusinessRules();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('单次交易数量不能超过1,000,000');
    });
  });

  describe('库存影响计算', () => {
    it('应该正确计算入库交易的库存影响', () => {
      const transaction = TransactionModel.create(validInboundData);
      const impact = transaction.calculateInventoryImpact();
      
      expect(impact.itemId).toBe(validInboundData.itemId);
      expect(impact.locationId).toBe(validInboundData.locationId);
      expect(impact.quantityChange).toBe(validInboundData.quantity);
    });

    it('应该正确计算出库交易的库存影响', () => {
      const transaction = TransactionModel.create(validOutboundData);
      const impact = transaction.calculateInventoryImpact();
      
      expect(impact.itemId).toBe(validOutboundData.itemId);
      expect(impact.locationId).toBe(validOutboundData.locationId);
      expect(impact.quantityChange).toBe(-validOutboundData.quantity);
    });
  });

  describe('交易撤销', () => {
    it('应该允许撤销最近的交易', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);
      
      const recentTransaction = TransactionModel.create({
        ...validInboundData,
        date: recentDate,
      });
      
      const result = recentTransaction.canBeReversed();
      expect(result.canReverse).toBe(true);
    });

    it('应该拒绝撤销过期的交易', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      
      const oldTransaction = TransactionModel.create({
        ...validInboundData,
        date: oldDate,
      });
      
      const result = oldTransaction.canBeReversed();
      expect(result.canReverse).toBe(false);
      expect(result.reason).toContain('超过30天的交易不能撤销');
    });

    it('应该生成正确的撤销交易', () => {
      const transaction = TransactionModel.create(validInboundData);
      const reverseTransaction = transaction.generateReverseTransaction();
      
      expect(reverseTransaction.type).toBe('outbound');
      expect(reverseTransaction.quantity).toBe(validInboundData.quantity);
      expect(reverseTransaction.itemId).toBe(validInboundData.itemId);
      expect(reverseTransaction.locationId).toBe(validInboundData.locationId);
      expect(reverseTransaction.purpose).toContain('撤销交易');
    });
  });

  describe('批量操作', () => {
    it('应该创建批量交易', () => {
      const batchData: BatchTransactionDto = {
        transactions: [validInboundData, validOutboundData],
      };
      
      const transactions = TransactionModel.createBatch(batchData);
      
      expect(transactions).toHaveLength(2);
      expect(transactions[0].batchId).toBeDefined();
      expect(transactions[1].batchId).toBe(transactions[0].batchId);
    });

    it('应该验证库存可用性', () => {
      const outboundTransactions = [
        TransactionModel.create(validOutboundData),
        TransactionModel.create({ ...validOutboundData, quantity: 30 }),
      ];
      
      const currentStock = {
        [`${validOutboundData.itemId}-${validOutboundData.locationId}`]: 100,
      };
      
      const result = TransactionModel.validateStockAvailability(outboundTransactions, currentStock);
      expect(result.isValid).toBe(true);
    });

    it('应该检测库存不足', () => {
      const outboundTransactions = [
        TransactionModel.create({ ...validOutboundData, quantity: 60 }),
        TransactionModel.create({ ...validOutboundData, quantity: 50 }),
      ];
      
      const currentStock = {
        [`${validOutboundData.itemId}-${validOutboundData.locationId}`]: 100,
      };
      
      const result = TransactionModel.validateStockAvailability(outboundTransactions, currentStock);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('库存不足');
    });
  });

  describe('统计方法', () => {
    let transactions: TransactionModel[];

    beforeEach(() => {
      transactions = [
        TransactionModel.create(validInboundData),
        TransactionModel.create(validOutboundData),
        TransactionModel.create({ ...validInboundData, quantity: 200 }),
      ];
    });

    it('应该计算总数量', () => {
      const totalInbound = TransactionModel.calculateTotalQuantity(transactions, 'inbound');
      const totalOutbound = TransactionModel.calculateTotalQuantity(transactions, 'outbound');
      const totalAll = TransactionModel.calculateTotalQuantity(transactions);
      
      expect(totalInbound).toBe(300); // 100 + 200
      expect(totalOutbound).toBe(50);
      expect(totalAll).toBe(350); // 100 + 50 + 200
    });

    it('应该按日期分组', () => {
      const grouped = TransactionModel.groupByDate(transactions);
      
      expect(Object.keys(grouped)).toHaveLength(2); // 两个不同的日期
      expect(grouped['2024-01-15']).toHaveLength(2); // 两个入库交易
      expect(grouped['2024-01-16']).toHaveLength(1); // 一个出库交易
    });

    it('应该按位置分组', () => {
      const grouped = TransactionModel.groupByLocation(transactions);
      
      expect(Object.keys(grouped)).toHaveLength(1); // 所有交易都在同一位置
      expect(grouped[validInboundData.locationId]).toHaveLength(3);
    });
  });

  describe('静态验证方法', () => {
    it('应该验证创建数据', () => {
      const validData = TransactionModel.validateCreate(validInboundData);
      expect(validData.itemId).toBe(validInboundData.itemId);
      expect(validData.type).toBe(validInboundData.type);
    });

    it('应该验证更新数据', () => {
      const updateData = { operator: '新操作员' };
      const validData = TransactionModel.validateUpdate(updateData);
      expect(validData.operator).toBe(updateData.operator);
    });

    it('应该验证批量数据', () => {
      const batchData: BatchTransactionDto = {
        transactions: [validInboundData],
      };
      const validData = TransactionModel.validateBatch(batchData);
      expect(validData.transactions).toHaveLength(1);
    });

    it('应该验证ID格式', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      expect(TransactionModel.validateId(validId)).toBe(validId);
      
      expect(() => TransactionModel.validateId('invalid-id')).toThrow();
    });
  });

  describe('数据序列化', () => {
    it('应该正确序列化为JSON', () => {
      const transaction = TransactionModel.create(validInboundData);
      const json = transaction.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('itemId', validInboundData.itemId);
      expect(json).toHaveProperty('locationId', validInboundData.locationId);
      expect(json).toHaveProperty('type', validInboundData.type);
      expect(json).toHaveProperty('quantity', validInboundData.quantity);
      expect(json).toHaveProperty('operator', validInboundData.operator);
      expect(json).toHaveProperty('createdAt');
    });
  });

  describe('从数据库创建', () => {
    it('应该从数据库数据创建交易实例', () => {
      const dbData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        itemId: '123e4567-e89b-12d3-a456-426614174001',
        locationId: '123e4567-e89b-12d3-a456-426614174002',
        type: 'inbound' as const,
        quantity: 150,
        date: new Date('2024-01-10'),
        operator: '数据库操作员',
        supplier: '数据库供应商',
        notes: '数据库备注',
        createdAt: new Date('2024-01-10T10:00:00Z'),
      };

      const transaction = TransactionModel.fromDatabase(dbData);
      
      expect(transaction.id).toBe(dbData.id);
      expect(transaction.itemId).toBe(dbData.itemId);
      expect(transaction.locationId).toBe(dbData.locationId);
      expect(transaction.type).toBe(dbData.type);
      expect(transaction.quantity).toBe(dbData.quantity);
      expect(transaction.operator).toBe(dbData.operator);
      expect(transaction.supplier).toBe(dbData.supplier);
      expect(transaction.notes).toBe(dbData.notes);
      expect(transaction.createdAt).toEqual(dbData.createdAt);
    });
  });
});