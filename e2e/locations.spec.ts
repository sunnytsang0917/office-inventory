import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { LocationsPage } from './pages/LocationsPage';

test.describe('库房位置管理功能', () => {
  let helpers: TestHelpers;
  let locationsPage: LocationsPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    locationsPage = new LocationsPage(page);
    
    // 以管理员身份登录
    await helpers.login('admin', 'admin123');
    await locationsPage.goto();
  });

  test('创建新库房位置', async ({ page }) => {
    const locationData = {
      code: 'A-01-001',
      name: 'A区1层货架001',
      description: '测试库房位置'
    };

    await locationsPage.createLocation(locationData);
    
    // 验证创建成功
    await helpers.expectNotification('位置创建成功');
    await locationsPage.expectLocationInList(locationData.code);
  });

  test('编辑库房位置', async ({ page }) => {
    // 先创建一个位置
    const originalLocation = {
      code: 'B-01-001',
      name: 'B区1层货架001',
      description: '原始描述'
    };
    
    await locationsPage.createLocation(originalLocation);
    await helpers.expectNotification('位置创建成功');
    
    // 编辑位置
    const updatedData = {
      name: 'B区1层货架001-已更新',
      description: '更新后的描述'
    };
    
    await locationsPage.editLocation(originalLocation.code, updatedData);
    
    // 验证编辑成功
    await helpers.expectNotification('位置更新成功');
    
    // 验证更新后的信息显示正确
    const row = page.locator(`[data-testid="location-row"]:has-text("${originalLocation.code}")`);
    await expect(row).toContainText(updatedData.name);
  });

  test('删除库房位置', async ({ page }) => {
    // 先创建一个位置
    const locationData = {
      code: 'C-01-001',
      name: 'C区1层货架001',
      description: '待删除位置'
    };
    
    await locationsPage.createLocation(locationData);
    await helpers.expectNotification('位置创建成功');
    
    // 删除位置
    await locationsPage.deleteLocation(locationData.code);
    
    // 验证删除成功
    await helpers.expectNotification('位置删除成功');
    await locationsPage.expectLocationNotInList(locationData.code);
  });

  test('创建层级结构位置', async ({ page }) => {
    // 先创建父级位置
    const parentLocation = {
      code: 'D-AREA',
      name: 'D区域',
      description: '父级区域'
    };
    
    await locationsPage.createLocation(parentLocation);
    await helpers.expectNotification('位置创建成功');
    
    // 创建子级位置
    const childLocation = {
      code: 'D-01',
      name: 'D区1层',
      description: '子级位置',
      parentId: 'D-AREA' // 假设这是父级位置的ID
    };
    
    await locationsPage.createLocation(childLocation);
    
    // 验证层级结构显示正确
    await helpers.expectNotification('位置创建成功');
    await locationsPage.expectLocationInList(childLocation.code);
    
    // 验证层级关系在界面上正确显示
    const childRow = page.locator(`[data-testid="location-row"]:has-text("${childLocation.code}")`);
    await expect(childRow.locator('[data-testid="parent-location"]')).toContainText(parentLocation.name);
  });

  test('位置表单验证', async ({ page }) => {
    await page.click('[data-testid="add-location-button"]');
    
    // 尝试提交空表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证必填字段错误提示
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入位置编码');
  });

  test('位置编码唯一性验证', async ({ page }) => {
    // 创建第一个位置
    const locationData = {
      code: 'UNIQUE-001',
      name: '唯一性测试位置1',
      description: '测试位置'
    };
    
    await locationsPage.createLocation(locationData);
    await helpers.expectNotification('位置创建成功');
    
    // 尝试创建相同编码的位置
    const duplicateLocation = {
      code: 'UNIQUE-001', // 相同的编码
      name: '唯一性测试位置2',
      description: '重复编码测试'
    };
    
    await locationsPage.createLocation(duplicateLocation);
    
    // 验证错误提示
    await helpers.expectNotification('位置编码已存在', 'error');
  });

  test('查看位置库存信息', async ({ page }) => {
    // 先创建一个位置
    const locationData = {
      code: 'STOCK-001',
      name: '库存测试位置',
      description: '用于测试库存显示'
    };
    
    await locationsPage.createLocation(locationData);
    await helpers.expectNotification('位置创建成功');
    
    // 点击查看库存按钮
    const row = page.locator(`[data-testid="location-row"]:has-text("${locationData.code}")`);
    await row.locator('[data-testid="view-inventory-button"]').click();
    
    // 验证库存模态框打开
    await helpers.waitForModal();
    await expect(page.locator('[data-testid="location-inventory-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText(locationData.name);
  });

  test('位置搜索功能', async ({ page }) => {
    // 创建多个位置
    const locations = [
      { code: 'SEARCH-A-001', name: '搜索测试A区001', description: '搜索测试' },
      { code: 'SEARCH-A-002', name: '搜索测试A区002', description: '搜索测试' },
      { code: 'OTHER-B-001', name: '其他B区001', description: '其他测试' }
    ];
    
    for (const location of locations) {
      await locationsPage.createLocation(location);
      await helpers.expectNotification('位置创建成功');
    }
    
    // 搜索包含"SEARCH-A"的位置
    await page.fill('[data-testid="search-input"]', 'SEARCH-A');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // 验证搜索结果
    await locationsPage.expectLocationInList('SEARCH-A-001');
    await locationsPage.expectLocationInList('SEARCH-A-002');
    await locationsPage.expectLocationNotInList('OTHER-B-001');
  });
});