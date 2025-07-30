import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { ItemsPage } from './pages/ItemsPage';
import path from 'path';

test.describe('物品管理功能', () => {
  let helpers: TestHelpers;
  let itemsPage: ItemsPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    itemsPage = new ItemsPage(page);
    
    // 以管理员身份登录
    await helpers.login('admin', 'admin123');
    await itemsPage.goto();
  });

  test('创建新物品', async ({ page }) => {
    const itemData = {
      name: '测试物品A',
      category: '办公用品',
      specification: '规格A',
      unit: '个',
      lowStockThreshold: 10
    };

    await itemsPage.createItem(itemData);
    
    // 验证创建成功
    await helpers.expectNotification('物品创建成功');
    await itemsPage.expectItemInList(itemData.name);
  });

  test('编辑物品信息', async ({ page }) => {
    // 先创建一个物品
    const originalItem = {
      name: '待编辑物品',
      category: '办公用品',
      specification: '原规格',
      unit: '个',
      lowStockThreshold: 5
    };
    
    await itemsPage.createItem(originalItem);
    await helpers.expectNotification('物品创建成功');
    
    // 编辑物品
    const updatedData = {
      name: '已编辑物品',
      specification: '新规格',
      lowStockThreshold: 15
    };
    
    await itemsPage.editItem(originalItem.name, updatedData);
    
    // 验证编辑成功
    await helpers.expectNotification('物品更新成功');
    await itemsPage.expectItemInList(updatedData.name);
    await itemsPage.expectItemNotInList(originalItem.name);
  });

  test('删除物品', async ({ page }) => {
    // 先创建一个物品
    const itemData = {
      name: '待删除物品',
      category: '办公用品',
      specification: '规格',
      unit: '个',
      lowStockThreshold: 5
    };
    
    await itemsPage.createItem(itemData);
    await helpers.expectNotification('物品创建成功');
    
    // 删除物品
    await itemsPage.deleteItem(itemData.name);
    
    // 验证删除成功
    await helpers.expectNotification('物品删除成功');
    await itemsPage.expectItemNotInList(itemData.name);
  });

  test('搜索物品', async ({ page }) => {
    // 创建多个物品
    const items = [
      { name: '搜索测试物品1', category: '办公用品', specification: '规格1', unit: '个', lowStockThreshold: 5 },
      { name: '搜索测试物品2', category: '电子设备', specification: '规格2', unit: '台', lowStockThreshold: 3 },
      { name: '其他物品', category: '办公用品', specification: '规格3', unit: '个', lowStockThreshold: 10 }
    ];
    
    for (const item of items) {
      await itemsPage.createItem(item);
      await helpers.expectNotification('物品创建成功');
    }
    
    // 搜索包含"搜索测试"的物品
    await itemsPage.searchItem('搜索测试');
    
    // 验证搜索结果
    await itemsPage.expectItemInList('搜索测试物品1');
    await itemsPage.expectItemInList('搜索测试物品2');
    await itemsPage.expectItemNotInList('其他物品');
  });

  test('物品表单验证', async ({ page }) => {
    await page.click('[data-testid="add-item-button"]');
    
    // 尝试提交空表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证必填字段错误提示
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入物品名称');
  });

  test('批量导入物品', async ({ page }) => {
    // 创建测试Excel文件
    const testFilePath = path.join(__dirname, 'fixtures', 'test-items.xlsx');
    
    // 注意：在实际测试中，你需要创建一个真实的Excel文件
    // 这里假设文件已存在
    
    await itemsPage.batchImport(testFilePath);
    
    // 验证批量导入结果
    await helpers.expectNotification('批量导入完成');
    
    // 验证导入的物品出现在列表中
    await itemsPage.expectItemInList('批量导入物品1');
    await itemsPage.expectItemInList('批量导入物品2');
  });

  test('物品列表分页功能', async ({ page }) => {
    // 创建足够多的物品以触发分页
    for (let i = 1; i <= 25; i++) {
      await itemsPage.createItem({
        name: `分页测试物品${i}`,
        category: '测试类别',
        specification: `规格${i}`,
        unit: '个',
        lowStockThreshold: 5
      });
    }
    
    // 验证分页控件存在
    await expect(page.locator('.ant-pagination')).toBeVisible();
    
    // 测试翻页
    await page.click('.ant-pagination-next');
    await helpers.waitForTableLoad();
    
    // 验证页面内容已更新
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText('第 2 页');
  });
});