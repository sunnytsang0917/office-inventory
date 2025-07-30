import * as XLSX from 'xlsx';
import { z } from 'zod';
import { ItemData, CreateItemSchema } from '../models/Item';
import { CreateTransactionDto, CreateTransactionSchema } from '../models/Transaction';
import { BatchResult } from '../types';

// Excel解析错误类
export class ExcelParseError extends Error {
  constructor(message: string, public row?: number, public column?: string) {
    super(message);
    this.name = 'ExcelParseError';
  }
}

// Excel文件验证结果
export interface ExcelValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    column?: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    column?: string;
    message: string;
  }>;
}

// 物品Excel数据结构
export interface ItemExcelRow {
  name: string;
  category: string;
  specification?: string;
  unit: string;
  defaultLocationCode?: string;
  lowStockThreshold: number;
}

// 交易Excel数据结构
export interface TransactionExcelRow {
  itemName: string;
  locationCode: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date: string;
  operator: string;
  supplier?: string;
  recipient?: string;
  purpose?: string;
  notes?: string;
}

// Excel模板定义
export interface ExcelTemplate {
  name: string;
  headers: string[];
  requiredColumns: string[];
  sampleData: any[];
}

export class ExcelService {
  // 文件大小限制 (10MB)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // 物品导入模板
  private static readonly ITEM_TEMPLATE: ExcelTemplate = {
    name: '物品信息导入模板',
    headers: ['物品名称', '物品类别', '规格型号', '计量单位', '默认库房编码', '低库存阈值'],
    requiredColumns: ['物品名称', '物品类别', '计量单位'],
    sampleData: [
      {
        '物品名称': '办公椅',
        '物品类别': '办公家具',
        '规格型号': '人体工学椅',
        '计量单位': '把',
        '默认库房编码': 'WH001',
        '低库存阈值': 5
      },
      {
        '物品名称': 'A4纸',
        '物品类别': '办公用品',
        '规格型号': '80g/m²',
        '计量单位': '包',
        '默认库房编码': 'WH002',
        '低库存阈值': 10
      }
    ]
  };

  // 入库交易模板
  private static readonly INBOUND_TEMPLATE: ExcelTemplate = {
    name: '入库记录导入模板',
    headers: ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商', '备注'],
    requiredColumns: ['物品名称', '库房编码', '数量', '日期', '操作人', '供应商'],
    sampleData: [
      {
        '物品名称': '办公椅',
        '库房编码': 'WH001',
        '数量': 10,
        '日期': '2024-01-15',
        '操作人': '张三',
        '供应商': '办公家具有限公司',
        '备注': '新采购'
      }
    ]
  };

  // 出库交易模板
  private static readonly OUTBOUND_TEMPLATE: ExcelTemplate = {
    name: '出库记录导入模板',
    headers: ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途', '备注'],
    requiredColumns: ['物品名称', '库房编码', '数量', '日期', '操作人', '领用人', '用途'],
    sampleData: [
      {
        '物品名称': 'A4纸',
        '库房编码': 'WH002',
        '数量': 5,
        '日期': '2024-01-16',
        '操作人': '李四',
        '领用人': '王五',
        '用途': '日常办公',
        '备注': ''
      }
    ]
  };

  /**
   * 解析Excel文件
   */
  static parseExcelFile(buffer: Buffer): XLSX.WorkBook {
    try {
      return XLSX.read(buffer, { type: 'buffer' });
    } catch (error) {
      throw new ExcelParseError('Excel文件格式不正确或文件已损坏');
    }
  }

  /**
   * 获取工作表数据
   */
  static getWorksheetData(workbook: XLSX.WorkBook, sheetName?: string): any[] {
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      throw new ExcelParseError('Excel文件中没有工作表');
    }

    const targetSheetName = sheetName || sheetNames[0];
    const worksheet = workbook.Sheets[targetSheetName];
    
