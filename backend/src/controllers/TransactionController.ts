import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/TransactionService';
import { 
  TransactionModel, 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  BatchTransactionDto 
} from '../models/Transaction';
import { TransactionType } from '../types';
import * as XLSX from 'xlsx';
import { z } from 'zod';

export class TransactionController {
  private transactionService = new TransactionService();

  // 创建单个交易记录
  createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = TransactionModel.validateCreate(req.body);
      const transaction = await this.transactionService.createTransaction(validatedData);
      
      res.status(201).json({
        success: true,
        message: '交易记录创建成功',
        data: transaction.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 创建入库记录
  createInboundTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transactionData = { ...req.body, type: 'inbound' as TransactionType };
      const validatedData = TransactionModel.validateCreate(transactionData);
      const transaction = await this.transactionService.createTransaction(validatedData);
      
      res.status(201).json({
        success: true,
        message: '入库记录创建成功',
        data: transaction.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 创建出库记录
  createOutboundTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transactionData = { ...req.body, type: 'outbound' as TransactionType };
      const validatedData = TransactionModel.validateCreate(transactionData);
      const transaction = await this.transactionService.createTransaction(validatedData);
      
      res.status(201).json({
        success: true,
        message: '出库记录创建成功',
        data: transaction.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 批量创建交易记录
  createBatchTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = TransactionModel.validateBatch(req.body);
      const result = await this.transactionService.createBatchTransactions(validatedData);
      
      res.status(201).json({
        success: true,
        message: '批量交易记录创建成功',
        data: {
          batchId: result.batchId,
          successCount: result.success.length,
          failedCount: result.failed.length,
          transactions: result.success.map(t => t.toJSON()),
          errors: result.failed
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // 批量入库（Excel文件上传）
  batchInbound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请上传Excel文件'
        });
        return;
        return;      }

      // 解析Excel文件
      const workbook = XLSX.read(req.file!.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Excel文件为空'
        });
      }

        return;      // 验证Excel格式并转换数据
      const ExcelRowSchema = z.object({
        '物品ID': z.string().uuid('物品ID格式不正确'),
        '位置ID': z.string().uuid('位置ID格式不正确'),
        '数量': z.union([z.number(), z.string()]).transform(val => 
          typeof val === 'string' ? parseFloat(val) : val
        ),
        '操作人': z.string().min(1, '操作人不能为空'),
        '供应商': z.string().min(1, '供应商不能为空'),
        '日期': z.union([z.string(), z.date()]).transform(val => 
          typeof val === 'string' ? new Date(val) : val
        ).optional(),
        '备注': z.string().optional()
      });

      const transactions: CreateTransactionDto[] = [];
      const validationErrors = [];

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          const validatedRow = ExcelRowSchema.parse(row);
          
          transactions.push({
            itemId: validatedRow['物品ID'],
            locationId: validatedRow['位置ID'],
            type: 'inbound',
            quantity: validatedRow['数量'],
            date: validatedRow['日期'] || new Date(),
            operator: validatedRow['操作人'],
            supplier: validatedRow['供应商'],
            notes: validatedRow['备注'] || ''
          });
        } catch (error: unknown) {
          validationErrors.push({
            row: i + 1,
            error: String(error)
          });
        }
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Excel数据格式错误',
          errors: validationErrors
        });
        return;
      }

      // 执行批量入库
      const batchData: BatchTransactionDto = { transactions };
      const result = await this.transactionService.createBatchTransactions(batchData);
      
      res.json({
        success: true,
        message: '批量入库完成',
        data: {
          batchId: result.batchId,
          total: transactions.length,
          success: result.success.length,
          failed: result.failed.length,
          errors: result.failed
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // 批量出库（Excel文件上传）
  batchOutbound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请上传Excel文件'
        });
      }

