import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionDescription,
  getRoleDescription,
  isValidPermission,
  isValidRole,
} from '../permissions';

describe('权限配置测试', () => {
  describe('权限常量', () => {
    it('应该定义所有必要的权限', () => {
      expect(PERMISSIONS.ITEMS_READ).toBe('items:read');
      expect(PERMISSIONS.ITEMS_CREATE).toBe('items:create');
      expect(PERMISSIONS.ITEMS_UPDATE).toBe('items:update');
      expect(PERMISSIONS.ITEMS_DELETE).toBe('items:delete');
      
      expect(PERMISSIONS.LOCATIONS_READ).toBe('locations:read');
      expect(PERMISSIONS.LOCATIONS_CREATE).toBe('locations:create');
      expect(PERMISSIONS.LOCATIONS_UPDATE).toBe('locations:update');
      expect(PERMISSIONS.LOCATIONS_DELETE).toBe('locations:delete');
      
      expect(PERMISSIONS.TRANSACTIONS_READ).toBe('transactions:read');
      expect(PERMISSIONS.TRANSACTIONS_CREATE).toBe('transactions:create');
      expect(PERMISSIONS.TRANSACTIONS_UPDATE).toBe('transactions:update');
      expect(PERMISSIONS.TRANSACTIONS_DELETE).toBe('transactions:delete');
      
      expect(PERMISSIONS.INVENTORY_READ).toBe('inventory:read');
      expect(PERMISSIONS.INVENTORY_UPDATE).toBe('inventory:update');
      
      expect(PERMISSIONS.REPORTS_READ).toBe('reports:read');
      expect(PERMISSIONS.REPORTS_CREATE).toBe('reports:create');
      expect(PERMISSIONS.REPORTS_UPDATE).toBe('reports:update');
      expect(PERMISSIONS.REPORTS_DELETE).toBe('reports:delete');
      
      expect(PERMISSIONS.USERS_READ).toBe('users:read');
      expect(PERMISSIONS.USERS_CREATE).toBe('users:create');
      expect(PERMISSIONS.USERS_UPDATE).toBe('users:update');
      expect(PERMISSIONS.USERS_DELETE).toBe('users:delete');
      
      expect(PERMISSIONS.SYSTEM_ADMIN).toBe('system:admin');
      expect(PERMISSIONS.SYSTEM_CONFIG).toBe('system:config');
    });
  });

  describe('权限组', () => {
    it('应该正确定义物品管理权限组', () => {
      expect(PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(PERMISSIONS.ITEMS_READ);
      expect(PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(PERMISSIONS.ITEMS_CREATE);
      expect(PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(PERMISSIONS.ITEMS_UPDATE);
      expect(PERMISSION_GROUPS.ITEMS_MANAGEMENT).toContain(PERMISSIONS.ITEMS_DELETE);
    });

    it('应该正确定义库房位置管理权限组', () => {
      expect(PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(PERMISSIONS.LOCATIONS_READ);
      expect(PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(PERMISSIONS.LOCATIONS_CREATE);
      expect(PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(PERMISSIONS.LOCATIONS_UPDATE);
      expect(PERMISSION_GROUPS.LOCATIONS_MANAGEMENT).toContain(PERMISSIONS.LOCATIONS_DELETE);
    });

    it('应该正确定义交易管理权限组', () => {
      expect(PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(PERMISSIONS.TRANSACTIONS_READ);
      expect(PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(PERMISSIONS.TRANSACTIONS_CREATE);
      expect(PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(PERMISSIONS.TRANSACTIONS_UPDATE);
      expect(PERMISSION_GROUPS.TRANSACTIONS_MANAGEMENT).toContain(PERMISSIONS.TRANSACTIONS_DELETE);
    });
  });

  describe('角色权限映射', () => {
    it('管理员应该拥有所有权限', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;
      
      // 检查管理员是否拥有所有基本权限
      expect(adminPermissions).toContain(PERMISSIONS.ITEMS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.ITEMS_CREATE);
      expect(adminPermissions).toContain(PERMISSIONS.ITEMS_UPDATE);
      expect(adminPermissions).toContain(PERMISSIONS.ITEMS_DELETE);
      
      expect(adminPermissions).toContain(PERMISSIONS.LOCATIONS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.LOCATIONS_CREATE);
      expect(adminPermissions).toContain(PERMISSIONS.LOCATIONS_UPDATE);
      expect(adminPermissions).toContain(PERMISSIONS.LOCATIONS_DELETE);
      
      expect(adminPermissions).toContain(PERMISSIONS.USERS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.USERS_CREATE);
      expect(adminPermissions).toContain(PERMISSIONS.USERS_UPDATE);
      expect(adminPermissions).toContain(PERMISSIONS.USERS_DELETE);
      
      expect(adminPermissions).toContain(PERMISSIONS.SYSTEM_ADMIN);
      expect(adminPermissions).toContain(PERMISSIONS.SYSTEM_CONFIG);
    });

    it('员工应该只拥有基本权限', () => {
      const employeePermissions = ROLE_PERMISSIONS.employee;
      
      // 员工应该有的权限
      expect(employeePermissions).toContain(PERMISSIONS.ITEMS_READ);
      expect(employeePermissions).toContain(PERMISSIONS.ITEMS_CREATE);
      expect(employeePermissions).toContain(PERMISSIONS.ITEMS_UPDATE);
      expect(employeePermissions).toContain(PERMISSIONS.LOCATIONS_READ);
      expect(employeePermissions).toContain(PERMISSIONS.TRANSACTIONS_READ);
      expect(employeePermissions).toContain(PERMISSIONS.TRANSACTIONS_CREATE);
      expect(employeePermissions).toContain(PERMISSIONS.INVENTORY_READ);
      expect(employeePermissions).toContain(PERMISSIONS.REPORTS_READ);
      
      // 员工不应该有的权限
      expect(employeePermissions).not.toContain(PERMISSIONS.ITEMS_DELETE);
      expect(employeePermissions).not.toContain(PERMISSIONS.LOCATIONS_CREATE);
      expect(employeePermissions).not.toContain(PERMISSIONS.LOCATIONS_UPDATE);
      expect(employeePermissions).not.toContain(PERMISSIONS.LOCATIONS_DELETE);
      expect(employeePermissions).not.toContain(PERMISSIONS.TRANSACTIONS_UPDATE);
      expect(employeePermissions).not.toContain(PERMISSIONS.TRANSACTIONS_DELETE);
      expect(employeePermissions).not.toContain(PERMISSIONS.USERS_READ);
      expect(employeePermissions).not.toContain(PERMISSIONS.USERS_CREATE);
      expect(employeePermissions).not.toContain(PERMISSIONS.SYSTEM_ADMIN);
    });
  });

  describe('权限检查函数', () => {
    describe('hasPermission', () => {
      it('应该正确检查管理员权限', () => {
        expect(hasPermission('admin', PERMISSIONS.ITEMS_READ)).toBe(true);
        expect(hasPermission('admin', PERMISSIONS.ITEMS_DELETE)).toBe(true);
        expect(hasPermission('admin', PERMISSIONS.USERS_CREATE)).toBe(true);
        expect(hasPermission('admin', PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
      });

      it('应该正确检查员工权限', () => {
        expect(hasPermission('employee', PERMISSIONS.ITEMS_READ)).toBe(true);
        expect(hasPermission('employee', PERMISSIONS.ITEMS_CREATE)).toBe(true);
        expect(hasPermission('employee', PERMISSIONS.ITEMS_DELETE)).toBe(false);
        expect(hasPermission('employee', PERMISSIONS.USERS_CREATE)).toBe(false);
        expect(hasPermission('employee', PERMISSIONS.SYSTEM_ADMIN)).toBe(false);
      });
    });

    describe('getRolePermissions', () => {
      it('应该返回管理员的所有权限', () => {
        const adminPermissions = getRolePermissions('admin');
        expect(adminPermissions).toContain(PERMISSIONS.ITEMS_READ);
        expect(adminPermissions).toContain(PERMISSIONS.USERS_CREATE);
        expect(adminPermissions).toContain(PERMISSIONS.SYSTEM_ADMIN);
      });

      it('应该返回员工的权限', () => {
        const employeePermissions = getRolePermissions('employee');
        expect(employeePermissions).toContain(PERMISSIONS.ITEMS_READ);
        expect(employeePermissions).not.toContain(PERMISSIONS.ITEMS_DELETE);
        expect(employeePermissions).not.toContain(PERMISSIONS.USERS_CREATE);
      });
    });

    describe('hasAllPermissions', () => {
      it('管理员应该拥有所有权限', () => {
        const permissions = [PERMISSIONS.ITEMS_READ, PERMISSIONS.ITEMS_DELETE, PERMISSIONS.USERS_CREATE];
        expect(hasAllPermissions('admin', permissions)).toBe(true);
      });

      it('员工不应该拥有所有权限', () => {
        const permissions = [PERMISSIONS.ITEMS_READ, PERMISSIONS.ITEMS_DELETE, PERMISSIONS.USERS_CREATE];
        expect(hasAllPermissions('employee', permissions)).toBe(false);
      });

      it('员工应该拥有基本权限', () => {
        const permissions = [PERMISSIONS.ITEMS_READ, PERMISSIONS.ITEMS_CREATE, PERMISSIONS.TRANSACTIONS_READ];
        expect(hasAllPermissions('employee', permissions)).toBe(true);
      });
    });

    describe('hasAnyPermission', () => {
      it('管理员应该拥有任一权限', () => {
        const permissions = [PERMISSIONS.ITEMS_DELETE, PERMISSIONS.USERS_CREATE];
        expect(hasAnyPermission('admin', permissions)).toBe(true);
      });

      it('员工应该拥有部分权限', () => {
        const permissions = [PERMISSIONS.ITEMS_READ, PERMISSIONS.USERS_CREATE];
        expect(hasAnyPermission('employee', permissions)).toBe(true);
      });

      it('员工不应该拥有管理权限', () => {
        const permissions = [PERMISSIONS.ITEMS_DELETE, PERMISSIONS.USERS_CREATE, PERMISSIONS.SYSTEM_ADMIN];
        expect(hasAnyPermission('employee', permissions)).toBe(false);
      });
    });
  });

  describe('描述函数', () => {
    describe('getPermissionDescription', () => {
      it('应该返回权限的中文描述', () => {
        expect(getPermissionDescription(PERMISSIONS.ITEMS_READ)).toBe('查看物品信息');
        expect(getPermissionDescription(PERMISSIONS.ITEMS_CREATE)).toBe('创建物品');
        expect(getPermissionDescription(PERMISSIONS.USERS_DELETE)).toBe('删除用户');
        expect(getPermissionDescription(PERMISSIONS.SYSTEM_ADMIN)).toBe('系统管理');
      });

      it('应该返回未知权限的原始名称', () => {
        expect(getPermissionDescription('unknown:permission')).toBe('unknown:permission');
      });
    });

    describe('getRoleDescription', () => {
      it('应该返回角色的中文描述', () => {
        expect(getRoleDescription('admin')).toBe('管理员');
        expect(getRoleDescription('employee')).toBe('员工');
      });

      it('应该返回未知角色的原始名称', () => {
        expect(getRoleDescription('unknown')).toBe('unknown');
      });
    });
  });

  describe('验证函数', () => {
    describe('isValidPermission', () => {
      it('应该验证有效权限', () => {
        expect(isValidPermission(PERMISSIONS.ITEMS_READ)).toBe(true);
        expect(isValidPermission(PERMISSIONS.USERS_CREATE)).toBe(true);
        expect(isValidPermission(PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
      });

      it('应该拒绝无效权限', () => {
        expect(isValidPermission('invalid:permission')).toBe(false);
        expect(isValidPermission('')).toBe(false);
        expect(isValidPermission('items')).toBe(false);
      });
    });

    describe('isValidRole', () => {
      it('应该验证有效角色', () => {
        expect(isValidRole('admin')).toBe(true);
        expect(isValidRole('employee')).toBe(true);
      });

      it('应该拒绝无效角色', () => {
        expect(isValidRole('manager')).toBe(false);
        expect(isValidRole('guest')).toBe(false);
        expect(isValidRole('')).toBe(false);
      });
    });
  });
});