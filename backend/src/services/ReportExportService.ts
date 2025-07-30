import * as XLSX from 'xlsx';
import { format as formatDate } from 'date-fns';

// 报表数据接口
export interface ReportData {
  [key: string]: any;
}

// 报表导出配置
export interface ExportConfig {
  filename: string;
  sheetName: string;
  headers: Array<{
    key: string;
    title: string;
    width?: number;
  }>;
}

// 月度统计报表数据
export interface MonthlyStatsData {
  month: string;
  inboundTotal: number;
  outboundTotal: number;
  netChange: number;
  itemCount: number;
}

// 物品使用排行数据
export interface ItemUsageRankingData {
  itemName: string;
  category: string;
  totalOutbound: number;
  frequency: number;
  lastUsedDate: string;
}

// 库存状态报表数据
export interface InventoryStatusData {
  itemName: string;
  category: string;
  locationName: string;
  currentStock: number;
  lowStockThreshold: number;
  status: 'normal' | 'low' | 'out_of_stock';
  lastTransactionDate: string;
}

// 交易历史报表数据
export interface TransactionHistoryData {
  date: string;
  itemName: string;
  locationName: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  operator: string;
  supplier?: string;
  recipient?: string;
  purpose?: string;
}

export class ReportExportService {
  /**
   * 导出月度统计报表为Excel
   */
  static exportMonthlyStats(data: MonthlyStatsData[]): Buffer {
    const config: ExportConfig = {
      filename: `月度统计报表_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
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

  /**
   * 导出物品使用排行报表为Excel
   */
  static exportItemUsageRanking(data: ItemUsageRankingData[]): Buffer {
    const config: ExportConfig = {
      filename: `物品使用排行_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
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

  /**
   * 导出库存状态报表为Excel
   */
  static exportInventoryStatus(data: InventoryStatusData[]): Buffer {
    const config: ExportConfig = {
      filename: `库存状态报表_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
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

  /**
   * 导出交易历史报表为Excel
   */
  static exportTransactionHistory(data: TransactionHistoryData[]): Buffer {
    const config: ExportConfig = {
      filename: `交易历史报表_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
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

  /**
   * 导出数据为CSV格式
   */
  static exportToCSV(data: ReportData[], headers: Array<{ key: string; title: string }>): string {
    if (!data || data.length === 0) {
      throw new Error('没有数据可导出');
    }

    // 构建CSV内容
    const csvHeaders = headers.map(h => h.title).join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header.key];
        // 处理null和undefined
        if (value === null || value === undefined) {
          return '';
        }
        // 处理布尔值
        if (typeof value === 'boolean') {
          return value.toString();
        }
        // 处理数字
        if (typeof value === 'number') {
          return value.toString();
        }
        // 处理字符串，包含逗号或引号的值需要用引号包围
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value.toString();
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * 导出月度统计为CSV
   */
  static exportMonthlyStatsToCSV(data: MonthlyStatsData[]): string {
    const headers = [
      { key: 'month', title: '月份' },
      { key: 'inboundTotal', title: '入库总量' },
      { key: 'outboundTotal', title: '出库总量' },
      { key: 'netChange', title: '净变化' },
      { key: 'itemCount', title: '涉及物品数' }
    ];

    return this.exportToCSV(data, headers);
  }

  /**
   * 导出物品使用排行为CSV
   */
  static exportItemUsageRankingToCSV(data: ItemUsageRankingData[]): string {
    const headers = [
      { key: 'itemName', title: '物品名称' },
      { key: 'category', title: '物品类别' },
      { key: 'totalOutbound', title: '总出库量' },
      { key: 'frequency', title: '使用频次' },
      { key: 'lastUsedDate', title: '最后使用日期' }
    ];

    return this.exportToCSV(data, headers);
  }

  /**
   * 导出库存状态为CSV
   */
  static exportInventoryStatusToCSV(data: InventoryStatusData[]): string {
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

  /**
   * 导出交易历史为CSV
   */
  static exportTransactionHistoryToCSV(data: TransactionHistoryData[]): string {
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

  /**
   * 通用Excel导出方法
   */
  private static exportToExcel(data: ReportData[], config: ExportConfig): Buffer {
    if (!data || data.length === 0) {
      throw new Error('没有数据可导出');
    }

    const workbook = XLSX.utils.book_new();
    
    // 准备数据
    const worksheetData = [
      config.headers.map(h => h.title),
      ...data.map(row => config.headers.map(header => {
        const value = row[header.key];
        // 处理特殊值
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
    
    // 设置列宽
    const colWidths = config.headers.map(header => ({ 
      wch: header.width || 15 
    }));
    worksheet['!cols'] = colWidths;
    
    // 设置表头样式（如果支持的话）
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

  /**
   * 获取导出文件名
   */
  static getExportFilename(reportType: string, format: 'xlsx' | 'csv' = 'xlsx'): string {
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const extension = format === 'xlsx' ? '.xlsx' : '.csv';
    
    const typeMap: { [key: string]: string } = {
      'monthly-stats': '月度统计报表',
      'item-usage': '物品使用排行',
      'inventory-status': '库存状态报表',
      'transaction-history': '交易历史报表'
    };

    const typeName = typeMap[reportType] || '报表';
    return `${typeName}_${timestamp}${extension}`;
  }
}

export default ReportExportService;