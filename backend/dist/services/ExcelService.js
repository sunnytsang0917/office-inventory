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
exports.ExcelService = exports.ExcelParseError = void 0;
const XLSX = __importStar(require("xlsx"));
const zod_1 = require("zod");
const Item_1 = require("../models/Item");
const Transaction_1 = require("../models/Transaction");
class ExcelParseError extends Error {
    constructor(message, row, column) {
        super(message);
        this.row = row;
        this.column = column;
        this.name = 'ExcelParseError';
    }
}
exports.ExcelParseError = ExcelParseError;
class ExcelService {
    static parseExcelFile(buffer) {
        try {
            return XLSX.read(buffer, { type: 'buffer' });
        }
        catch (error) {
            throw new ExcelParseError('Excel文件格式不正确或文件已损坏');
        }
    }
    static getWorksheetData(workbook, sheetName) {
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
        }
        catch (error) {
            throw new ExcelParseError('解析工作表数据失败');
        }
    }
    static validateExcelFormat(data, template) {
        const errors = [];
        const warnings = [];
        if (data.length === 0) {
            errors.push({ row: 0, message: 'Excel文件为空' });
            return { isValid: false, errors, warnings };
        }
        const headers = data[0];
        if (!headers || headers.length === 0) {
            errors.push({ row: 1, message: '缺少表头行' });
            return { isValid: false, errors, warnings };
        }
        const missingColumns = template.requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            errors.push({
                row: 1,
                message: `缺少必需列: ${missingColumns.join(', ')}`
            });
        }
        if (data.length < 2) {
            errors.push({ row: 2, message: '没有数据行' });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    static parseItemsFromExcel(buffer) {
        const workbook = this.parseExcelFile(buffer);
        const data = this.getWorksheetData(workbook);
        const validation = this.validateExcelFormat(data, this.ITEM_TEMPLATE);
        if (!validation.isValid) {
            return { items: [], validation };
        }
        const headers = data[0];
        const items = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell))
                continue;
            try {
                const item = this.parseItemRow(headers, row, i + 1);
                items.push(item);
            }
            catch (error) {
                validation.errors.push({
                    row: i + 1,
                    message: error instanceof Error ? error.message : '解析行数据失败'
                });
            }
        }
        validation.isValid = validation.errors.length === 0;
        return { items, validation };
    }
    static parseTransactionsFromExcel(buffer, type) {
        const workbook = this.parseExcelFile(buffer);
        const data = this.getWorksheetData(workbook);
        const template = type === 'inbound' ? this.INBOUND_TEMPLATE : this.OUTBOUND_TEMPLATE;
        const validation = this.validateExcelFormat(data, template);
        if (!validation.isValid) {
            return { transactions: [], validation };
        }
        const headers = data[0];
        const transactions = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell))
                continue;
            try {
                const transaction = this.parseTransactionRow(headers, row, type, i + 1);
                transactions.push(transaction);
            }
            catch (error) {
                validation.errors.push({
                    row: i + 1,
                    message: error instanceof Error ? error.message : '解析行数据失败'
                });
            }
        }
        validation.isValid = validation.errors.length === 0;
        return { transactions, validation };
    }
    static parseItemRow(headers, row, rowNumber) {
        const getColumnValue = (columnName) => {
            const index = headers.indexOf(columnName);
            return index >= 0 ? row[index] : undefined;
        };
        const name = getColumnValue('物品名称');
        const category = getColumnValue('物品类别');
        const specification = getColumnValue('规格型号');
        const unit = getColumnValue('计量单位');
        const defaultLocationCode = getColumnValue('默认库房编码');
        const lowStockThreshold = getColumnValue('低库存阈值');
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('物品名称不能为空');
        }
        if (!category || typeof category !== 'string' || category.trim() === '') {
            throw new Error('物品类别不能为空');
        }
        if (!unit || typeof unit !== 'string' || unit.trim() === '') {
            throw new Error('计量单位不能为空');
        }
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
    static parseTransactionRow(headers, row, type, rowNumber) {
        const getColumnValue = (columnName) => {
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
        if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
            throw new Error('物品名称不能为空');
        }
        if (!locationCode || typeof locationCode !== 'string' || locationCode.trim() === '') {
            throw new Error('库房编码不能为空');
        }
        if (!operator || typeof operator !== 'string' || operator.trim() === '') {
            throw new Error('操作人不能为空');
        }
        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            throw new Error('数量必须是正数');
        }
        let parsedDate;
        if (date instanceof Date) {
            parsedDate = date.toISOString().split('T')[0];
        }
        else if (typeof date === 'string') {
            parsedDate = date.trim();
        }
        else if (typeof date === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(date);
            parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        }
        else {
            throw new Error('日期格式不正确');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
            throw new Error('日期格式必须是YYYY-MM-DD');
        }
        if (type === 'inbound') {
            if (!supplier || typeof supplier !== 'string' || supplier.trim() === '') {
                throw new Error('入库操作必须指定供应商');
            }
        }
        else {
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
    static generateTemplate(templateType) {
        let template;
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
        const worksheetData = [template.headers, ...template.sampleData.map(row => template.headers.map(header => row[header] || ''))];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const colWidths = template.headers.map(() => ({ wch: 15 }));
        worksheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, template.name);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    static exportToExcel(data, headers, sheetName = 'Sheet1') {
        const workbook = XLSX.utils.book_new();
        const worksheetData = [
            headers,
            ...data.map(row => headers.map(header => row[header] || ''))
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const colWidths = headers.map(() => ({ wch: 15 }));
        worksheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    static validateItemData(item) {
        const errors = [];
        try {
            Item_1.CreateItemSchema.parse({
                name: item.name,
                category: item.category,
                specification: item.specification,
                unit: item.unit,
                lowStockThreshold: item.lowStockThreshold
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                errors.push(...error.errors.map(e => e.message));
            }
            else {
                errors.push('数据验证失败');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateTransactionData(transaction) {
        const errors = [];
        try {
            Transaction_1.CreateTransactionSchema.parse({
                itemId: 'temp-id',
                locationId: 'temp-id',
                type: transaction.type,
                quantity: transaction.quantity,
                date: new Date(transaction.date),
                operator: transaction.operator,
                supplier: transaction.supplier,
                recipient: transaction.recipient,
                purpose: transaction.purpose,
                notes: transaction.notes
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                errors.push(...error.errors.map(e => e.message));
            }
            else {
                errors.push('数据验证失败');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async parseItemsExcel(buffer) {
        if (buffer.length > ExcelService.MAX_FILE_SIZE) {
            throw new Error('Excel文件大小不能超过10MB');
        }
        const workbook = ExcelService.parseExcelFile(buffer);
        const data = ExcelService.getWorksheetData(workbook);
        if (data.length < 2) {
            throw new Error('Excel文件至少需要包含标题行和一行数据');
        }
        const result = ExcelService.parseItemsFromExcel(buffer);
        const convertedData = [];
        const errors = [];
        if (!result.validation.isValid) {
            errors.push(...result.validation.errors);
            return { data: convertedData, errors };
        }
        for (let i = 0; i < result.items.length; i++) {
            const item = result.items[i];
            const validation = ExcelService.validateItemData(item);
            if (validation.isValid) {
                convertedData.push({
                    name: item.name,
                    category: item.category,
                    specification: item.specification,
                    unit: item.unit,
                    defaultLocationId: item.defaultLocationCode,
                    lowStockThreshold: item.lowStockThreshold
                });
            }
            else {
                errors.push({
                    row: i + 2,
                    message: validation.errors.join('; ')
                });
            }
        }
        return { data: convertedData, errors };
    }
    async parseInboundTransactionsExcel(buffer) {
        if (buffer.length > ExcelService.MAX_FILE_SIZE) {
            throw new Error('Excel文件大小不能超过10MB');
        }
        const result = ExcelService.parseTransactionsFromExcel(buffer, 'inbound');
        const convertedData = [];
        const errors = [];
        if (!result.validation.isValid) {
            errors.push(...result.validation.errors);
            return { data: convertedData, errors };
        }
        for (let i = 0; i < result.transactions.length; i++) {
            const transaction = result.transactions[i];
            const validation = ExcelService.validateTransactionData(transaction);
            if (validation.isValid) {
                convertedData.push({
                    itemId: transaction.itemName,
                    locationId: transaction.locationCode,
                    type: transaction.type,
                    quantity: transaction.quantity,
                    date: new Date(transaction.date),
                    operator: transaction.operator,
                    supplier: transaction.supplier,
                    notes: transaction.notes
                });
            }
            else {
                errors.push({
                    row: i + 2,
                    message: validation.errors.join('; ')
                });
            }
        }
        return { data: convertedData, errors };
    }
    async parseOutboundTransactionsExcel(buffer) {
        if (buffer.length > ExcelService.MAX_FILE_SIZE) {
            throw new Error('Excel文件大小不能超过10MB');
        }
        const result = ExcelService.parseTransactionsFromExcel(buffer, 'outbound');
        const convertedData = [];
        const errors = [];
        if (!result.validation.isValid) {
            errors.push(...result.validation.errors);
            return { data: convertedData, errors };
        }
        for (let i = 0; i < result.transactions.length; i++) {
            const transaction = result.transactions[i];
            const validation = ExcelService.validateTransactionData(transaction);
            if (validation.isValid) {
                convertedData.push({
                    itemId: transaction.itemName,
                    locationId: transaction.locationCode,
                    type: transaction.type,
                    quantity: transaction.quantity,
                    date: new Date(transaction.date),
                    operator: transaction.operator,
                    recipient: transaction.recipient,
                    purpose: transaction.purpose,
                    notes: transaction.notes
                });
            }
            else {
                errors.push({
                    row: i + 2,
                    message: validation.errors.join('; ')
                });
            }
        }
        return { data: convertedData, errors };
    }
    generateItemTemplate() {
        return ExcelService.generateTemplate('items');
    }
    generateInboundTemplate() {
        return ExcelService.generateTemplate('inbound');
    }
    generateOutboundTemplate() {
        return ExcelService.generateTemplate('outbound');
    }
    exportToExcel(data, headers, sheetName = 'Sheet1') {
        if (!data || data.length === 0) {
            throw new Error('没有数据可导出');
        }
        const workbook = XLSX.utils.book_new();
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
        const colWidths = headers.map(header => ({ wch: header.width || 15 }));
        worksheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    validateExcelTemplate(buffer, expectedHeaders) {
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
            const actualHeaders = data[0];
            const errors = [];
            const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
            if (missingHeaders.length > 0) {
                errors.push(`缺少必需的列: ${missingHeaders.join(', ')}`);
            }
            const extraHeaders = actualHeaders.filter(header => !expectedHeaders.includes(header));
            if (extraHeaders.length > 0) {
                errors.push(`发现额外的列: ${extraHeaders.join(', ')}`);
            }
            return {
                isValid: errors.length === 0,
                errors,
                actualHeaders
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [error instanceof Error ? error.message : '验证失败'],
                actualHeaders: []
            };
        }
    }
}
exports.ExcelService = ExcelService;
ExcelService.MAX_FILE_SIZE = 10 * 1024 * 1024;
ExcelService.ITEM_TEMPLATE = {
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
ExcelService.INBOUND_TEMPLATE = {
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
ExcelService.OUTBOUND_TEMPLATE = {
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
exports.default = ExcelService;
//# sourceMappingURL=ExcelService.js.map