// 权限管理工具类
export type UserRole = 'admin' | 'employee';

export interface Permission {
  // 物品管理权限
  canCreateItem: boolean;
  canEditItem: boolean;
  canDeleteItem: boolean;
  canViewItems: boolean;
  canBatchImportItems: boolean;
  
  // 库房位置管理权限
  canCreateLocation: boolean;
  canEditLocation: boolean;
  canDeleteLocation: boolean;
  canViewLocations: boolean;
  
  // 出入库管理权限
  canCreateInbound: boolean;
  canCreateOutbound: boolean;
  canBatchInbound: boolean;
  canBatchOutbound: boolean;
  canViewTransactions: boolean;
  
  // 库存查询权限
  canViewInventory: boolean;
  canViewInventoryDetails: boolean;
  
  // 报表统计权限
  canViewReports: boolean;
  canExportReports: boolean;
  
  // 系统管理权限
  canManageUsers: boolean;
  canViewSystemSettings: boolean;
}

// 根据用户角色获取权限
export const getPermissions = (role: UserRole): Permission => {
  switch (role) {
    case 'admin':
      return {
        // 管理员拥有所有权限
        canCreateItem: true,
        canEditItem: true,
        canDeleteItem: true,
        canViewItems: true,
        canBatchImportItems: true,
        
        canCreateLocation: true,
        canEditLocation: true,
        canDeleteLocation: true,
        canViewLocations: true,
        
        canCreateInbound: true,
        canCreateOutbound: true,
        canBatchInbound: true,
        canBatchOutbound: true,
        canViewTransactions: true,
        
        canViewInventory: true,
        canViewInventoryDetails: true,
        
        canViewReports: true,
        canExportReports: true,
        
        canManageUsers: true,
        canViewSystemSettings: true,
      };
      
    case 'employee':
      return {
        // 员工只有查看和基本操作权限
        canCreateItem: false,
        canEditItem: false,
        canDeleteItem: false,
        canViewItems: true,
        canBatchImportItems: false,
        
        canCreateLocation: false,
        canEditLocation: false,
        canDeleteLocation: false,
        canViewLocations: true,
        
        canCreateInbound: false,
        canCreateOutbound: true, // 员工可以申请出库
        canBatchInbound: false,
        canBatchOutbound: false,
        canViewTransactions: true,
        
        canViewInventory: true,
        canViewInventoryDetails: true,
        
        canViewReports: false,
        canExportReports: false,
        
        canManageUsers: false,
        canViewSystemSettings: false,
      };
      
    default:
      // 默认无权限
      return {
        canCreateItem: false,
        canEditItem: false,
        canDeleteItem: false,
        canViewItems: false,
        canBatchImportItems: false,
        
        canCreateLocation: false,
        canEditLocation: false,
        canDeleteLocation: false,
        canViewLocations: false,
        
        canCreateInbound: false,
        canCreateOutbound: false,
        canBatchInbound: false,
        canBatchOutbound: false,
        canViewTransactions: false,
        
        canViewInventory: false,
        canViewInventoryDetails: false,
        
        canViewReports: false,
        canExportReports: false,
        
        canManageUsers: false,
        canViewSystemSettings: false,
      };
  }
};

// 权限检查函数
export const hasPermission = (role: UserRole, permission: keyof Permission): boolean => {
  const permissions = getPermissions(role);
  return permissions[permission];
};

// 获取角色显示名称
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'employee':
      return '员工';
    default:
      return '未知';
  }
};

// 获取角色颜色
export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '#1890ff';
    case 'employee':
      return '#52c41a';
    default:
      return '#d9d9d9';
  }
};