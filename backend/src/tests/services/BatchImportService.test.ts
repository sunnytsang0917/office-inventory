import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import BatchImportService from '../../services/BatchImportService';
import ItemService from '../../services/ItemService';
import TransactionService from '../../services/TransactionService';

// Mock dependencies
vi.mock('../../services/ItemService');
vi.mock('../../services/TransactionService');

describe('BatchImportService', () => {
  let batchImportService: BatchImportService;
  let mockPool: Pool;
  let mockClient: any;
  let mockItemService: ItemService;
  let mockTransactionService: TransactionService;

  // Helper function to create Excel buffer
  const createExcelBuffer = (data: any[][]): Buffer => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  };

  beforeEach(() => {
    // Mock database client
    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    // Mock pool
    mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient)
    } as any;

    // Create service instance
    batchImportService = new BatchImportService(mockPool);

    // Get mocked services
    mockItemService = (batchImportService as any).itemService;
    mockTransactionService = (batchImportService as any).transactionService;
    
    // Setup default mocks
    mockItemService.getItemById = vi.fn();
    mockItemService.createItem = vi.fn();
    mockTransactionService.createTransaction = vi.fn();
  });

  describe('importItems', () => {
    it('应该成功批量导入物品', async () => {
      const excelData = [
        ['物品名称', '类别', '单位', '低库存阈值'],
        ['测试物品1', '办公用品', '包', '10'],
        ['测试物品2', '电子设备', '台', '5']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock successful item creation
      (mockItemService.createItem as Mock)
        .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
        .mockResolvedValueOnce({ id: 'item-2', name: '测试物品2' });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await batchImportService.importItems(buffer);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedItems).toEqual(['item-1', 'item-2']);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('应该处理导入错误并回滚事务', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包'],
        ['测试物品2', '电子设备', '台']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock first item success, second item failure
      (mockItemService.createItem as Mock)
        .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
        .mockRejectedValueOnce(new Error('物品创建失败'));

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(batchImportService.importItems(buffer))
        .rejects.toThrow('批量导入在第2个物品时失败');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('应该在skipErrors模式下跳过错误继续处理', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包'],
        ['测试物品2', '电子设备', '台'],
        ['测试物品3', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock first and third item success, second item failure
      (mockItemService.createItem as Mock)
        .mockResolvedValueOnce({ id: 'item-1', name: '测试物品1' })
        .mockRejectedValueOnce(new Error('物品创建失败'))
        .mockResolvedValueOnce({ id: 'item-3', name: '测试物品3' });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await batchImportService.importItems(buffer, { skipErrors: true });

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('物品创建失败');
      expect(result.importedItems).toEqual(['item-1', 'item-3']);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('应该在validateOnly模式下仅验证不执行', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包'],
        ['测试物品2', '电子设备', '台']
      ];

      const buffer = createExcelBuffer(excelData);

      const result = await batchImportService.importItems(buffer, { validateOnly: true });

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockItemService.createItem).not.toHaveBeenCalled();
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('应该处理Excel解析错误', async () => {
      const excelData = [
        ['物品名称', '类别'], // 缺少必需的'单位'列
        ['测试物品1', '办公用品']
      ];

      const buffer = createExcelBuffer(excelData);

      await expect(batchImportService.importItems(buffer))
        .rejects.toThrow('缺少必需的列: 单位');
    });
  });

  describe('importInboundTransactions', () => {
    it('应该成功批量导入入库交易', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商', '备注'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A', '批量采购'],
        ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '50', '2024-01-02', '李四', '供应商B', '补充库存']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock successful transaction creation
      (mockTransactionService.createTransaction as Mock)
        .mockResolvedValueOnce({ id: 'trans-1' })
        .mockResolvedValueOnce({ id: 'trans-2' });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await batchImportService.importInboundTransactions(buffer);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedTransactions).toEqual(['trans-1', 'trans-2']);
    });

    it('应该处理入库交易导入错误', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock transaction creation failure
      (mockTransactionService.createTransaction as Mock)
        .mockRejectedValueOnce(new Error('交易创建失败'));

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(batchImportService.importInboundTransactions(buffer))
        .rejects.toThrow('批量导入在第1个交易时失败');
    });
  });

  describe('importOutboundTransactions', () => {
    it('应该成功批量导入出库交易', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '领用人', '用途', '备注'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '10', '2024-01-01', '张三', '王五', '办公使用', '正常领用'],
        ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '5', '2024-01-02', '李四', '赵六', '项目需要', '紧急领用']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock successful transaction creation
      (mockTransactionService.createTransaction as Mock)
        .mockResolvedValueOnce({ id: 'trans-1' })
        .mockResolvedValueOnce({ id: 'trans-2' });

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await batchImportService.importOutboundTransactions(buffer);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedTransactions).toEqual(['trans-1', 'trans-2']);
    });
  });

  describe('validateImportData', () => {
    it('应该验证物品导入数据', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包'],
        ['', '电子设备', '台'], // 名称为空，应该有错误
        ['测试物品3', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);

      const result = await batchImportService.validateImportData(buffer, 'items');

      expect(result.isValid).toBe(false);
      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该验证入库交易导入数据', async () => {
      const excelData = [
        ['物品ID', '位置ID', '数量', '日期', '操作人', '供应商'],
        ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '100', '2024-01-01', '张三', '供应商A'],
        ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'abc', '2024-01-02', '李四', '供应商B'] // 数量不是数字
      ];

      const buffer = createExcelBuffer(excelData);

      const result = await batchImportService.validateImportData(buffer, 'inbound');

      expect(result.isValid).toBe(false);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getImportTemplate', () => {
    it('应该生成物品导入模板', () => {
      const buffer = batchImportService.getImportTemplate('items');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // 验证模板内容
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('物品导入模板');
      
      const worksheet = workbook.Sheets['物品导入模板'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      expect(data[0]).toEqual(['物品名称', '类别', '规格', '单位', '默认位置ID', '低库存阈值']);
    });

    it('应该生成入库交易模板', () => {
      const buffer = batchImportService.getImportTemplate('inbound');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('入库交易模板');
    });

    it('应该生成出库交易模板', () => {
      const buffer = batchImportService.getImportTemplate('outbound');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('出库交易模板');
    });

    it('应该在不支持的模板类型时抛出错误', () => {
      expect(() => batchImportService.getImportTemplate('invalid' as any))
        .toThrow('不支持的模板类型');
    });
  });

  describe('checkImportPrerequisites', () => {
    it('应该检查导入前置条件', async () => {
      const transactions = [
        {
          itemId: '550e8400-e29b-41d4-a716-446655440001',
          locationId: '550e8400-e29b-41d4-a716-446655440011',
          type: 'outbound' as const,
          quantity: 10,
          date: new Date('2024-01-01'),
          operator: '张三',
          recipient: '王五',
          purpose: '办公使用',
          notes: ''
        }
      ];

      // Mock item service to return item exists
      (mockItemService.getItemById as Mock)
        .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440001', name: '测试物品' });

      const result = await batchImportService.checkImportPrerequisites(transactions);

      expect(result.missingItems).toHaveLength(0);
      expect(mockItemService.getItemById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
    });

    it('应该检测缺失的物品', async () => {
      const transactions = [
        {
          itemId: 'non-existent-item',
          locationId: '550e8400-e29b-41d4-a716-446655440011',
          type: 'inbound' as const,
          quantity: 10,
          date: new Date('2024-01-01'),
          operator: '张三',
          supplier: '供应商A',
          notes: ''
        }
      ];

      // Mock item service to throw error (item not found)
      (mockItemService.getItemById as Mock)
        .mockRejectedValueOnce(new Error('物品不存在'));

      const result = await batchImportService.checkImportPrerequisites(transactions);

      expect(result.isValid).toBe(false);
      expect(result.missingItems).toContain('non-existent-item');
    });
  });

  describe('批次处理', () => {
    it('应该按指定批次大小处理数据', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包'],
        ['测试物品2', '电子设备', '台'],
        ['测试物品3', '办公用品', '包'],
        ['测试物品4', '电子设备', '台'],
        ['测试物品5', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock successful item creation
      (mockItemService.createItem as Mock)
        .mockResolvedValue({ id: 'item-id' });

      // Mock transaction - should be called multiple times for different batches
      mockClient.query
        .mockResolvedValue(undefined);

      const result = await batchImportService.importItems(buffer, { batchSize: 2 });

      expect(result.success).toBe(5);
      expect(result.failed).toBe(0);
      
      // Should have called BEGIN/COMMIT multiple times for different batches
      const beginCalls = mockClient.query.mock.calls.filter(call => call[0] === 'BEGIN');
      const commitCalls = mockClient.query.mock.calls.filter(call => call[0] === 'COMMIT');
      
      expect(beginCalls.length).toBeGreaterThan(1);
      expect(commitCalls.length).toBeGreaterThan(1);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的Excel文件', async () => {
      const invalidBuffer = Buffer.from('这不是一个Excel文件');
      
      await expect(batchImportService.importItems(invalidBuffer))
        .rejects.toThrow('批量导入物品失败');
    });

    it('应该处理数据库连接错误', async () => {
      const excelData = [
        ['物品名称', '类别', '单位'],
        ['测试物品1', '办公用品', '包']
      ];

      const buffer = createExcelBuffer(excelData);

      // Mock pool connection failure
      (mockPool.connect as Mock).mockRejectedValueOnce(new Error('数据库连接失败'));

      await expect(batchImportService.importItems(buffer))
        .rejects.toThrow('批量导入物品失败');
    });
  });
});