"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const permissions_1 = require("../permissions");
(0, vitest_1.describe)('权限配置测试', () => {
    (0, vitest_1.describe)('权限常量', () => {
        (0, vitest_1.it)('应该定义所有必要的权限', () => {
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.ITEMS_READ).toBe('items:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.ITEMS_CREATE).toBe('items:create');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.ITEMS_UPDATE).toBe('items:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.ITEMS_DELETE).toBe('items:delete');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.LOCATIONS_READ).toBe('locations:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.LOCATIONS_CREATE).toBe('locations:create');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.LOCATIONS_UPDATE).toBe('locations:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.LOCATIONS_DELETE).toBe('locations:delete');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.TRANSACTIONS_READ).toBe('transactions:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.TRANSACTIONS_CREATE).toBe('transactions:create');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.TRANSACTIONS_UPDATE).toBe('transactions:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.TRANSACTIONS_DELETE).toBe('transactions:delete');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.INVENTORY_READ).toBe('inventory:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.INVENTORY_UPDATE).toBe('inventory:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.REPORTS_READ).toBe('reports:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.REPORTS_CREATE).toBe('reports:create');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.REPORTS_UPDATE).toBe('reports:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.REPORTS_DELETE).toBe('reports:delete');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.USERS_READ).toBe('users:read');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.USERS_CREATE).toBe('users:create');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.USERS_UPDATE).toBe('users:update');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.USERS_DELETE).toBe('users:delete');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.SYSTEM_ADMIN).toBe('system:admin');
            (0, vitest_1.expect)(permissions_1.PERMISSIONS.SYSTEM_CONFIG).toBe('system:config');
        });
    });
    (0, vitest_1.describe)('权限组', () => {
        (0, vitest_1.it)('应该正确定义物品管理权限组', () => {
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.ITEMS_READ);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.ITEMS_CREATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.ITEMS_UPDATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.ITEMS_DELETE);
        });
        (0, vitest_1.it)('应该正确定义库房位置管理权限组', () => {
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.LOCATIONS_READ);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.LOCATIONS_CREATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.LOCATIONS_UPDATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.LOCATIONS_DELETE);
        });
        (0, vitest_1.it)('应该正确定义交易管理权限组', () => {
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_READ);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_CREATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_UPDATE);
            (0, vitest_1.expect)(permissions_1.PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_DELETE);
        });
    });
    (0, vitest_1.describe)('角色权限映射', () => {
        (0, vitest_1.it)('管理员应该拥有所有权限', () => {
            const adminPermissions = permissions_1.ROLE_PERMISSIONS.admin;
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.ITEMS_READ);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.ITEMS_CREATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.ITEMS_UPDATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.ITEMS_DELETE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.LOCATIONS_READ);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.LOCATIONS_CREATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.LOCATIONS_UPDATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.LOCATIONS_DELETE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.USERS_READ);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.USERS_CREATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.USERS_UPDATE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.USERS_DELETE);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.SYSTEM_ADMIN);
            (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.SYSTEM_CONFIG);
        });
        (0, vitest_1.it)('员工应该只拥有基本权限', () => {
            const employeePermissions = permissions_1.ROLE_PERMISSIONS.employee;
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.ITEMS_READ);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.ITEMS_CREATE);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.ITEMS_UPDATE);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.LOCATIONS_READ);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_READ);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.TRANSACTIONS_CREATE);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.INVENTORY_READ);
            (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.REPORTS_READ);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.ITEMS_DELETE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.LOCATIONS_CREATE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.LOCATIONS_UPDATE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.LOCATIONS_DELETE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.TRANSACTIONS_UPDATE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.TRANSACTIONS_DELETE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.USERS_READ);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.USERS_CREATE);
            (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.SYSTEM_ADMIN);
        });
    });
    (0, vitest_1.describe)('权限检查函数', () => {
        (0, vitest_1.describe)('hasPermission', () => {
            (0, vitest_1.it)('应该正确检查管理员权限', () => {
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', permissions_1.PERMISSIONS.ITEMS_READ)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', permissions_1.PERMISSIONS.ITEMS_DELETE)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', permissions_1.PERMISSIONS.USERS_CREATE)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', permissions_1.PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
            });
            (0, vitest_1.it)('应该正确检查员工权限', () => {
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('employee', permissions_1.PERMISSIONS.ITEMS_READ)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('employee', permissions_1.PERMISSIONS.ITEMS_CREATE)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('employee', permissions_1.PERMISSIONS.ITEMS_DELETE)).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('employee', permissions_1.PERMISSIONS.USERS_CREATE)).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.hasPermission)('employee', permissions_1.PERMISSIONS.SYSTEM_ADMIN)).toBe(false);
            });
        });
        (0, vitest_1.describe)('getRolePermissions', () => {
            (0, vitest_1.it)('应该返回管理员的所有权限', () => {
                const adminPermissions = (0, permissions_1.getRolePermissions)('admin');
                (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.ITEMS_READ);
                (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.USERS_CREATE);
                (0, vitest_1.expect)(adminPermissions).toContain(permissions_1.PERMISSIONS.SYSTEM_ADMIN);
            });
            (0, vitest_1.it)('应该返回员工的权限', () => {
                const employeePermissions = (0, permissions_1.getRolePermissions)('employee');
                (0, vitest_1.expect)(employeePermissions).toContain(permissions_1.PERMISSIONS.ITEMS_READ);
                (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.ITEMS_DELETE);
                (0, vitest_1.expect)(employeePermissions).not.toContain(permissions_1.PERMISSIONS.USERS_CREATE);
            });
        });
        (0, vitest_1.describe)('hasAllPermissions', () => {
            (0, vitest_1.it)('管理员应该拥有所有权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_READ, permissions_1.PERMISSIONS.ITEMS_DELETE, permissions_1.PERMISSIONS.USERS_CREATE];
                (0, vitest_1.expect)((0, permissions_1.hasAllPermissions)('admin', permissions)).toBe(true);
            });
            (0, vitest_1.it)('员工不应该拥有所有权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_READ, permissions_1.PERMISSIONS.ITEMS_DELETE, permissions_1.PERMISSIONS.USERS_CREATE];
                (0, vitest_1.expect)((0, permissions_1.hasAllPermissions)('employee', permissions)).toBe(false);
            });
            (0, vitest_1.it)('员工应该拥有基本权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_READ, permissions_1.PERMISSIONS.ITEMS_CREATE, permissions_1.PERMISSIONS.TRANSACTIONS_READ];
                (0, vitest_1.expect)((0, permissions_1.hasAllPermissions)('employee', permissions)).toBe(true);
            });
        });
        (0, vitest_1.describe)('hasAnyPermission', () => {
            (0, vitest_1.it)('管理员应该拥有任一权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_DELETE, permissions_1.PERMISSIONS.USERS_CREATE];
                (0, vitest_1.expect)((0, permissions_1.hasAnyPermission)('admin', permissions)).toBe(true);
            });
            (0, vitest_1.it)('员工应该拥有部分权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_READ, permissions_1.PERMISSIONS.USERS_CREATE];
                (0, vitest_1.expect)((0, permissions_1.hasAnyPermission)('employee', permissions)).toBe(true);
            });
            (0, vitest_1.it)('员工不应该拥有管理权限', () => {
                const permissions = [permissions_1.PERMISSIONS.ITEMS_DELETE, permissions_1.PERMISSIONS.USERS_CREATE, permissions_1.PERMISSIONS.SYSTEM_ADMIN];
                (0, vitest_1.expect)((0, permissions_1.hasAnyPermission)('employee', permissions)).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('描述函数', () => {
        (0, vitest_1.describe)('getPermissionDescription', () => {
            (0, vitest_1.it)('应该返回权限的中文描述', () => {
                (0, vitest_1.expect)((0, permissions_1.getPermissionDescription)(permissions_1.PERMISSIONS.ITEMS_READ)).toBe('查看物品信息');
                (0, vitest_1.expect)((0, permissions_1.getPermissionDescription)(permissions_1.PERMISSIONS.ITEMS_CREATE)).toBe('创建物品');
                (0, vitest_1.expect)((0, permissions_1.getPermissionDescription)(permissions_1.PERMISSIONS.USERS_DELETE)).toBe('删除用户');
                (0, vitest_1.expect)((0, permissions_1.getPermissionDescription)(permissions_1.PERMISSIONS.SYSTEM_ADMIN)).toBe('系统管理');
            });
            (0, vitest_1.it)('应该返回未知权限的原始名称', () => {
                (0, vitest_1.expect)((0, permissions_1.getPermissionDescription)('unknown:permission')).toBe('unknown:permission');
            });
        });
        (0, vitest_1.describe)('getRoleDescription', () => {
            (0, vitest_1.it)('应该返回角色的中文描述', () => {
                (0, vitest_1.expect)((0, permissions_1.getRoleDescription)('admin')).toBe('管理员');
                (0, vitest_1.expect)((0, permissions_1.getRoleDescription)('employee')).toBe('员工');
            });
            (0, vitest_1.it)('应该返回未知角色的原始名称', () => {
                (0, vitest_1.expect)((0, permissions_1.getRoleDescription)('unknown')).toBe('unknown');
            });
        });
    });
    (0, vitest_1.describe)('验证函数', () => {
        (0, vitest_1.describe)('isValidPermission', () => {
            (0, vitest_1.it)('应该验证有效权限', () => {
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)(permissions_1.PERMISSIONS.ITEMS_READ)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)(permissions_1.PERMISSIONS.USERS_CREATE)).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)(permissions_1.PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
            });
            (0, vitest_1.it)('应该拒绝无效权限', () => {
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)('invalid:permission')).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)('')).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.isValidPermission)('items')).toBe(false);
            });
        });
        (0, vitest_1.describe)('isValidRole', () => {
            (0, vitest_1.it)('应该验证有效角色', () => {
                (0, vitest_1.expect)((0, permissions_1.isValidRole)('admin')).toBe(true);
                (0, vitest_1.expect)((0, permissions_1.isValidRole)('employee')).toBe(true);
            });
            (0, vitest_1.it)('应该拒绝无效角色', () => {
                (0, vitest_1.expect)((0, permissions_1.isValidRole)('manager')).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.isValidRole)('guest')).toBe(false);
                (0, vitest_1.expect)((0, permissions_1.isValidRole)('')).toBe(false);
            });
        });
    });
});
//# sourceMappingURL=permissions.test.js.map