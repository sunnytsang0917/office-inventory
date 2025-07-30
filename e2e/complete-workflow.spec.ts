import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { LoginPage } from './pages/LoginPage';
import { ItemsPage } from './pages/ItemsPage';
import { LocationsPage } from './pages/LocationsPage';

test.describe('完整用户流程测试', () => {
  let helpers: TestHelpers;
  let loginPage: LoginPage;
  let itemsPage: ItemsPage;
  let locationsPage: LocationsPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    loginPage = new LoginPage(page);
    itemsPage = new ItemsPage(page);
    locationsPage = new LocationsPage(page);
  });

  test('完整的库存管理流程', async ({ page }) => {
    // 1. 管理员登录
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await page.waitForURL('/');
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // 2. 创建库房位置
    await locationsPage.goto();
    const locationData = {
      code: 'TEST-A-001',
      name: '测试A区001号位置',
      description: '完整流程测试位置'
    };
    await locationsPage.createLocation(locationData);
    await helpers.expectNotification('位置创建成功');

    // 3. 创建物品
    await itemsPage.goto();
    const itemData = {
      name: '流程测试物品',
      category: '测试类别',
      specification: '测试规格',
      unit: '个',
      lowStockThreshold: 10
    };
    await itemsPage.createItem(itemData);
    await helpers.expectNotification('物品创建成功');

    // 4. 执行入库操作
    await page.goto('/transactions/inbound');
    await page.selectOption('[data-testid="item-select"]', { label: itemData.name });
    await page.selectOption('[data-testid="location-select"]', { label: locationData.name });
    await page.fill('[data-testid="quantity-input"]', '100');
    await page.fill('[data-testid="supplier-input"]', '测试供应商');
    await page.fill('[data-testid="operator-input"]', '测试操作员');
    await page.click('[data-testid="submit-button"]');
    await helpers.expectNotification('入库成功');

    // 5. 验证库存更新
    await page.goto('/inventory');
    const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: itemData.name });
    await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('100');

    // 6. 执行出库操作
    await page.goto('/transactions/outbound');
    await page.selectOption('[data-testid="item-select"]', { label: itemData.name });
    await page.selectOption('[data-testid="location-select"]', { label: locationData.name });
    await page.fill('[data-testid="quantity-input"]', '30');
    await page.fill('[data-testid="recipient-input"]', '测试领用人');
    await page.fill('[data-testid="purpose-input"]', '流程测试用途');
    await page.fill('[data-testid="operator-input"]', '测试操作员');
    await page.click('[data-testid="submit-button"]');
    await helpers.expectNotification('出库成功');

    // 7. 验证库存再次更新
    await page.goto('/inventory');
    const updatedInventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: itemData.name });
    await expect(updatedInventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('70');

    // 8. 查看交易历史
    await page.goto('/transactions/history');
    await expect(page.locator('[data-testid="transaction-row"]').filter({ hasText: itemData.name })).toHaveCount(2);

    // 9. 生成报表
    await page.goto('/reports');
    await page.click('[data-testid="monthly-report-tab"]');
    await page.selectOption('[data-testid="month-select"]', new Date().toISOString().slice(0, 7));
    await page.click('[data-testid="generate-report-button"]');
    await expect(page.locator('[data-testid="monthly-chart"]')).toBeVisible();

    // 10. 登出
    await helpers.logout();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('权限控制完整流程', async ({ page }) => {
    // 1. 普通员工登录
    await loginPage.goto();
    await loginPage.login('employee', 'employee123');
    await page.waitForURL('/');

    // 2. 验证可以访问的页面
    const allowedPages = [
      { url: '/inventory', testId: 'inventory-page' },
      { url: '/transactions/inbound', testId: 'inbound-page' },
      { url: '/transactions/outbound', testId: 'outbound-page' },
      { url: '/transactions/history', testId: 'transaction-history-page' },
      { url: '/reports', testId: 'reports-page' }
    ];

    for (const pageInfo of allowedPages) {
      await page.goto(pageInfo.url);
      await expect(page.locator(`[data-testid="${pageInfo.testId}"]`)).toBeVisible();
    }

    // 3. 验证无法访问的管理员页面
    const restrictedPages = ['/items', '/locations', '/api-test'];

    for (const restrictedUrl of restrictedPages) {
      await page.goto(restrictedUrl);
      await page.waitForURL('/');
      await helpers.expectNotification('权限不足', 'error');
    }

    // 4. 验证可以执行出入库操作
    await page.goto('/transactions/inbound');
    await page.selectOption('[data-testid="item-select"]', { index: 1 });
    await page.selectOption('[data-testid="location-select"]', { index: 1 });
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.fill('[data-testid="supplier-input"]', '员工测试供应商');
    await page.fill('[data-testid="operator-input"]', '员工操作');
    await page.click('[data-testid="submit-button"]');
    await helpers.expectNotification('入库成功');

    // 5. 登出
    await helpers.logout();
  });

  test('批量操作完整流程', async ({ page }) => {
    // 1. 管理员登录
    await helpers.login('admin', 'admin123');

    // 2. 准备测试数据 - 创建位置和物品
    await locationsPage.goto();
    const locations = [
      { code: 'BATCH-A-001', name: '批量测试A区001', description: '批量测试位置1' },
      { code: 'BATCH-A-002', name: '批量测试A区002', description: '批量测试位置2' }
    ];

    for (const location of locations) {
      await locationsPage.createLocation(location);
      await helpers.expectNotification('位置创建成功');
    }

    await itemsPage.goto();
    const items = [
      { name: '批量测试物品1', category: '测试类别', specification: '规格1', unit: '个', lowStockThreshold: 5 },
      { name: '批量测试物品2', category: '测试类别', specification: '规格2', unit: '个', lowStockThreshold: 8 }
    ];

    for (const item of items) {
      await itemsPage.createItem(item);
      await helpers.expectNotification('物品创建成功');
    }

    // 3. 批量入库操作
    await page.goto('/transactions/inbound');
    
    // 模拟批量入库（在实际测试中需要真实的Excel文件）
    for (let i = 0; i < items.length; i++) {
      await page.selectOption('[data-testid="item-select"]', { label: items[i].name });
      await page.selectOption('[data-testid="location-select"]', { label: locations[i].name });
      await page.fill('[data-testid="quantity-input"]', '50');
      await page.fill('[data-testid="supplier-input"]', `批量供应商${i + 1}`);
      await page.fill('[data-testid="operator-input"]', '批量操作员');
      await page.click('[data-testid="submit-button"]');
      await helpers.expectNotification('入库成功');
    }

    // 4. 验证批量入库结果
    await page.goto('/inventory');
    for (const item of items) {
      const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: item.name });
      await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('50');
    }

    // 5. 批量出库操作
    await page.goto('/transactions/outbound');
    
    for (let i = 0; i < items.length; i++) {
      await page.selectOption('[data-testid="item-select"]', { label: items[i].name });
      await page.selectOption('[data-testid="location-select"]', { label: locations[i].name });
      await page.fill('[data-testid="quantity-input"]', '20');
      await page.fill('[data-testid="recipient-input"]', `批量领用人${i + 1}`);
      await page.fill('[data-testid="purpose-input"]', '批量测试用途');
      await page.fill('[data-testid="operator-input"]', '批量操作员');
      await page.click('[data-testid="submit-button"]');
      await helpers.expectNotification('出库成功');
    }

    // 6. 验证批量出库结果
    await page.goto('/inventory');
    for (const item of items) {
      const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: item.name });
      await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('30');
    }

    // 7. 验证交易历史记录
    await page.goto('/transactions/history');
    
    // 应该有4条记录（2次入库 + 2次出库）
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    const batchTransactions = transactionRows.filter({ hasText: '批量测试物品' });
    await expect(batchTransactions).toHaveCount(4);
  });

  test('错误处理和恢复流程', async ({ page }) => {
    // 1. 管理员登录
    await helpers.login('admin', 'admin123');

    // 2. 创建测试数据
    await locationsPage.goto();
    await locationsPage.createLocation({
      code: 'ERROR-TEST-001',
      name: '错误测试位置',
      description: '用于测试错误处理'
    });
    await helpers.expectNotification('位置创建成功');

    await itemsPage.goto();
    await itemsPage.createItem({
      name: '错误测试物品',
      category: '测试类别',
      specification: '测试规格',
      unit: '个',
      lowStockThreshold: 5
    });
    await helpers.expectNotification('物品创建成功');

    // 3. 测试库存不足错误
    await page.goto('/transactions/outbound');
    await page.selectOption('[data-testid="item-select"]', { label: '错误测试物品' });
    await page.selectOption('[data-testid="location-select"]', { label: '错误测试位置' });
    await page.fill('[data-testid="quantity-input"]', '100'); // 库存为0，出库100应该失败
    await page.fill('[data-testid="recipient-input"]', '测试领用人');
    await page.fill('[data-testid="purpose-input"]', '错误测试');
    await page.fill('[data-testid="operator-input"]', '测试操作员');
    await page.click('[data-testid="submit-button"]');
    
    // 验证错误提示
    await helpers.expectNotification('库存不足', 'error');

    // 4. 先入库再出库（正确流程）
    await page.goto('/transactions/inbound');
    await page.selectOption('[data-testid="item-select"]', { label: '错误测试物品' });
    await page.selectOption('[data-testid="location-select"]', { label: '错误测试位置' });
    await page.fill('[data-testid="quantity-input"]', '50');
    await page.fill('[data-testid="supplier-input"]', '测试供应商');
    await page.fill('[data-testid="operator-input"]', '测试操作员');
    await page.click('[data-testid="submit-button"]');
    await helpers.expectNotification('入库成功');

    // 5. 现在出库应该成功
    await page.goto('/transactions/outbound');
    await page.selectOption('[data-testid="item-select"]', { label: '错误测试物品' });
    await page.selectOption('[data-testid="location-select"]', { label: '错误测试位置' });
    await page.fill('[data-testid="quantity-input"]', '30');
    await page.fill('[data-testid="recipient-input"]', '测试领用人');
    await page.fill('[data-testid="purpose-input"]', '错误恢复测试');
    await page.fill('[data-testid="operator-input"]', '测试操作员');
    await page.click('[data-testid="submit-button"]');
    await helpers.expectNotification('出库成功');

    // 6. 验证最终库存
    await page.goto('/inventory');
    const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: '错误测试物品' });
    await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('20');
  });
});