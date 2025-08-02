import { InventoryStatus, InventoryGroupByLocation, InventoryDetail, InventorySummary, InventoryFilter } from '../types/inventory';

// 生成模拟库存数据 - 每个物品在多个位置都有库存
export const mockInventoryStatus: InventoryStatus[] = [
  // A4复印纸在多个位置的库存
  {
    itemId: '1',
    itemName: 'A4复印纸',
    itemCategory: '办公用品',
    itemUnit: '包',
    locationId: '6',
    locationName: 'A区-01货架',
    locationCode: 'A-01',
    currentStock: 15,
    minStock: 10,
    isLowStock: false,
    lastTransactionDate: '2024-01-20T10:30:00Z',
  },
  {
    itemId: '1',
    itemName: 'A4复印纸',
    itemCategory: '办公用品',
    itemUnit: '包',
    locationId: '7',
    locationName: 'A区-02货架',
    locationCode: 'A-02',
    currentStock: 10,
    minStock: 10,
    isLowStock: false,
    lastTransactionDate: '2024-01-19T14:20:00Z',
  },
  {
    itemId: '1',
    itemName: 'A4复印纸',
    itemCategory: '办公用品',
    itemUnit: '包',
    locationId: '17',
    locationName: 'D区-01货架',
    locationCode: 'D-01',
    currentStock: 5,
    minStock: 10,
    isLowStock: true,
    lastTransactionDate: '2024-01-18T09:15:00Z',
  },

  // 黑色签字笔在多个位置的库存
  {
    itemId: '2',
    itemName: '黑色签字笔',
    itemCategory: '文具',
    itemUnit: '支',
    locationId: '11',
    locationName: 'B区-03货架',
    locationCode: 'B-03',
    currentStock: 8,
    minStock: 20,
    isLowStock: true,
    lastTransactionDate: '2024-01-18T14:20:00Z',
  },
  {
    itemId: '2',
    itemName: '黑色签字笔',
    itemCategory: '文具',
    itemUnit: '支',
    locationId: '10',
    locationName: 'B区-02货架',
    locationCode: 'B-02',
    currentStock: 25,
    minStock: 20,
    isLowStock: false,
    lastTransactionDate: '2024-01-17T11:30:00Z',
  },

  // 订书机库存
  {
    itemId: '3',
    itemName: '订书机',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '16',
    locationName: 'C区-05货架',
    locationCode: 'C-05',
    currentStock: 5,
    minStock: 3,
    isLowStock: false,
    lastTransactionDate: '2024-01-16T16:45:00Z',
  },
  {
    itemId: '3',
    itemName: '订书机',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '12',
    locationName: 'C区-01货架',
    locationCode: 'C-01',
    currentStock: 2,
    minStock: 3,
    isLowStock: true,
    lastTransactionDate: '2024-01-15T13:20:00Z',
  },

  // 便利贴库存
  {
    itemId: '4',
    itemName: '便利贴',
    itemCategory: '文具',
    itemUnit: '本',
    locationId: '10',
    locationName: 'B区-02货架',
    locationCode: 'B-02',
    currentStock: 15,
    minStock: 8,
    isLowStock: false,
    lastTransactionDate: '2024-01-19T09:10:00Z',
  },
  {
    itemId: '4',
    itemName: '便利贴',
    itemCategory: '文具',
    itemUnit: '本',
    locationId: '9',
    locationName: 'B区-01货架',
    locationCode: 'B-01',
    currentStock: 6,
    minStock: 8,
    isLowStock: true,
    lastTransactionDate: '2024-01-16T15:45:00Z',
  },

  // 文件夹库存
  {
    itemId: '5',
    itemName: '文件夹',
    itemCategory: '办公用品',
    itemUnit: '个',
    locationId: '7',
    locationName: 'A区-02货架',
    locationCode: 'A-02',
    currentStock: 12,
    minStock: 15,
    isLowStock: true,
    lastTransactionDate: '2024-01-21T11:00:00Z',
  },
  {
    itemId: '5',
    itemName: '文件夹',
    itemCategory: '办公用品',
    itemUnit: '个',
    locationId: '8',
    locationName: 'A区-03货架',
    locationCode: 'A-03',
    currentStock: 18,
    minStock: 15,
    isLowStock: false,
    lastTransactionDate: '2024-01-20T16:30:00Z',
  },

  // 打印机墨盒库存
  {
    itemId: '6',
    itemName: '打印机墨盒',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '12',
    locationName: 'C区-01货架',
    locationCode: 'C-01',
    currentStock: 3,
    minStock: 5,
    isLowStock: true,
    lastTransactionDate: '2024-01-17T13:15:00Z',
  },
  {
    itemId: '6',
    itemName: '打印机墨盒',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '13',
    locationName: 'C区-02货架',
    locationCode: 'C-02',
    currentStock: 7,
    minStock: 5,
    isLowStock: false,
    lastTransactionDate: '2024-01-19T10:45:00Z',
  },

  // 胶带库存
  {
    itemId: '7',
    itemName: '胶带',
    itemCategory: '办公用品',
    itemUnit: '卷',
    locationId: '8',
    locationName: 'A区-03货架',
    locationCode: 'A-03',
    currentStock: 20,
    minStock: 10,
    isLowStock: false,
    lastTransactionDate: '2024-01-20T15:30:00Z',
  },

  // 计算器库存
  {
    itemId: '8',
    itemName: '计算器',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '13',
    locationName: 'C区-02货架',
    locationCode: 'C-02',
    currentStock: 4,
    minStock: 6,
    isLowStock: true,
    lastTransactionDate: '2024-01-18T10:20:00Z',
  },
  {
    itemId: '8',
    itemName: '计算器',
    itemCategory: '办公设备',
    itemUnit: '个',
    locationId: '14',
    locationName: 'C区-03货架',
    locationCode: 'C-03',
    currentStock: 8,
    minStock: 6,
    isLowStock: false,
    lastTransactionDate: '2024-01-17T14:30:00Z',
  },
];

