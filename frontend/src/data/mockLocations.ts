import { Location, LOCATION_LEVELS } from '../types/location';

// 模拟库房位置数据
export const mockLocations: Location[] = [
  // 仓库级别
  {
    id: '1',
    code: 'WH001',
    name: '主仓库',
    description: '办公用品主要存储仓库',
    level: LOCATION_LEVELS.WAREHOUSE,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  
  // 区域级别
  {
    id: '2',
    code: 'A',
    name: 'A区',
    description: '办公用品存储区',
    parentId: '1',
    level: LOCATION_LEVELS.AREA,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '3',
    code: 'B',
    name: 'B区',
    description: '文具存储区',
    parentId: '1',
    level: LOCATION_LEVELS.AREA,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '4',
    code: 'C',
    name: 'C区',
    description: '办公设备存储区',
    parentId: '1',
    level: LOCATION_LEVELS.AREA,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '5',
    code: 'D',
    name: 'D区',
    description: '其他物品存储区',
    parentId: '1',
    level: LOCATION_LEVELS.AREA,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  
  // 货架级别 - A区
  {
    id: '6',
    code: 'A-01',
    name: 'A区-01货架',
    description: 'A区第1号货架',
    parentId: '2',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '7',
    code: 'A-02',
    name: 'A区-02货架',
    description: 'A区第2号货架',
    parentId: '2',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '8',
    code: 'A-03',
    name: 'A区-03货架',
    description: 'A区第3号货架',
    parentId: '2',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  
  // 货架级别 - B区
  {
    id: '9',
    code: 'B-01',
    name: 'B区-01货架',
    description: 'B区第1号货架',
    parentId: '3',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '10',
    code: 'B-02',
    name: 'B区-02货架',
    description: 'B区第2号货架',
    parentId: '3',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '11',
    code: 'B-03',
    name: 'B区-03货架',
    description: 'B区第3号货架',
    parentId: '3',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  
  // 货架级别 - C区
  {
    id: '12',
    code: 'C-01',
    name: 'C区-01货架',
    description: 'C区第1号货架',
    parentId: '4',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '13',
    code: 'C-02',
    name: 'C区-02货架',
    description: 'C区第2号货架',
    parentId: '4',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '14',
    code: 'C-03',
    name: 'C区-03货架',
    description: 'C区第3号货架',
    parentId: '4',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '15',
    code: 'C-04',
    name: 'C区-04货架',
    description: 'C区第4号货架',
    parentId: '4',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '16',
    code: 'C-05',
    name: 'C区-05货架',
    description: 'C区第5号货架',
    parentId: '4',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  
  // 货架级别 - D区
  {
    id: '17',
    code: 'D-01',
    name: 'D区-01货架',
    description: 'D区第1号货架',
    parentId: '5',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
  {
    id: '18',
    code: 'D-02',
    name: 'D区-02货架',
    description: 'D区第2号货架',
    parentId: '5',
    level: LOCATION_LEVELS.SHELF,
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
  },
];

// 获取位置的完整路径
export const getLocationPath = (locationId: string, locations: Location[] = mockLocations): string => {
  const location = locations.find(loc => loc.id === locationId);
  if (!location) return '';
  
  if (!location.parentId) {
    return location.name;
  }
  
  const parentPath = getLocationPath(location.parentId, locations);
  return parentPath ? `${parentPath} > ${location.name}` : location.name;
};

// 获取子位置
export const getChildLocations = (parentId: string, locations: Location[] = mockLocations): Location[] => {
  return locations.filter(loc => loc.parentId === parentId);
};

// 获取根位置（仓库级别）
export const getRootLocations = (locations: Location[] = mockLocations): Location[] => {
  return locations.filter(loc => loc.level === LOCATION_LEVELS.WAREHOUSE);
};

// 构建位置树结构
export const buildLocationTree = (locations: Location[] = mockLocations): Location[] => {
  const locationMap = new Map<string, Location & { children?: Location[] }>();
  
  // 创建位置映射
  locations.forEach(location => {
    locationMap.set(location.id, { ...location, children: [] });
  });
  
  const tree: Location[] = [];
  
  // 构建树结构
  locations.forEach(location => {
    const locationWithChildren = locationMap.get(location.id)!;
    
    if (location.parentId) {
      const parent = locationMap.get(location.parentId);
      if (parent) {
        parent.children!.push(locationWithChildren);
      }
    } else {
      tree.push(locationWithChildren);
    }
  });
  
  return tree;
};