    if (!worksheet) {
      throw new ExcelParseError(`工作表 "${targetSheetName}" 不存在`);
    }

    try {
      return XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });
    } catch (error) {
      throw new ExcelParseError('解析工作表数据失败');
    }
  }

  /**
   * 验证Excel文件格式
   */
  static validateExcelFormat(
    data: any[], 
    template: ExcelTemplate
  ): ExcelValidationResult {
    const errors: Array<{ row: number; column?: string; message: string }> = [];
    const warnings: Array<{ row: number; column?: string; message: string }> = [];

    if (data.length === 0) {
      errors.push({ row: 0, message: 'Excel文件为空' });
      return { isValid: false, errors, warnings };
    }

    // 验证表头
    const headers = data[0] as string[];
    if (!headers || headers.length === 0) {
      errors.push({ row: 1, message: '缺少表头行' });
      return { isValid: false, errors, warnings };
    }

    // 检查必需列
    const missingColumns = template.requiredColumns.filter(
      col => !headers.includes(col)
    );
    
    if (missingColumns.length > 0) {
      errors.push({
        row: 1,
        message: `缺少必需列: ${missingColumns.join(', ')}`
      });
    }

    // 检查数据行
    if (data.length < 2) {
      errors.push({ row: 2, message: '没有数据行' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 解析物品Excel数据
   */
  static parseItemsFromExcel(buffer: Buffer): {
    items: ItemExcelRow[];
    validation: ExcelValidationResult;
  } {
    const workbook = this.parseExcelFile(buffer);
    const data = this.getWorksheetData(workbook);
    const validation = this.validateExcelFormat(data, this.ITEM_TEMPLATE);

    if (!validation.isValid) {
      return { items: [], validation };
    }

    const headers = data[0] as string[];
    const items: ItemExcelRow[] = [];

    // 解析数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every(cell => !cell)) continue; // 跳过空行

      try {
        const item = this.parseItemRow(headers, row, i + 1);
        items.push(item);
      } catch (error) {
        validation.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : '解析行数据失败'
        });
      }
    }

    validation.isValid = validation.errors.length === 0;
    return { items, validation };
  }

  /**
   * 解析交易Excel数据
   */
  static parseTransactionsFromExcel(
    buffer: Buffer, 
    type: 'inbound' | 'outbound'
  ): {
    transactions: TransactionExcelRow[];
    validation: ExcelValidationResult;
  } {
    const workbook = this.parseExcelFile(buffer);
    const data = this.getWorksheetData(workbook);
    const template = type === 'inbound' ? this.INBOUND_TEMPLATE : this.OUTBOUND_TEMPLATE;
    const validation = this.validateExcelFormat(data, template);

    if (!validation.isValid) {
      return { transactions: [], validation };
    }

    const headers = data[0] as string[];
    const transactions: TransactionExcelRow[] = [];

    // 解析数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every(cell => !cell)) continue; // 跳过空行

      try {
        const transaction = this.parseTransactionRow(headers, row, type, i + 1);
        transactions.push(transaction);
      } catch (error) {
        validation.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : '解析行数据失败'
        });
      }
    }

    validation.isValid = validation.errors.length === 0;
    return { transactions, validation };
  }

  /**
   * 解析物品行数据
   */
  private static parseItemRow(headers: string[], row: any[], rowNumber: number): ItemExcelRow {
    const getColumnValue = (columnName: string): any => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : undefined;
    };

    const name = getColumnValue('物品名称');
    const category = getColumnValue('物品类别');
    const specification = getColumnValue('规格型号');
    const unit = getColumnValue('计量单位');
    const defaultLocationCode = getColumnValue('默认库房编码');
    const lowStockThreshold = getColumnValue('低库存阈值');

    // 验证必需字段
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('物品名称不能为空');
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      throw new Error('物品类别不能为空');
    }
    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      throw new Error('计量单位不能为空');
    }

    // 处理数值字段
    let threshold = 0;
    if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
      const parsed = Number(lowStockThreshold);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('低库存阈值必须是非负数');
      }
      threshold = parsed;
    }

    return {
      name: name.toString().trim(),
      category: category.toString().trim(),
      specification: specification ? specification.toString().trim() : undefined,
      unit: unit.toString().trim(),
      defaultLocationCode: defaultLocationCode ? defaultLocationCode.toString().trim() : undefined,
      lowStockThreshold: threshold
    };
  }

  /**
   * 解析交易行数据
   */
  private static parseTransactionRow(
    headers: string[], 
    row: any[], 
    type: 'inbound' | 'outbound',
    rowNumber: number
  ): TransactionExcelRow {
    const getColumnValue = (columnName: string): any => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : undefined;
    };

    const itemName = getColumnValue('物品名称');
    const locationCode = getColumnValue('库房编码');
    const quantity = getColumnValue('数量');
    const date = getColumnValue('日期');
    const operator = getColumnValue('操作人');
    const supplier = getColumnValue('供应商');
    const recipient = getColumnValue('领用人');
    const purpose = getColumnValue('用途');
    const notes = getColumnValue('备注');

    // 验证必需字段
    if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
      throw new Error('物品名称不能为空');
    }
    if (!locationCode || typeof locationCode !== 'string' || locationCode.trim() === '') {
      throw new Error('库房编码不能为空');
    }
    if (!operator || typeof operator !== 'string' || operator.trim() === '') {
      throw new Error('操作人不能为空');
    }

    // 验证数量
    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error('数量必须是正数');
    }

    // 验证日期
    let parsedDate: string;
    if (date instanceof Date) {
      parsedDate = date.toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      parsedDate = date.trim();
    } else if (typeof date === 'number') {
      // Excel日期序列号
      const excelDate = XLSX.SSF.parse_date_code(date);
      parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
    } else {
      throw new Error('日期格式不正确');
    }

    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
      throw new Error('日期格式必须是YYYY-MM-DD');
    }

    // 根据交易类型验证特定字段
    if (type === 'inbound') {
      if (!supplier || typeof supplier !== 'string' || supplier.trim() === '') {
        throw new Error('入库操作必须指定供应商');
      }
    } else {
      if (!recipient || typeof recipient !== 'string' || recipient.trim() === '') {
        throw new Error('出库操作必须指定领用人');
      }
      if (!purpose || typeof purpose !== 'string' || purpose.trim() === '') {
        throw new Error('出库操作必须指定用途');
      }
    }

    return {
      itemName: itemName.toString().trim(),
      locationCode: locationCode.toString().trim(),
      type,
      quantity: parsedQuantity,
      date: parsedDate,
      operator: operator.toString().trim(),
      supplier: supplier ? supplier.toString().trim() : undefined,
      recipient: recipient ? recipient.toString().trim() : undefined,
      purpose: purpose ? purpose.toString().trim() : undefined,
      notes: notes ? notes.toString().trim() : undefined
    };
  }

  /**
   * 生成Excel模板
   */
  static generateTemplate(templateType: 'items' | 'inbound' | 'outbound'): Buffer {
    let template: ExcelTemplate;
    
    switch (templateType) {
      case 'items':
        template = this.ITEM_TEMPLATE;
        break;
      case 'inbound':
        template = this.INBOUND_TEMPLATE;
        break;
      case 'outbound':
        template = this.OUTBOUND_TEMPLATE;
        break;
      default:
        throw new Error('不支持的模板类型');
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData = [template.headers, ...template.sampleData.map(row => 
      template.headers.map(header => row[header] || '')
    )];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    const colWidths = template.headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, template.name);
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 导出数据到Excel
   */
  static exportToExcel(data: any[], headers: string[], sheetName: string = 'Sheet1'): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // 准备数据
    const worksheetData = [
      headers,
      ...data.map(row => headers.map(header => row[header] || ''))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 验证物品数据
   */
  static validateItemData(item: ItemExcelRow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      CreateItemSchema.parse({
        name: item.name,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        lowStockThreshold: item.lowStockThreshold
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...(error as any).errors.map((e: any) => e.message));
      } else {
        errors.push('数据验证失败');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证交易数据
   */
  static validateTransactionData(transaction: TransactionExcelRow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      CreateTransactionSchema.parse({
        itemId: 'temp-id', // 这里需要实际的itemId，在批量导入时会替换
        locationId: 'temp-id', // 这里需要实际的locationId，在批量导入时会替换
        type: transaction.type,
        quantity: transaction.quantity,
        date: new Date(transaction.date),
        operator: transaction.operator,
        supplier: transaction.supplier,
        recipient: transaction.recipient,
        purpose: transaction.purpose,
        notes: transaction.notes
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...(error as any).errors.map((e: any) => e.message));
      } else {
        errors.push('数据验证失败');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Instance methods for compatibility with tests
  
  /**
   * 解析物品Excel文件 (实例方法)
   */
  async parseItemsExcel(buffer: Buffer): Promise<{
    data: ItemData[];
    errors: Array<{ row: number; message: string }>;
  }> {
    // 检查文件大小
    if (buffer.length > ExcelService.MAX_FILE_SIZE) {
      throw new Error('Excel文件大小不能超过10MB');
    }

    // 检查是否至少有标题行和一行数据
    const workbook = ExcelService.parseExcelFile(buffer);
    const data = ExcelService.getWorksheetData(workbook);
    
    if (data.length < 2) {
      throw new Error('Excel文件至少需要包含标题行和一行数据');
    }

    const result = ExcelService.parseItemsFromExcel(buffer);
    
    // 转换为测试期望的格式
    const convertedData: ItemData[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    if (!result.validation.isValid) {
      errors.push(...result.validation.errors);
      return { data: convertedData, errors };
    }

    // 验证每个物品数据并转换格式
    for (let i = 0; i < result.items.length; i++) {
      const item = result.items[i];
      const validation = ExcelService.validateItemData(item);
      
      if (validation.isValid) {
        convertedData.push({
          name: item.name,
          category: item.category,
          specification: item.specification,
          unit: item.unit,
          defaultLocationId: item.defaultLocationCode, // 注意：这里可能需要转换为实际的ID
          lowStockThreshold: item.lowStockThreshold
        });
      } else {
        errors.push({
          row: i + 2, // +2 因为有标题行，且从1开始计数
          message: validation.errors.join('; ')
        });
      }
    }

    return { data: convertedData, errors };
  }

  /**
   * 解析入库交易Excel文件 (实例方法)
   */
  async parseInboundTransactionsExcel(buffer: Buffer): Promise<{
    data: CreateTransactionDto[];
    errors: Array<{ row: number; message: string }>;
  }> {
    // 检查文件大小
    if (buffer.length > ExcelService.MAX_FILE_SIZE) {
      throw new Error('Excel文件大小不能超过10MB');
    }

    const result = ExcelService.parseTransactionsFromExcel(buffer, 'inbound');
    
    const convertedData: CreateTransactionDto[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    if (!result.validation.isValid) {
      errors.push(...result.validation.errors);
      return { data: convertedData, errors };
    }

    // 验证每个交易数据并转换格式
    for (let i = 0; i < result.transactions.length; i++) {
      const transaction = result.transactions[i];
      const validation = ExcelService.validateTransactionData(transaction);
      
      if (validation.isValid) {
        convertedData.push({
          itemId: transaction.itemName, // 注意：这里可能需要转换为实际的ID
          locationId: transaction.locationCode, // 注意：这里可能需要转换为实际的ID
          type: transaction.type,
          quantity: transaction.quantity,
          date: new Date(transaction.date),
          operator: transaction.operator,
          supplier: transaction.supplier,
          notes: transaction.notes
        });
      } else {
        errors.push({
          row: i + 2,
          message: validation.errors.join('; ')
        });
      }
    }

    return { data: convertedData, errors };
  }

  /**
   * 解析出库交易Excel文件 (实例方法)
   */
  async parseOutboundTransactionsExcel(buffer: Buffer): Promise<{
    data: CreateTransactionDto[];
    errors: Array<{ row: number; message: string }>;
  }> {
    // 检查文件大小
    if (buffer.length > ExcelService.MAX_FILE_SIZE) {
      throw new Error('Excel文件大小不能超过10MB');
    }

    const result = ExcelService.parseTransactionsFromExcel(buffer, 'outbound');
    
    const convertedData: CreateTransactionDto[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    if (!result.validation.isValid) {
      errors.push(...result.validation.errors);
      return { data: convertedData, errors };
    }

    // 验证每个交易数据并转换格式
    for (let i = 0; i < result.transactions.length; i++) {
      const transaction = result.transactions[i];
      const validation = ExcelService.validateTransactionData(transaction);
      
      if (validation.isValid) {
        convertedData.push({
          itemId: transaction.itemName, // 注意：这里可能需要转换为实际的ID
          locationId: transaction.locationCode, // 注意：这里可能需要转换为实际的ID
          type: transaction.type,
          quantity: transaction.quantity,
          date: new Date(transaction.date),
          operator: transaction.operator,
          recipient: transaction.recipient,
          purpose: transaction.purpose,
          notes: transaction.notes
        });
      } else {
        errors.push({
          row: i + 2,
          message: validation.errors.join('; ')
        });
      }
    }

    return { data: convertedData, errors };
  }

  /**
   * 生成物品导入模板 (实例方法)
   */
  generateItemTemplate(): Buffer {
    return ExcelService.generateTemplate('items');
  }

  /**
   * 生成入库交易模板 (实例方法)
   */
  generateInboundTemplate(): Buffer {
    return ExcelService.generateTemplate('inbound');
  }

  /**
   * 生成出库交易模板 (实例方法)
   */
  generateOutboundTemplate(): Buffer {
    return ExcelService.generateTemplate('outbound');
  }

  /**
   * 导出数据到Excel (实例方法)
   */
  exportToExcel<T extends Record<string, any>>(
    data: T[], 
    headers: Array<{ key: keyof T; title: string; width?: number }>, 
    sheetName: string = 'Sheet1'
  ): Buffer {
    if (!data || data.length === 0) {
      throw new Error('没有数据可导出');
    }

    const workbook = XLSX.utils.book_new();
    
    // 准备数据
    const worksheetData = [
      headers.map(h => h.title),
      ...data.map(row => headers.map(header => {
        const value = row[header.key];
        if (value === null || value === undefined) {
          return '';
        }
        return value;
      }))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    const colWidths = headers.map(header => ({ wch: header.width || 15 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 验证Excel模板格式 (实例方法)
   */
  validateExcelTemplate(buffer: Buffer, expectedHeaders: string[]): {
    isValid: boolean;
    errors: string[];
    actualHeaders: string[];
  } {
    try {
      const workbook = ExcelService.parseExcelFile(buffer);
      const data = ExcelService.getWorksheetData(workbook);
      
      if (data.length === 0) {
        return {
          isValid: false,
          errors: ['Excel文件为空'],
          actualHeaders: []
        };
      }

      const actualHeaders = data[0] as string[];
      const errors: string[] = [];

      // 检查缺少的必需列
      const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
      if (missingHeaders.length > 0) {
        errors.push(`缺少必需的列: ${missingHeaders.join(', ')}`);
      }

      // 检查额外的列
      const extraHeaders = actualHeaders.filter(header => !expectedHeaders.includes(header));
      if (extraHeaders.length > 0) {
        errors.push(`发现额外的列: ${extraHeaders.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        actualHeaders
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : '验证失败'],
        actualHeaders: []
      };
    }
  }
}

export default ExcelService;