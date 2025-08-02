import { Transaction, InventoryStatus } from '../types/transaction';
import { mockItems } from './mockItems';
// import { mockLocations } from './mockLocations';

// 模拟交易记录数据
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    itemId: '1',
    itemName: 'A4复印纸',
    locationId: '6',
    locationName: 'A区-01货架',
    locationCode: 'A-01',
    type: 'inbound',
    quantity: 50,
    date: '2024-01-15T08:00:00Z',
    operator: '张三',
    supplier: '办公用品供应商',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    itemId: '2',
    itemName: '黑色签字笔',
    locationId: '11',
    locationName: 'B区-03货架',
    locationCode: 'B-03',
    type: 'inbound',
    quantity: 100,
    date: '2024-01-10T09:15:00Z',
    operator: '李四',
    supplier: '文具批发商',
    createdAt: '2024-01-10T09:15:00Z',
  },
  {
    id: '3',
    itemId: '1',
    itemName: 'A4复印纸',
    locationId: '6',
    locationName: 'A区-01货架',
    locationCode: 'A-01',
    type: 'outbound',
    quantity: 25,
    date: '2024-01-20T10:30:00Z',
    operator: '王五',
    recipient: '行政部',
    purpose: '日常办公使用',
    createdAt: '2024-01-20T10:30:00Z',
  },
  {
    id: '4',
    itemId: '2',
    itemName: '黑色签字笔',
    locationId: '11',
    locationName: 'B区-03货架',
    locationCode: 'B-03',
    type: 'outbound',
    quantity: 92,
    date: '2024-01-18T14:20:00Z',
    operator: '赵六',
    recipient: '销售部',
    purpose: '签署合同使用',
    createdAt: '2024-01-18T14:20:00Z',
  },
  {
    id: '5',
    itemId: '3',
    itemName: '订书机',
    locationId: '16',
    locationName: 'C区-05货架',
    locationCode: 'C-05',
    type: 'inbound',
    quantity: 10,
    date: '2024-01-08T11:00:00Z',
    operator: '张三',
    supplier: '办公设备供应商',
    createdAt: '2024-01-08T11:00:00Z',
  },
  {
    id: '6',
    itemId: '3',
    itemName: '订书机',
    locationId: '16',
    locationName: 'C区-05货架',
    locationCode: 'C-05',
    type: 'outbound',
    quantity: 5,
    date: '2024-01-16T16:45:00Z',
    operator: '李四',
    recipient: '财务部',
    purpose: '装订财务报表',
    createdAt: '2024-01-16T16:45:00Z',
  },
  {
    id: '7',
    itemId: '4',
    itemName: '便利贴',
    locationId: '10',
    locationName: 'B区-02货架',
    locationCode: 'B-02',
    type: 'inbound',
    quantity: 20,
    date: '2024-01-12T13:30:00Z',
    operator: '王五',
    supplier: '文具批发商',
    createdAt: '2024-01-12T13:30:00Z',
  },
  {
    id: '8',
    itemId: '4',
    itemName: '便利贴',
    locationId: '10',
    locationName: 'B区-02货架',
    locationCode: 'B-02',
    type: 'outbound',
    quantity: 5,
    date: '2024-01-19T09:10:00Z',
    operator: '赵六',
    recipient: '人事部',
    purpose: '会议记录',
    createdAt: '2024-01-19T09:10:00Z',
  },
];

// 根据物品ID和位置ID获取当前库存
export const getCurrentStock = (itemId: string, locationId: string): number => {
  const transactions = mockTransactions.filter(
    t => t.itemId === itemId && t.locationId === locationId
  );
  
  let stock = 0;
  transactions.forEach(transaction => {
    if (transaction.type === 'inbound') {
      stock += transaction.quantity;
    } else {
      stock -= transaction.quantity;
    }
  });
  
  return Math.max(0, stock);
};

// 获取物品在所有位置的库存状态
export const getInventoryStatus = (): InventoryStatus[] => {
  const inventoryMap = new Map<string, InventoryStatus>();
  
  // 遍历所有交易记录，计算每个物品在每个位置的库存
  mockTransactions.forEach(transaction => {
    const key = `${transaction.itemId}-${transaction.locationId}`;
    
    if (!inventoryMap.has(key)) {
      const item = mockItems.find(i => i.id === transaction.itemId);
      inventoryMap.set(key, {
        itemId: transaction.itemId,
        itemName: transaction.itemName,
        locationId: transaction.locationId,
        locationName: transaction.locationName,
        locationCode: transaction.locationCode,
        currentStock: 0,
        minStock: item?.minStock || 0,
        isLowStock: false,
        lastTransactionDate: transaction.date,
      });
    }
    
    const inventory = inventoryMap.get(key)!;
    if (transaction.type === 'inbound') {
      inventory.currentStock += transaction.quantity;
    } else {
      inventory.currentStock -= transaction.quantity;
    }
    
    // 更新最后交易日期
    if (new Date(transaction.date) > new Date(inventory.lastTransactionDate || '')) {
      inventory.lastTransactionDate = transaction.date;
    }
  });
  
  // 计算低库存状态
  const result = Array.from(inventoryMap.values()).map(inventory => ({
    ...inventory,
    currentStock: Math.max(0, inventory.currentStock),
    isLowStock: inventory.currentStock <= inventory.minStock,
  }));
  
  return result;
};

// 获取物品在指定位置的库存
export const getItemLocationStock = (itemId: string, locationId: string): number => {
  return getCurrentStock(itemId, locationId);
};

// 获取物品在所有位置的库存分布
export const getItemStockDistribution = (itemId: string): InventoryStatus[] => {
  return getInventoryStatus().filter(inventory => inventory.itemId === itemId);
};

// 获取位置的所有物品库存
export const getLocationInventory = (locationId: string): InventoryStatus[] => {
  return getInventoryStatus().filter(inventory => inventory.locationId === locationId);
};

// 模拟操作人员选项
export const operatorOptions: string[] = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
  '孙八',
];

// 模拟供应商选项
export const supplierOptions: string[] = [
  '办公用品供应商',
  '文具批发商',
  '办公设备供应商',
  '清洁用品供应商',
  '电子产品供应商',
];

// 模拟部门选项（领用人）
export const departmentOptions: string[] = [
  '行政部',
  '人事部',
  '财务部',
  '销售部',
  '市场部',
  '技术部',
  '客服部',
  '采购部',
];

// 模拟用途选项
export const purposeOptions: string[] = [
  '日常办公使用',
  '会议使用',
  '培训使用',
  '客户接待',
  '项目需要',
  '设备维护',
  '临时需要',
  '其他',
];