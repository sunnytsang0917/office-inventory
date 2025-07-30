import * as XLSX from 'xlsx';
import { ItemData } from '../models/Item';
import { CreateTransactionDto } from '../models/Transaction';
export declare class ExcelParseError extends Error {
    row?: number | undefined;
    column?: string | undefined;
    constructor(message: string, row?: number | undefined, column?: string | undefined);
}
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
export interface ItemExcelRow {
    name: string;
    category: string;
    specification?: string;
    unit: string;
    defaultLocationCode?: string;
    lowStockThreshold: number;
}
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
export interface ExcelTemplate {
    name: string;
    headers: string[];
    requiredColumns: string[];
    sampleData: any[];
}
export declare class ExcelService {
    private static readonly MAX_FILE_SIZE;
    private static readonly ITEM_TEMPLATE;
    private static readonly INBOUND_TEMPLATE;
    private static readonly OUTBOUND_TEMPLATE;
    static parseExcelFile(buffer: Buffer): XLSX.WorkBook;
    static getWorksheetData(workbook: XLSX.WorkBook, sheetName?: string): any[];
    static validateExcelFormat(data: any[], template: ExcelTemplate): ExcelValidationResult;
    static parseItemsFromExcel(buffer: Buffer): {
        items: ItemExcelRow[];
        validation: ExcelValidationResult;
    };
    static parseTransactionsFromExcel(buffer: Buffer, type: 'inbound' | 'outbound'): {
        transactions: TransactionExcelRow[];
        validation: ExcelValidationResult;
    };
    private static parseItemRow;
    private static parseTransactionRow;
    static generateTemplate(templateType: 'items' | 'inbound' | 'outbound'): Buffer;
    static exportToExcel(data: any[], headers: string[], sheetName?: string): Buffer;
    static validateItemData(item: ItemExcelRow): {
        isValid: boolean;
        errors: string[];
    };
    static validateTransactionData(transaction: TransactionExcelRow): {
        isValid: boolean;
        errors: string[];
    };
    parseItemsExcel(buffer: Buffer): Promise<{
        data: ItemData[];
        errors: Array<{
            row: number;
            message: string;
        }>;
    }>;
    parseInboundTransactionsExcel(buffer: Buffer): Promise<{
        data: CreateTransactionDto[];
        errors: Array<{
            row: number;
            message: string;
        }>;
    }>;
    parseOutboundTransactionsExcel(buffer: Buffer): Promise<{
        data: CreateTransactionDto[];
        errors: Array<{
            row: number;
            message: string;
        }>;
    }>;
    generateItemTemplate(): Buffer;
    generateInboundTemplate(): Buffer;
    generateOutboundTemplate(): Buffer;
    exportToExcel<T extends Record<string, any>>(data: T[], headers: Array<{
        key: keyof T;
        title: string;
        width?: number;
    }>, sheetName?: string): Buffer;
    validateExcelTemplate(buffer: Buffer, expectedHeaders: string[]): {
        isValid: boolean;
        errors: string[];
        actualHeaders: string[];
    };
}
export default ExcelService;
//# sourceMappingURL=ExcelService.d.ts.map