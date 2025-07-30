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
exports.ReportExportService = void 0;
const XLSX = __importStar(require("xlsx"));
const date_fns_1 = require("date-fns");
class ReportExportService {
    static exportMonthlyStats(data) {
        const config = {
            filename: `月度统计报表_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`,
            sheetName: '月度统计',
            headers: [
                { key: 'month', title: '月份', width: 15 },
                { key: 'inboundTotal', title: '入库总量', width: 15 },
                { key: 'outboundTotal', title: '出库总量', width: 15 },
                { key: 'netChange', title: '净变化', width: 15 },
                { key: 'itemCount', title: '涉及物品数', width: 15 }
            ]
        };
        return this.exportToExcel(data, config);
    }
    static exportItemUsageRanking(data) {
        const config = {
            filename: `物品使用排行_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`,
            sheetName: '使用排行',
            headers: [
                { key: 'itemName', title: '物品名称', width: 20 },
                { key: 'category', title: '物品类别', width: 15 },
                { key: 'totalOutbound', title: '总出库量', width: 15 },
                { key: 'frequency', title: '使用频次', width: 15 },
                { key: 'lastUsedDate', title: '最后使用日期', width: 20 }
            ]
        };
        return this.exportToExcel(data, config);
    }
    static exportInventoryStatus(data) {
        const config = {
            filename: `库存状态报表_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`,
            sheetName: '库存状态',
            headers: [
                { key: 'itemName', title: '物品名称', width: 20 },
                { key: 'category', title: '物品类别', width: 15 },
                { key: 'locationName', title: '库房位置', width: 20 },
                { key: 'currentStock', title: '当前库存', width: 15 },
                { key: 'lowStockThreshold', title: '低库存阈值', width: 15 },
                { key: 'status', title: '库存状态', width: 15 },
                { key: 'lastTransactionDate', title: '最后交易日期', width: 20 }
            ]
        };
        return this.exportToExcel(data, config);
    }
    static exportTransactionHistory(data) {
        const config = {
            filename: `交易历史报表_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`,
            sheetName: '交易历史',
            headers: [
                { key: 'date', title: '日期', width: 15 },
                { key: 'itemName', title: '物品名称', width: 20 },
                { key: 'locationName', title: '库房位置', width: 20 },
                { key: 'type', title: '交易类型', width: 15 },
                { key: 'quantity', title: '数量', width: 10 },
                { key: 'operator', title: '操作人', width: 15 },
                { key: 'supplier', title: '供应商', width: 20 },
                { key: 'recipient', title: '领用人', width: 15 },
                { key: 'purpose', title: '用途', width: 20 }
            ]
        };
        return this.exportToExcel(data, config);
    }
    static exportToCSV(data, headers) {
        if (!data || data.length === 0) {
            throw new Error('没有数据可导出');
        }
        const csvHeaders = headers.map(h => h.title).join(',');
        const csvRows = data.map(row => headers.map(header => {
            const value = row[header.key];
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'boolean') {
                return value.toString();
            }
            if (typeof value === 'number') {
                return value.toString();
            }
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value.toString();
        }).join(','));
        return [csvHeaders, ...csvRows].join('\n');
    }
    static exportMonthlyStatsToCSV(data) {
        const headers = [
            { key: 'month', title: '月份' },
            { key: 'inboundTotal', title: '入库总量' },
            { key: 'outboundTotal', title: '出库总量' },
            { key: 'netChange', title: '净变化' },
            { key: 'itemCount', title: '涉及物品数' }
        ];
        return this.exportToCSV(data, headers);
    }
    static exportItemUsageRankingToCSV(data) {
        const headers = [
            { key: 'itemName', title: '物品名称' },
            { key: 'category', title: '物品类别' },
            { key: 'totalOutbound', title: '总出库量' },
            { key: 'frequency', title: '使用频次' },
            { key: 'lastUsedDate', title: '最后使用日期' }
        ];
        return this.exportToCSV(data, headers);
    }
    static exportInventoryStatusToCSV(data) {
        const headers = [
            { key: 'itemName', title: '物品名称' },
            { key: 'category', title: '物品类别' },
            { key: 'locationName', title: '库房位置' },
            { key: 'currentStock', title: '当前库存' },
            { key: 'lowStockThreshold', title: '低库存阈值' },
            { key: 'status', title: '库存状态' },
            { key: 'lastTransactionDate', title: '最后交易日期' }
        ];
        return this.exportToCSV(data, headers);
    }
    static exportTransactionHistoryToCSV(data) {
        const headers = [
            { key: 'date', title: '日期' },
            { key: 'itemName', title: '物品名称' },
            { key: 'locationName', title: '库房位置' },
            { key: 'type', title: '交易类型' },
            { key: 'quantity', title: '数量' },
            { key: 'operator', title: '操作人' },
            { key: 'supplier', title: '供应商' },
            { key: 'recipient', title: '领用人' },
            { key: 'purpose', title: '用途' }
        ];
        return this.exportToCSV(data, headers);
    }
    static exportToExcel(data, config) {
        if (!data || data.length === 0) {
            throw new Error('没有数据可导出');
        }
        const workbook = XLSX.utils.book_new();
        const worksheetData = [
            config.headers.map(h => h.title),
            ...data.map(row => config.headers.map(header => {
                const value = row[header.key];
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'boolean') {
                    return value ? '是' : '否';
                }
                if (header.key === 'type') {
                    return value === 'inbound' ? '入库' : '出库';
                }
                if (header.key === 'status') {
                    switch (value) {
                        case 'normal': return '正常';
                        case 'low': return '低库存';
                        case 'out_of_stock': return '缺货';
                        default: return value;
                    }
                }
                return value;
            }))
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const colWidths = config.headers.map(header => ({
            wch: header.width || 15
        }));
        worksheet['!cols'] = colWidths;
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: 'E6E6FA' } }
                };
            }
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    static getExportFilename(reportType, format = 'xlsx') {
        const timestamp = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const extension = format === 'xlsx' ? '.xlsx' : '.csv';
        const typeMap = {
            'monthly-stats': '月度统计报表',
            'item-usage': '物品使用排行',
            'inventory-status': '库存状态报表',
            'transaction-history': '交易历史报表'
        };
        const typeName = typeMap[reportType] || '报表';
        return `${typeName}_${timestamp}${extension}`;
    }
}
exports.ReportExportService = ReportExportService;
exports.default = ReportExportService;
//# sourceMappingURL=ReportExportService.js.map