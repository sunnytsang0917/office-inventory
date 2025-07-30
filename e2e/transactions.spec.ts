import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import path from 'path';

test.describe('出入库管理功能', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // 以管理员身份登录
    await helpers.login('admin', 'admin123');
  });

  test.describe('入库操作', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/transactions/inbound');
    });

    test('单个物品入库', async ({ page }) => {
      // 填写入库表单
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品A' });
      await page.selectOption('[data-testid="location-select"]', { label: 'A区1层货架001' });
      await page.fill('[data-testid="quantity-input"]', '50');
      await page.fill('[data-testid="supplier-input"]', '测试供应商');
      await page.fill('[data-testid="operator-input"]', '测试操作员');
      
      // 提交入库
      await page.click('[data-testid="submit-button"]');
      
      // 验证入库成功
      await helpers.expectNotification('入库成功');
      
      // 验证库存更新
      await page.goto('/inventory');
      const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: '测试物品A' });
      await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('50');
    });

    test('批量入库操作', async ({ page }) => {
      // 上传批量入库Excel文件
      const testFilePath = path.join(__dirname, 'fixtures', 'batch-inbound.xlsx');
      
      await page.click('[data-testid="batch-import-button"]');
      await page.setInputFiles('[data-testid="file-upload"]', testFilePath);
      await page.click('[data-testid="upload-button"]');
      
      // 验证批量入库结果
      await helpers.expectNotification('批量入库完成');
      
      // 检查批量入库结果统计
      await expect(page.locator('[data-testid="import-success-count"]')).toContainText('成功: 10');
      await expect(page.locator('[data-testid="import-failed-count"]')).toContainText('失败: 0');
    });

    test('入库表单验证', async ({ page }) => {
      // 尝试提交空表单
      await page.click('[data-testid="submit-button"]');
      
      // 验证必填字段错误提示
      await expect(page.locator('.ant-form-item-explain-error')).toContainText('请选择物品');
    });

    test('入库数量验证', async ({ page }) => {
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品A' });
      await page.selectOption('[data-testid="location-select"]', { label: 'A区1层货架001' });
      
      // 输入负数
      await page.fill('[data-testid="quantity-input"]', '-10');
      await page.click('[data-testid="submit-button"]');
      
      // 验证错误提示
      await expect(page.locator('.ant-form-item-explain-error')).toContainText('数量必须大于0');
    });
  });

  test.describe('出库操作', () => {
    test.beforeEach(async ({ page }) => {
      // 先进行入库操作以确保有库存
      await page.goto('/transactions/inbound');
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品B' });
      await page.selectOption('[data-testid="location-select"]', { label: 'B区1层货架001' });
      await page.fill('[data-testid="quantity-input"]', '100');
      await page.fill('[data-testid="supplier-input"]', '测试供应商');
      await page.fill('[data-testid="operator-input"]', '测试操作员');
      await page.click('[data-testid="submit-button"]');
      await helpers.expectNotification('入库成功');
      
      // 转到出库页面
      await page.goto('/transactions/outbound');
    });

    test('单个物品出库', async ({ page }) => {
      // 填写出库表单
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品B' });
      await page.selectOption('[data-testid="location-select"]', { label: 'B区1层货架001' });
      await page.fill('[data-testid="quantity-input"]', '30');
      await page.fill('[data-testid="recipient-input"]', '测试领用人');
      await page.fill('[data-testid="purpose-input"]', '测试用途');
      await page.fill('[data-testid="operator-input"]', '测试操作员');
      
      // 提交出库
      await page.click('[data-testid="submit-button"]');
      
      // 验证出库成功
      await helpers.expectNotification('出库成功');
      
      // 验证库存更新
      await page.goto('/inventory');
      const inventoryRow = page.locator('[data-testid="inventory-row"]').filter({ hasText: '测试物品B' });
      await expect(inventoryRow.locator('[data-testid="stock-quantity"]')).toContainText('70');
    });

    test('库存不足时出库失败', async ({ page }) => {
      // 尝试出库超过库存的数量
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品B' });
      await page.selectOption('[data-testid="location-select"]', { label: 'B区1层货架001' });
      await page.fill('[data-testid="quantity-input"]', '150'); // 超过库存100
      await page.fill('[data-testid="recipient-input"]', '测试领用人');
      await page.fill('[data-testid="purpose-input"]', '测试用途');
      await page.fill('[data-testid="operator-input"]', '测试操作员');
      
      await page.click('[data-testid="submit-button"]');
      
      // 验证库存不足错误
      await helpers.expectNotification('库存不足', 'error');
    });

    test('批量出库操作', async ({ page }) => {
      // 上传批量出库Excel文件
      const testFilePath = path.join(__dirname, 'fixtures', 'batch-outbound.xlsx');
      
      await page.click('[data-testid="batch-import-button"]');
      await page.setInputFiles('[data-testid="file-upload"]', testFilePath);
      await page.click('[data-testid="upload-button"]');
      
      // 验证批量出库结果
      await helpers.expectNotification('批量出库完成');
    });

    test('实时库存显示', async ({ page }) => {
      // 选择物品和位置
      await page.selectOption('[data-testid="item-select"]', { label: '测试物品B' });
      await page.selectOption('[data-testid="location-select"]', { label: 'B区1层货架001' });
      
      // 验证当前库存显示
      await expect(page.locator('[data-testid="current-stock"]')).toContainText('当前库存: 100');
    });
  });

  test.describe('交易历史记录', () => {
    test('查看交易历史', async ({ page }) => {
      await page.goto('/transactions/history');
      
      // 验证交易历史页面加载
      await expect(page.locator('[data-testid="transaction-history-table"]')).toBeVisible();
      
      // 验证交易记录包含必要信息
      const firstRow = page.locator('[data-testid="transaction-row"]').first();
      await expect(firstRow.locator('[data-testid="item-name"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="transaction-type"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="quantity"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="location"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="date"]')).toBeVisible();
    });

    test('按类型筛选交易记录', async ({ page }) => {
      await page.goto('/transactions/history');
      
      // 筛选入库记录
      await page.selectOption('[data-testid="type-filter"]', 'inbound');
      await page.click('[data-testid="filter-button"]');
      
      // 验证只显示入库记录
      const transactionRows = page.locator('[data-testid="transaction-row"]');
      const count = await transactionRows.count();
      
      for (let i = 0; i < count; i++) {
        await expect(transactionRows.nth(i).locator('[data-testid="transaction-type"]')).toContainText('入库');
      }
    });

    test('按日期范围筛选交易记录', async ({ page }) => {
      await page.goto('/transactions/history');
      
      // 设置日期范围
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');
      await page.click('[data-testid="filter-button"]');
      
      // 验证筛选结果
      await helpers.waitForTableLoad();
      await expect(page.locator('[data-testid="transaction-row"]')).toHaveCount({ min: 1 });
    });

    test('导出交易记录', async ({ page }) => {
      await page.goto('/transactions/history');
      
      // 点击导出按钮
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      const download = await downloadPromise;
      
      // 验证文件下载
      expect(download.suggestedFilename()).toContain('transactions');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });
});