// 按位置分组库存数据
export const getInventoryGroupedByLocation = (inventoryData: InventoryStatus[] = mockInventoryStatus): InventoryGroupByLocation[] => {
  const locationMap = new Map<string, InventoryGroupByLocation>();

  inventoryData.forEach(item => {
    if (!locationMap.has(item.locationId)) {
      locationMap.set(item.locationId, {
        locationId: item.locationId,
        locationName: item.locationName,
        locationCode: item.locationCode,
        items: [],
        totalItems: 0,
        lowStockItems: 0,
      });
    }

    const locationGroup = locationMap.get(item.locationId)!;
    locationGroup.items.push(item);
    locationGroup.totalItems++;
    if (item.isLowStock) {
      locationGroup.lowStockItems++;
    }
  });

  return Array.from(locationMap.values()).sort((a, b) => a.locationCode.localeCompare(b.locationCode));
};

// 获取库存汇总信息
export const getInventorySummary = (inventoryData: InventoryStatus[] = mockInventoryStatus): InventorySummary => {
  const uniqueItems = new Set(inventoryData.map(item => item.itemId));
  const uniqueLocations = new Set(inventoryData.map(item => item.locationId));
  const lowStockItems = new Set(inventoryData.filter(item => item.isLowStock).map(item => item.itemId));
  const outOfStockItems = new Set(inventoryData.filter(item => item.currentStock === 0).map(item => item.itemId));

  return {
    totalItems: uniqueItems.size,
    totalLocations: uniqueLocations.size,
    lowStockItems: lowStockItems.size,
    outOfStockItems: outOfStockItems.size,
  };
};

// 获取物品详细库存信息
export const getItemInventoryDetail = (itemId: string, inventoryData: InventoryStatus[] = mockInventoryStatus): InventoryDetail | null => {
  const itemInventories = inventoryData.filter(inv => inv.itemId === itemId);
  if (itemInventories.length === 0) return null;

  const firstItem = itemInventories[0];
  const totalStock = itemInventories.reduce((sum, inv) => sum + inv.currentStock, 0);
  const lowStockLocations = itemInventories.filter(inv => inv.isLowStock).length;

  return {
    itemId: firstItem.itemId,
    itemName: firstItem.itemName,
    itemCategory: firstItem.itemCategory,
    itemUnit: firstItem.itemUnit,
    minStock: firstItem.minStock,
    locations: itemInventories.map(inv => ({
      locationId: inv.locationId,
      locationName: inv.locationName,
      locationCode: inv.locationCode,
      currentStock: inv.currentStock,
      isLowStock: inv.isLowStock,
    })),
    totalStock,
    totalLowStockLocations: lowStockLocations,
  };
};

// 过滤库存数据
export const filterInventoryData = (
  inventoryData: InventoryStatus[],
  filter: InventoryFilter
): InventoryStatus[] => {
  return inventoryData.filter(item => {
    if (filter.itemName && !item.itemName.toLowerCase().includes(filter.itemName.toLowerCase())) {
      return false;
    }
    if (filter.category && item.itemCategory !== filter.category) {
      return false;
    }
    if (filter.locationId && item.locationId !== filter.locationId) {
      return false;
    }
    if (filter.locationName && !item.locationName.toLowerCase().includes(filter.locationName.toLowerCase())) {
      return false;
    }
    if (filter.lowStockOnly && !item.isLowStock) {
      return false;
    }
    return true;
  });
};