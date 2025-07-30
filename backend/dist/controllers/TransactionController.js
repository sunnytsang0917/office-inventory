"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const TransactionService_1 = require("../services/TransactionService");
const Transaction_1 = require("../models/Transaction");
const XLSX = __importStar(require("xlsx"));
const zod_1 = require("zod");
class TransactionController {
    constructor() {
        this.transactionService = new TransactionService_1.TransactionService();
        this.createTransaction = async (req, res, next) => {
            try {
                const validatedData = Transaction_1.TransactionModel.validateCreate(req.body);
                const transaction = await this.transactionService.createTransaction(validatedData);
                res.status(201).json({
                    success: true,
                    message: '交易记录创建成功',
                    data: transaction.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.createInboundTransaction = async (req, res, next) => {
            try {
                const transactionData = { ...req.body, type: 'inbound' };
                const validatedData = Transaction_1.TransactionModel.validateCreate(transactionData);
                const transaction = await this.transactionService.createTransaction(validatedData);
                res.status(201).json({
                    success: true,
                    message: '入库记录创建成功',
                    data: transaction.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.createOutboundTransaction = async (req, res, next) => {
            try {
                const transactionData = { ...req.body, type: 'outbound' };
                const validatedData = Transaction_1.TransactionModel.validateCreate(transactionData);
                const transaction = await this.transactionService.createTransaction(validatedData);
                res.status(201).json({
                    success: true,
                    message: '出库记录创建成功',
                    data: transaction.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.createBatchTransactions = async (req, res, next) => {
            try {
                const validatedData = Transaction_1.TransactionModel.validateBatch(req.body);
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
            }
            catch (error) {
                next(error);
            }
        };
        this.batchInbound = async (req, res, next) => {
            try {
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        message: '请上传Excel文件'
                    });
                    return;
                    return;
                }
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                if (jsonData.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel文件为空'
                    });
                }
                return;
                const ExcelRowSchema = zod_1.z.object({
                    '物品ID': zod_1.z.string().uuid('物品ID格式不正确'),
                    '位置ID': zod_1.z.string().uuid('位置ID格式不正确'),
                    '数量': zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
                    '操作人': zod_1.z.string().min(1, '操作人不能为空'),
                    '供应商': zod_1.z.string().min(1, '供应商不能为空'),
                    '日期': zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
                    '备注': zod_1.z.string().optional()
                });
                const transactions = [];
                const validationErrors = [];
                for (let i = 0; i < jsonData.length; i++) {
                    try {
                        const row = jsonData[i];
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
                    }
                    catch (error) {
                        validationErrors.push({
                            row: i + 1,
                            error: error instanceof Error ? error.message : '数据格式错误'
                        });
                    }
                }
                if (validationErrors.length > 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel数据格式错误',
                        errors: validationErrors
                    });
                }
                return;
                const batchData = { transactions };
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
            }
            catch (error) {
                next(error);
            }
        };
        this.batchOutbound = async (req, res, next) => {
            try {
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        message: '请上传Excel文件'
                    });
                }
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                return;
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                if (jsonData.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel文件为空'
                    });
                }
                const ExcelRowSchema = zod_1.z.object({
                    '物品ID': zod_1.z.string().uuid('物品ID格式不正确'),
                    '位置ID': zod_1.z.string().uuid('位置ID格式不正确'),
                    '数量': zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
                    '操作人': zod_1.z.string().min(1, '操作人不能为空'),
                    '领用人': zod_1.z.string().min(1, '领用人不能为空'),
                    '用途': zod_1.z.string().min(1, '用途不能为空'),
                    '日期': zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
                    '备注': zod_1.z.string().optional()
                });
                const transactions = [];
                const validationErrors = [];
                for (let i = 0; i < jsonData.length; i++) {
                    try {
                        const row = jsonData[i];
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
                    }
                    catch (error) {
                        validationErrors.push({
                            row: i + 1,
                            error: error instanceof Error ? error.message : '数据格式错误'
                        });
                    }
                }
                if (validationErrors.length > 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel数据格式错误',
                        errors: validationErrors
                    });
                }
                const batchData = { transactions };
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
            }
            catch (error) {
                next(error);
            }
        };
        this.getTransaction = async (req, res, next) => {
            try {
                const { id } = req.params;
                const transaction = await this.transactionService.getTransaction(id);
                res.json({
                    success: true,
                    data: transaction.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getTransactionHistory = async (req, res, next) => {
            try {
                const filter = {
                    itemId: req.query.itemId,
                    locationId: req.query.locationId,
                    type: req.query.type,
                    operator: req.query.operator,
                    supplier: req.query.supplier,
                    recipient: req.query.recipient,
                    dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                    dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                    batchId: req.query.batchId,
                    page: req.query.page ? parseInt(req.query.page) : undefined,
                    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder
                };
                Object.keys(filter).forEach(key => {
                    if (filter[key] === undefined) {
                        delete filter[key];
                    }
                });
                const result = await this.transactionService.getTransactionHistory(filter);
                res.json({
                    success: true,
                    data: result.data.map(transaction => transaction.toJSON()),
                    pagination: result.pagination
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.updateTransaction = async (req, res, next) => {
            try {
                const { id } = req.params;
                const validatedData = Transaction_1.TransactionModel.validateUpdate(req.body);
                const transaction = await this.transactionService.updateTransaction(id, validatedData);
                res.json({
                    success: true,
                    message: '交易记录更新成功',
                    data: transaction.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteTransaction = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.transactionService.deleteTransaction(id);
                res.json({
                    success: true,
                    message: '交易记录删除成功'
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getTransactionStatistics = async (req, res, next) => {
            try {
                const filter = {
                    dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                    dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                    itemId: req.query.itemId,
                    locationId: req.query.locationId
                };
                Object.keys(filter).forEach(key => {
                    if (filter[key] === undefined) {
                        delete filter[key];
                    }
                });
                const statistics = await this.transactionService.getTransactionStatistics(filter);
                res.json({
                    success: true,
                    data: statistics
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.downloadInboundTemplate = async (req, res, next) => {
            try {
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
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(templateData);
                worksheet['!cols'] = [
                    { width: 40 },
                    { width: 40 },
                    { width: 10 },
                    { width: 15 },
                    { width: 20 },
                    { width: 15 },
                    { width: 20 }
                ];
                XLSX.utils.book_append_sheet(workbook, worksheet, '入库模板');
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename="inbound_template.xlsx"');
                res.send(buffer);
            }
            catch (error) {
                next(error);
            }
        };
        this.downloadOutboundTemplate = async (req, res, next) => {
            try {
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
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(templateData);
                worksheet['!cols'] = [
                    { width: 40 },
                    { width: 40 },
                    { width: 10 },
                    { width: 15 },
                    { width: 15 },
                    { width: 20 },
                    { width: 15 },
                    { width: 20 }
                ];
                XLSX.utils.book_append_sheet(workbook, worksheet, '出库模板');
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename="outbound_template.xlsx"');
                res.send(buffer);
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.TransactionController = TransactionController;
exports.default = TransactionController;
//# sourceMappingURL=TransactionController.js.map