"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_DESCRIPTIONS = exports.PERMISSION_DESCRIPTIONS = exports.ROLE_PERMISSIONS = exports.PERMISSION_GROUPS = exports.PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.getRolePermissions = getRolePermissions;
exports.hasAllPermissions = hasAllPermissions;
exports.hasAnyPermission = hasAnyPermission;
exports.getPermissionDescription = getPermissionDescription;
exports.getRoleDescription = getRoleDescription;
exports.isValidPermission = isValidPermission;
exports.isValidRole = isValidRole;
exports.PERMISSIONS = {
    ITEMS_READ: 'items:read',
    ITEMS_CREATE: 'items:create',
    ITEMS_UPDATE: 'items:update',
    ITEMS_DELETE: 'items:delete',
    LOCATIONS_READ: 'locations:read',
    LOCATIONS_CREATE: 'locations:create',
    LOCATIONS_UPDATE: 'locations:update',
    LOCATIONS_DELETE: 'locations:delete',
    TRANSACTIONS_READ: 'transactions:read',
    TRANSACTIONS_CREATE: 'transactions:create',
    TRANSACTIONS_UPDATE: 'transactions:update',
    TRANSACTIONS_DELETE: 'transactions:delete',
    INVENTORY_READ: 'inventory:read',
    INVENTORY_UPDATE: 'inventory:update',
    REPORTS_READ: 'reports:read',
    REPORTS_CREATE: 'reports:create',
    REPORTS_UPDATE: 'reports:update',
    REPORTS_DELETE: 'reports:delete',
    USERS_READ: 'users:read',
    USERS_CREATE: 'users:create',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    SYSTEM_ADMIN: 'system:admin',
    SYSTEM_CONFIG: 'system:config',
};
exports.PERMISSION_GROUPS = {
    ITEMS_MANAGEMENT: [
        exports.PERMISSIONS.ITEMS_READ,
        exports.PERMISSIONS.ITEMS_CREATE,
        exports.PERMISSIONS.ITEMS_UPDATE,
        exports.PERMISSIONS.ITEMS_DELETE,
    ],
    LOCATIONS_MANAGEMENT: [
        exports.PERMISSIONS.LOCATIONS_READ,
        exports.PERMISSIONS.LOCATIONS_CREATE,
        exports.PERMISSIONS.LOCATIONS_UPDATE,
        exports.PERMISSIONS.LOCATIONS_DELETE,
    ],
    TRANSACTIONS_MANAGEMENT: [
        exports.PERMISSIONS.TRANSACTIONS_READ,
        exports.PERMISSIONS.TRANSACTIONS_CREATE,
        exports.PERMISSIONS.TRANSACTIONS_UPDATE,
        exports.PERMISSIONS.TRANSACTIONS_DELETE,
    ],
    INVENTORY_MANAGEMENT: [
        exports.PERMISSIONS.INVENTORY_READ,
        exports.PERMISSIONS.INVENTORY_UPDATE,
    ],
    REPORTS_MANAGEMENT: [
        exports.PERMISSIONS.REPORTS_READ,
        exports.PERMISSIONS.REPORTS_CREATE,
        exports.PERMISSIONS.REPORTS_UPDATE,
        exports.PERMISSIONS.REPORTS_DELETE,
    ],
    USERS_MANAGEMENT: [
        exports.PERMISSIONS.USERS_READ,
        exports.PERMISSIONS.USERS_CREATE,
        exports.PERMISSIONS.USERS_UPDATE,
        exports.PERMISSIONS.USERS_DELETE,
    ],
    SYSTEM_MANAGEMENT: [
        exports.PERMISSIONS.SYSTEM_ADMIN,
        exports.PERMISSIONS.SYSTEM_CONFIG,
    ],
};
exports.ROLE_PERMISSIONS = {
    admin: [
        ...exports.PERMISSION_GROUPS.ITEMS_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.LOCATIONS_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.INVENTORY_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.REPORTS_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.USERS_MANAGEMENT,
        ...exports.PERMISSION_GROUPS.SYSTEM_MANAGEMENT,
    ],
    employee: [
        exports.PERMISSIONS.ITEMS_READ,
        exports.PERMISSIONS.ITEMS_CREATE,
        exports.PERMISSIONS.ITEMS_UPDATE,
        exports.PERMISSIONS.LOCATIONS_READ,
        exports.PERMISSIONS.TRANSACTIONS_READ,
        exports.PERMISSIONS.TRANSACTIONS_CREATE,
        exports.PERMISSIONS.INVENTORY_READ,
        exports.PERMISSIONS.REPORTS_READ,
    ],
};
exports.PERMISSION_DESCRIPTIONS = {
    [exports.PERMISSIONS.ITEMS_READ]: '查看物品信息',
    [exports.PERMISSIONS.ITEMS_CREATE]: '创建物品',
    [exports.PERMISSIONS.ITEMS_UPDATE]: '编辑物品信息',
    [exports.PERMISSIONS.ITEMS_DELETE]: '删除物品',
    [exports.PERMISSIONS.LOCATIONS_READ]: '查看库房位置',
    [exports.PERMISSIONS.LOCATIONS_CREATE]: '创建库房位置',
    [exports.PERMISSIONS.LOCATIONS_UPDATE]: '编辑库房位置',
    [exports.PERMISSIONS.LOCATIONS_DELETE]: '删除库房位置',
    [exports.PERMISSIONS.TRANSACTIONS_READ]: '查看交易记录',
    [exports.PERMISSIONS.TRANSACTIONS_CREATE]: '创建交易记录',
    [exports.PERMISSIONS.TRANSACTIONS_UPDATE]: '编辑交易记录',
    [exports.PERMISSIONS.TRANSACTIONS_DELETE]: '删除交易记录',
    [exports.PERMISSIONS.INVENTORY_READ]: '查看库存信息',
    [exports.PERMISSIONS.INVENTORY_UPDATE]: '更新库存',
    [exports.PERMISSIONS.REPORTS_READ]: '查看报表',
    [exports.PERMISSIONS.REPORTS_CREATE]: '创建报表',
    [exports.PERMISSIONS.REPORTS_UPDATE]: '编辑报表',
    [exports.PERMISSIONS.REPORTS_DELETE]: '删除报表',
    [exports.PERMISSIONS.USERS_READ]: '查看用户信息',
    [exports.PERMISSIONS.USERS_CREATE]: '创建用户',
    [exports.PERMISSIONS.USERS_UPDATE]: '编辑用户信息',
    [exports.PERMISSIONS.USERS_DELETE]: '删除用户',
    [exports.PERMISSIONS.SYSTEM_ADMIN]: '系统管理',
    [exports.PERMISSIONS.SYSTEM_CONFIG]: '系统配置',
};
exports.ROLE_DESCRIPTIONS = {
    admin: '管理员',
    employee: '员工',
};
function hasPermission(userRole, permission) {
    const rolePermissions = exports.ROLE_PERMISSIONS[userRole];
    return rolePermissions.includes(permission);
}
function getRolePermissions(userRole) {
    return [...exports.ROLE_PERMISSIONS[userRole]];
}
function hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => hasPermission(userRole, permission));
}
function hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => hasPermission(userRole, permission));
}
function getPermissionDescription(permission) {
    return exports.PERMISSION_DESCRIPTIONS[permission] || permission;
}
function getRoleDescription(role) {
    return exports.ROLE_DESCRIPTIONS[role] || role;
}
function isValidPermission(permission) {
    return Object.values(exports.PERMISSIONS).includes(permission);
}
function isValidRole(role) {
    return Object.keys(exports.ROLE_PERMISSIONS).includes(role);
}
//# sourceMappingURL=permissions.js.map