      // 解析Excel文件
      const workbook = XLSX.read(req.file!.buffer, { type: 'buffer' });
        return;      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Excel文件为空'
        });
      }

      // 验证Excel格式并转换数据
      const ExcelRowSchema = z.object({
        '物品ID': z.string().uuid('物品ID格式不正确'),
        '位置ID': z.string().uuid('位置ID格式不正确'),
        '数量': z.union([z.number(), z.string()]).transform(val => 
          typeof val === 'string' ? parseFloat(val) : val
        ),
        '操作人': z.string().min(1, '操作人不能为空'),
        '领用人': z.string().min(1, '领用人不能为空'),
        '用途': z.string().min(1, '用途不能为空'),
        '日期': z.union([z.string(), z.date()]).transform(val => 
          typeof val === 'string' ? new Date(val) : val
        ).optional(),
        '备注': z.string().optional()
      });

      const transactions: CreateTransactionDto[] = [];
      const validationErrors = [];

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          const validatedRow = ExcelRowSchema.parse(row);
          
          transactions.push({
            itemId: validatedRow['物品ID'],
            locationId: validatedRow['位置ID'],
            type: 'outbound',
            quantity: validatedRow['数量'],
            date: validatedRow['日期'] || new Date(),
            operator: validatedRow['操作人'],
            recipient: validatedRow['领用人'],
            purpose: validatedRow['用途'],
            notes: validatedRow['备注'] || ''
          });
        } catch (error: unknown) {
          validationErrors.push({
            row: i + 1,
            error: String(error)
          });
        }
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Excel数据格式错误',
          errors: validationErrors
        });
        return;
      }

      // 执行批量出库
      const batchData: BatchTransactionDto = { transactions };
      const result = await this.transactionService.createBatchTransactions(batchData);
      
      res.json({
        success: true,
        message: '批量出库完成',
        data: {
          batchId: result.batchId,
          total: transactions.length,
          success: result.success.length,
          failed: result.failed.length,
          errors: result.failed
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取交易记录详情
  getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransaction(id);
      
      res.json({
        success: true,
        data: transaction.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取交易历史记录
  getTransactionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = {
        itemId: req.query.itemId as string,
        locationId: req.query.locationId as string,
        type: req.query.type as TransactionType,
        operator: req.query.operator as string,
        supplier: req.query.supplier as string,
        recipient: req.query.recipient as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        batchId: req.query.batchId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as 'date' | 'quantity' | 'operator' | 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      // 移除undefined值
      Object.keys(filter).forEach(key => {
        if (filter[key as keyof typeof filter] === undefined) {
          delete filter[key as keyof typeof filter];
        }
      });

      const result = await this.transactionService.getTransactionHistory(filter);
      
      res.json({
        success: true,
        data: result.data.map(transaction => transaction.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  // 更新交易记录
  updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = TransactionModel.validateUpdate(req.body);
      const transaction = await this.transactionService.updateTransaction(id, validatedData);
      
      res.json({
        success: true,
        message: '交易记录更新成功',
        data: transaction.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 删除交易记录
  deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.transactionService.deleteTransaction(id);
      
      res.json({
        success: true,
        message: '交易记录删除成功'
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取交易统计信息
  getTransactionStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        itemId: req.query.itemId as string,
        locationId: req.query.locationId as string
      };

      // 移除undefined值
      Object.keys(filter).forEach(key => {
        if (filter[key as keyof typeof filter] === undefined) {
          delete filter[key as keyof typeof filter];
        }
      });

      const statistics = await this.transactionService.getTransactionStatistics(filter);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  };

  // 下载入库模板
  downloadInboundTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 创建模板数据
      const templateData = [
        {
          '物品ID': '示例：550e8400-e29b-41d4-a716-446655440000',
          '位置ID': '示例：550e8400-e29b-41d4-a716-446655440001',
          '数量': 100,
          '操作人': '张三',
          '供应商': '示例供应商',
          '日期': '2024-01-01',
          '备注': '示例备注'
        }
      ];

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // 设置列宽
      worksheet['!cols'] = [
        { width: 40 }, // 物品ID
        { width: 40 }, // 位置ID
        { width: 10 }, // 数量
        { width: 15 }, // 操作人
        { width: 20 }, // 供应商
        { width: 15 }, // 日期
        { width: 20 }  // 备注
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '入库模板');

      // 生成Excel文件
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="inbound_template.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  // 下载出库模板
  downloadOutboundTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 创建模板数据
      const templateData = [
        {
          '物品ID': '示例：550e8400-e29b-41d4-a716-446655440000',
          '位置ID': '示例：550e8400-e29b-41d4-a716-446655440001',
          '数量': 10,
          '操作人': '李四',
          '领用人': '王五',
          '用途': '办公使用',
          '日期': '2024-01-01',
          '备注': '示例备注'
        }
      ];

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // 设置列宽
      worksheet['!cols'] = [
        { width: 40 }, // 物品ID
        { width: 40 }, // 位置ID
        { width: 10 }, // 数量
        { width: 15 }, // 操作人
        { width: 15 }, // 领用人
        { width: 20 }, // 用途
        { width: 15 }, // 日期
        { width: 20 }  // 备注
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '出库模板');

      // 生成Excel文件
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="outbound_template.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

export default TransactionController;