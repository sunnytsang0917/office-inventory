/**
 * 系统权限配置
 * 定义所有可用的权限和角色权限映射
 */

// 权限常量定义
export const PERMISSIONS = {
  // 物品管理权限
  ITEMS_READ: 'items:read',
  ITEMS_CREATE: 'items:create',
  ITEMS_UPDATE: 'items:update',
  ITEMS_DELETE: 'items:delete',

  // 库房位置管理权限
  LOCATIONS_READ: 'locations:read',
  LOCATIONS_CREATE: 'locations:create',
  LOCATIONS_UPDATE: 'locations:update',
  LOCATIONS_DELETE: 'locations:delete',

  // 交易记录权限
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',

  // 库存管理权限
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',

  // 报表权限
  REPORTS_READ: 'reports:read',
  REPORTS_CREATE: 'reports:create',
  REPORTS_UPDATE: 'reports:update',
  REPORTS_DELETE: 'reports:delete',

  // 用户管理权限
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // 系统管理权限
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
} as const;

// 权限组定义
export const PERMISSION_GROUPS = {
  // 物品管理权限组
  ITEMS_MANAGEMENT: [
    PERMISSIONS.ITEMS_READ,
    PERMISSIONS.ITEMS_CREATE,
    PERMISSIONS.ITEMS_UPDATE,
    PERMISSIONS.ITEMS_DELETE,
  ],

  // 库房位置管理权限组
  LOCATIONS_MANAGEMENT: [
    PERMISSIONS.LOCATIONS_READ,
    PERMISSIONS.LOCATIONS_CREATE,
    PERMISSIONS.LOCATIONS_UPDATE,
    PERMISSIONS.LOCATIONS_DELETE,
  ],

  // 交易管理权限组
  TRANSACTIONS_MANAGEMENT: [
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_UPDATE,
    PERMISSIONS.TRANSACTIONS_DELETE,
  ],

  // 库存管理权限组
  INVENTORY_MANAGEMENT: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
  ],

  // 报表管理权限组
  REPORTS_MANAGEMENT: [
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_UPDATE,
    PERMISSIONS.REPORTS_DELETE,
  ],

  // 用户管理权限组
  USERS_MANAGEMENT: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
  ],

  // 系统管理权限组
  SYSTEM_MANAGEMENT: [
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_CONFIG,
  ],
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS = {
  admin: [
    // 管理员拥有所有权限
    ...PERMISSION_GROUPS.ITEMS_MANAGEMENT,
    ...PERMISSION_GROUPS.LOCATIONS_MANAGEMENT,
    ...PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT,
    ...PERMISSION_GROUPS.INVENTORY_MANAGEMENT,
    ...PERMISSION_GROUPS.REPORTS_MANAGEMENT,
    ...PERMISSION_GROUPS.USERS_MANAGEMENT,
    ...PERMISSION_GROUPS.SYSTEM_MANAGEMENT,
  ],

  employee: [
    // 员工权限：基本的读取和创建权限
    PERMISSIONS.ITEMS_READ,
    PERMISSIONS.ITEMS_CREATE,
    PERMISSIONS.ITEMS_UPDATE,
    
    PERMISSIONS.LOCATIONS_READ,
    
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRANSACTIONS_CREATE,
    
    PERMISSIONS.INVENTORY_READ,
    
    PERMISSIONS.REPORTS_READ,
  ],
} as const;

// 权限描述映射（用于UI显示）
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.ITEMS_READ]: '查看物品信息',
  [PERMISSIONS.ITEMS_CREATE]: '创建物品',
  [PERMISSIONS.ITEMS_UPDATE]: '编辑物品信息',
  [PERMISSIONS.ITEMS_DELETE]: '删除物品',

  [PERMISSIONS.LOCATIONS_READ]: '查看库房位置',
  [PERMISSIONS.LOCATIONS_CREATE]: '创建库房位置',
  [PERMISSIONS.LOCATIONS_UPDATE]: '编辑库房位置',
  [PERMISSIONS.LOCATIONS_DELETE]: '删除库房位置',

  [PERMISSIONS.TRANSACTIONS_READ]: '查看交易记录',
  [PERMISSIONS.TRANSACTIONS_CREATE]: '创建交易记录',
  [PERMISSIONS.TRANSACTIONS_UPDATE]: '编辑交易记录',
  [PERMISSIONS.TRANSACTIONS_DELETE]: '删除交易记录',

  [PERMISSIONS.INVENTORY_READ]: '查看库存信息',
  [PERMISSIONS.INVENTORY_UPDATE]: '更新库存',

  [PERMISSIONS.REPORTS_READ]: '查看报表',
  [PERMISSIONS.REPORTS_CREATE]: '创建报表',
  [PERMISSIONS.REPORTS_UPDATE]: '编辑报表',
  [PERMISSIONS.REPORTS_DELETE]: '删除报表',

  [PERMISSIONS.USERS_READ]: '查看用户信息',
  [PERMISSIONS.USERS_CREATE]: '创建用户',
  [PERMISSIONS.USERS_UPDATE]: '编辑用户信息',
  [PERMISSIONS.USERS_DELETE]: '删除用户',

  [PERMISSIONS.SYSTEM_ADMIN]: '系统管理',
  [PERMISSIONS.SYSTEM_CONFIG]: '系统配置',
} as const;

// 角色描述映射
export const ROLE_DESCRIPTIONS = {
  admin: '管理员',
  employee: '员工',
} as const;

/**
 * 检查用户是否具有指定权限
 * @param userRole 用户角色
 * @param permission 权限名称
 * @returns 是否具有权限
 */
export function hasPermission(userRole: keyof typeof ROLE_PERMISSIONS, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission as any);
}

/**
 * 获取角色的所有权限
 * @param userRole 用户角色
 * @returns 权限列表
 */
export function getRolePermissions(userRole: keyof typeof ROLE_PERMISSIONS): string[] {
  return [...ROLE_PERMISSIONS[userRole]];
}

/**
 * 检查用户是否具有权限组中的所有权限
 * @param userRole 用户角色
 * @param permissions 权限列表
 * @returns 是否具有所有权限
 */
export function hasAllPermissions(userRole: keyof typeof ROLE_PERMISSIONS, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * 检查用户是否具有权限组中的任一权限
 * @param userRole 用户角色
 * @param permissions 权限列表
 * @returns 是否具有任一权限
 */
export function hasAnyPermission(userRole: keyof typeof ROLE_PERMISSIONS, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * 获取权限的描述信息
 * @param permission 权限名称
 * @returns 权限描述
 */
export function getPermissionDescription(permission: string): string {
  return PERMISSION_DESCRIPTIONS[permission as keyof typeof PERMISSION_DESCRIPTIONS] || permission;
}

/**
 * 获取角色的描述信息
 * @param role 角色名称
 * @returns 角色描述
 */
export function getRoleDescription(role: string): string {
  return ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || role;
}

/**
 * 验证权限名称是否有效
 * @param permission 权限名称
 * @returns 是否为有效权限
 */
export function isValidPermission(permission: string): boolean {
  return Object.values(PERMISSIONS).includes(permission as any);
}

/**
 * 验证角色名称是否有效
 * @param role 角色名称
 * @returns 是否为有效角色
 */
export function isValidRole(role: string): boolean {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}

// 导出类型定义
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = keyof typeof ROLE_PERMISSIONS;
export type PermissionGroup = typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS];