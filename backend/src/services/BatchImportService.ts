import { Pool } from 'pg';
import ExcelService from './ExcelService';
import ItemService from './ItemService';
import TransactionService from './TransactionService';
import { ItemData } from '../models/Item';
import { CreateTransactionDto } from '../models/Transaction';
import { BatchResult } from '../types';

// 批量导入结果接口
export interface BatchImportResult extends BatchResult {
  importedItems?: string[];
  importedTransactions?: string[];
}

// 批量导入选项
export interface BatchImportOptions {
  skipErrors?: boolean; // 是否跳过错误继续处理
  validateOnly?: boolean; // 仅验证不执行
  batchSize?: number; // 批次大小
}

export class BatchImportService {
  private excelService: ExcelService;
  private itemService: ItemService;
  private transactionService: TransactionService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.excelService = new ExcelService();
    this.itemService = new ItemService();
    this.transactionService = new TransactionService();
  }

  /**
   * 批量导入物品
   */
  async importItems(
    buffer: Buffer, 
    options: BatchImportOptions = {}
  ): Promise<BatchImportResult> {
    const { skipErrors = false, validateOnly = false, batchSize = 100 } = options;
    
    try {
      // 解析Excel文件
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

      // 批量处理数据
      const result: BatchImportResult = {
        success: 0,
        failed: 0,
        errors: [],
        importedItems: []
      };

      // 分批处理
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);
        const batchResult = await this.processBatchItems(batch, skipErrors);
        
        result.success += batchResult.success;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);
        if (batchResult.importedItems) {
          result.importedItems!.push(...batchResult.importedItems);
        }
      }

      return result;

    } catch (error) {
      throw new Error(`批量导入物品失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量导入入库交易
   */
  async importInboundTransactions(
    buffer: Buffer,
    options: BatchImportOptions = {}
  ): Promise<BatchImportResult> {
    return this.importTransactions(buffer, 'inbound', options);
  }

  /**
   * 批量导入出库交易
   */
  async importOutboundTransactions(
    buffer: Buffer,
    options: BatchImportOptions = {}
  ): Promise<BatchImportResult> {
    return this.importTransactions(buffer, 'outbound', options);
  }

  /**
   * 通用批量导入交易方法
   */
  private async importTransactions(
    buffer: Buffer,
    type: 'inbound' | 'outbound',
    options: BatchImportOptions = {}
  ): Promise<BatchImportResult> {
    const { skipErrors = false, validateOnly = false, batchSize = 50 } = options;
    
    try {
      // 解析Excel文件
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

      // 批量处理数据
      const result: BatchImportResult = {
        success: 0,
        failed: 0,
        errors: [],
        importedTransactions: []
      };

      // 分批处理
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);
        const batchResult = await this.processBatchTransactions(batch, skipErrors);
        
        result.success += batchResult.success;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);
        if (batchResult.importedTransactions) {
          result.importedTransactions!.push(...batchResult.importedTransactions);
        }
      }

      return result;

    } catch (error) {
      throw new Error(`批量导入${type === 'inbound' ? '入库' : '出库'}交易失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理批量物品数据
   */
  private async processBatchItems(
    items: ItemData[],
    skipErrors: boolean
  ): Promise<BatchImportResult> {
    const client = await this.pool.connect();
    const result: BatchImportResult = {
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
          result.importedItems!.push(createdItem.id);
        } catch (error) {
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

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 处理批量交易数据
   */
  private async processBatchTransactions(
    transactions: CreateTransactionDto[],
    skipErrors: boolean
  ): Promise<BatchImportResult> {
    const client = await this.pool.connect();
    const result: BatchImportResult = {
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
          result.importedTransactions!.push(createdTransaction.id);
        } catch (error) {
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

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证批量导入数据
   */
  async validateImportData(
    buffer: Buffer,
    type: 'items' | 'inbound' | 'outbound'
  ): Promise<{
    isValid: boolean;
    totalRows: number;
    validRows: number;
    errors: Array<{ row: number; message: string; column?: string }>;
  }> {
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

    } catch (error) {
      throw new Error(`验证导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取导入模板
   */
  getImportTemplate(type: 'items' | 'inbound' | 'outbound'): Buffer {
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

  /**
   * 检查导入前置条件
   */
  async checkImportPrerequisites(
    transactions: CreateTransactionDto[]
  ): Promise<{
    isValid: boolean;
    missingItems: string[];
    missingLocations: string[];
    insufficientStock: Array<{ itemId: string; locationId: string; required: number; available: number }>;
  }> {
    const result = {
      isValid: true,
      missingItems: [] as string[],
      missingLocations: [] as string[],
      insufficientStock: [] as Array<{ itemId: string; locationId: string; required: number; available: number }>
    };

    // 收集所有需要检查的物品和位置ID
    const itemIds = [...new Set(transactions.map(t => t.itemId))];
    const locationIds = [...new Set(transactions.map(t => t.locationId))];

    try {
      // 检查物品是否存在
      for (const itemId of itemIds) {
        try {
          await this.itemService.getItem(itemId);
        } catch (error) {
          result.missingItems.push(itemId);
          result.isValid = false;
        }
      }

      // 检查位置是否存在（这里需要LocationService，暂时跳过）
      // TODO: 实现位置检查

      // 检查出库交易的库存是否充足
      const outboundTransactions = transactions.filter(t => t.type === 'outbound');
      if (outboundTransactions.length > 0) {
        // 按物品和位置分组计算所需数量
        const stockRequirements = new Map<string, number>();
        
        outboundTransactions.forEach(transaction => {
          const key = `${transaction.itemId}-${transaction.locationId}`;
          const current = stockRequirements.get(key) || 0;
          stockRequirements.set(key, current + transaction.quantity);
        });

        // 检查每个位置的库存是否充足
        for (const [key, requiredQuantity] of stockRequirements) {
          const [itemId, locationId] = key.split('-');
          try {
            // TODO: 实现库存检查
            // const currentStock = await this.inventoryService.getStock(itemId, locationId);
            // if (currentStock < requiredQuantity) {
            //   result.insufficientStock.push({
            //     itemId,
            //     locationId,
            //     required: requiredQuantity,
            //     available: currentStock
            //   });
            //   result.isValid = false;
            // }
          } catch (error) {
            // 如果无法获取库存信息，记录为库存不足
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

    } catch (error) {
      throw new Error(`检查导入前置条件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }
}

export default BatchImportService;