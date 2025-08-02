import { mockTransactions } from './mockTransactions';
import { mockItems } from './mockItems';

// 报表相关的数据类型
export interface MonthlyStats {
  month: string;
  inboundTotal: number;
  outboundTotal: number;
  transactionCount: number;
}

export interface ItemUsageRank {
  itemId: string;
  itemName: string;
  category: string;
  outboundCount: number;
  outboundQuantity: number;
  rank: number;
}

export interface DailyStats {
  date: string;
  inboundQuantity: number;
  outboundQuantity: number;
  transactionCount: number;
}

export interface CategoryStats {
  category: string;
  inboundQuantity: number;
  outboundQuantity: number;
  itemCount: number;
}

// 生成月度统计数据
export const generateMonthlyStats = (startDate: Date, endDate: Date): MonthlyStats[] => {
  const stats: MonthlyStats[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const monthStr = current.toISOString().substring(0, 7); // YYYY-MM
    const monthTransactions = mockTransactions.filter(t => 
      t.date.substring(0, 7) === monthStr
    );
    
    const inboundTransactions = monthTransactions.filter(t => t.type === 'inbound');
    const outboundTransactions = monthTransactions.filter(t => t.type === 'outbound');
    
    stats.push({
      month: monthStr,
      inboundTotal: inboundTransactions.reduce((sum, t) => sum + t.quantity, 0),
      outboundTotal: outboundTransactions.reduce((sum, t) => sum + t.quantity, 0),
      transactionCount: monthTransactions.length,
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return stats;
};

// 生成物品使用排行数据
export const generateItemUsageRank = (startDate?: Date, endDate?: Date): ItemUsageRank[] => {
  let filteredTransactions = mockTransactions;
  
  if (startDate && endDate) {
    filteredTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  
  const outboundTransactions = filteredTransactions.filter(t => t.type === 'outbound');
  const itemUsageMap = new Map<string, { count: number; quantity: number }>();
  
  outboundTransactions.forEach(t => {
    const existing = itemUsageMap.get(t.itemId) || { count: 0, quantity: 0 };
    itemUsageMap.set(t.itemId, {
      count: existing.count + 1,
      quantity: existing.quantity + t.quantity,
    });
  });
  
  const rankings: ItemUsageRank[] = [];
  itemUsageMap.forEach((usage, itemId) => {
    const item = mockItems.find(i => i.id === itemId);
    if (item) {
      rankings.push({
        itemId,
        itemName: item.name,
        category: item.category,
        outboundCount: usage.count,
        outboundQuantity: usage.quantity,
        rank: 0, // 将在排序后设置
      });
    }
  });
  
  // 按出库次数排序并设置排名
  rankings.sort((a, b) => b.outboundCount - a.outboundCount);
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return rankings;
};

// 生成每日统计数据
export const generateDailyStats = (startDate: Date, endDate: Date): DailyStats[] => {
  const stats: DailyStats[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().substring(0, 10); // YYYY-MM-DD
    const dayTransactions = mockTransactions.filter(t => 
      t.date.substring(0, 10) === dateStr
    );
    
    const inboundTransactions = dayTransactions.filter(t => t.type === 'inbound');
    const outboundTransactions = dayTransactions.filter(t => t.type === 'outbound');
    
    stats.push({
      date: dateStr,
      inboundQuantity: inboundTransactions.reduce((sum, t) => sum + t.quantity, 0),
      outboundQuantity: outboundTransactions.reduce((sum, t) => sum + t.quantity, 0),
      transactionCount: dayTransactions.length,
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return stats;
};

// 生成分类统计数据
export const generateCategoryStats = (startDate?: Date, endDate?: Date): CategoryStats[] => {
  let filteredTransactions = mockTransactions;
  
  if (startDate && endDate) {
    filteredTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  
  const categoryMap = new Map<string, { inbound: number; outbound: number; items: Set<string> }>();
  
  filteredTransactions.forEach(t => {
    const item = mockItems.find(i => i.id === t.itemId);
    if (item) {
      const existing = categoryMap.get(item.category) || { 
        inbound: 0, 
        outbound: 0, 
        items: new Set<string>() 
      };
      
      if (t.type === 'inbound') {
        existing.inbound += t.quantity;
      } else {
        existing.outbound += t.quantity;
      }
      existing.items.add(t.itemId);
      
      categoryMap.set(item.category, existing);
    }
  });
  
  const stats: CategoryStats[] = [];
  categoryMap.forEach((data, category) => {
    stats.push({
      category,
      inboundQuantity: data.inbound,
      outboundQuantity: data.outbound,
      itemCount: data.items.size,
    });
  });
  
  return stats.sort((a, b) => (b.inboundQuantity + b.outboundQuantity) - (a.inboundQuantity + a.outboundQuantity));
};

// 默认的模拟数据
export const mockMonthlyStats = generateMonthlyStats(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

export const mockItemUsageRank = generateItemUsageRank();

export const mockDailyStats = generateDailyStats(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

export const mockCategoryStats = generateCategoryStats();

// CSV导出相关的工具函数
export const convertToCSV = (data: any[], headers: string[]): string => {
  // 创建中文表头映射
  const headerMapping: { [key: string]: string } = {
    month: '月份',
    inboundTotal: '入库总量',
    outboundTotal: '出库总量',
    transactionCount: '交易次数',
    date: '日期',
    inboundQuantity: '入库数量',
    outboundQuantity: '出库数量',
    rank: '排名',
    itemName: '物品名称',
    category: '类别',
    outboundCount: '出库次数',
    itemCount: '物品数量',
    reportType: '报表类型',
    value: '统计值',
    description: '描述'
  };

  // 转换表头为中文
  const csvHeaders = headers.map(header => headerMapping[header] || header).join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // 处理null和undefined
      if (value === null || value === undefined) {
        return '';
      }
      // 处理包含逗号、引号或换行符的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// 获取文件大小的工具函数
export const getFileSizeString = (content: string): string => {
  const bytes = new Blob([content]).size;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 下载CSV文件的工具函数
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};