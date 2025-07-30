import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('库存查询和报表功能', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // 以管理员身份登录
    await helpers.login('admin', 'admin123');
  });

  test.describe('库存查询功能', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/inventory');
    });

    test('查看库存总览', async ({ page }) => {
      // 验证库存页面加载
      await expect(page.locator('[data-testid="inventory-overview"]')).toBeVisible();
      
      // 验证库存表格显示
      await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible();
      
      // 验证表格列标题
      await expect(page.locator('[data-testid="column-item-name"]')).toContainText('物品名称');
      await expect(page.locator('[data-testid="column-location"]')).toContainText('库房位置');
      await expect(page.locator('[data-testid="column-quantity"]')).toContainText('库存数量');
      await expect(page.locator('[data-testid="column-last-updated"]')).toContainText('最后更新');
    });

    test('按物品名称搜索库存', async ({ page }) => {
      // 输入搜索关键词
      await page.fill('[data-testid="search-input"]', '测试物品');
      await page.click('[data-testid="search-button"]');
      
      // 验证搜索结果
      await helpers.waitForTableLoad();
      const inventoryRows = page.locator('[data-testid="inventory-row"]');
      const count = await inventoryRows.count();
      
      // 验证所有结果都包含搜索关键词
      for (let i = 0; i < count; i++) {
        await expect(inventoryRows.nth(i).locator('[data-testid="item-name"]')).toContainText('测试物品');
      }
    });

    test('按库房位置筛选库存', async ({ page }) => {
      // 选择位置筛选
      await page.selectOption('[data-testid="location-filter"]', { label: 'A区1层货架001' });
      await page.click('[data-testid="filter-button"]');
      
      // 验证筛选结果
      await helpers.waitForTableLoad();
      const inventoryRows = page.locator('[data-testid="inventory-row"]');
      const count = await inventoryRows.count();
      
      // 验证所有结果都是指定位置的库存
      for (let i = 0; i < count; i++) {
        await expect(inventoryRows.nth(i).locator('[data-testid="location-name"]')).toContainText('A区1层货架001');
      }
    });

    test('查看低库存预警', async ({ page }) => {
      // 点击低库存预警标签
      await page.click('[data-testid="low-stock-tab"]');
      
      // 验证低库存列表显示
      await expect(page.locator('[data-testid="low-stock-table"]')).toBeVisible();
      
      // 验证低库存物品标记
      const lowStockRows = page.locator('[data-testid="low-stock-row"]');
      const count = await lowStockRows.count();
      
      if (count > 0) {
        // 验证低库存标记显示
        await expect(lowStockRows.first().locator('[data-testid="low-stock-badge"]')).toBeVisible();
      }
    });

    test('查看物品库存详情', async ({ page }) => {
      // 点击第一个物品的详情按钮
      const firstRow = page.locator('[data-testid="inventory-row"]').first();
      await firstRow.locator('[data-testid="view-details-button"]').click();
      
      // 验证详情模态框打开
      await helpers.waitForModal();
      await expect(page.locator('[data-testid="inventory-detail-modal"]')).toBeVisible();
      
      // 验证详情内容
      await expect(page.locator('[data-testid="item-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-distribution"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
    });

    test('按位置汇总库存', async ({ page }) => {
      // 切换到位置汇总视图
      await page.click('[data-testid="location-summary-tab"]');
      
      // 验证位置汇总表格
      await expect(page.locator('[data-testid="location-summary-table"]')).toBeVisible();
      
      // 验证汇总信息
      const summaryRows = page.locator('[data-testid="location-summary-row"]');
      const firstRow = summaryRows.first();
      
      await expect(firstRow.locator('[data-testid="location-name"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="total-items"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="total-quantity"]')).toBeVisible();
    });
  });

  test.describe('报表统计功能', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reports');
    });

    test('查看月度统计报表', async ({ page }) => {
      // 验证报表页面加载
      await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
      
      // 选择月度统计
      await page.click('[data-testid="monthly-report-tab"]');
      
      // 选择统计月份
      await page.selectOption('[data-testid="month-select"]', '2024-01');
      await page.click('[data-testid="generate-report-button"]');
      
      // 验证统计图表显示
      await expect(page.locator('[data-testid="monthly-chart"]')).toBeVisible();
      
      // 验证统计数据
      await expect(page.locator('[data-testid="inbound-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="outbound-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-change"]')).toBeVisible();
    });

    test('查看物品使用排行', async ({ page }) => {
      // 切换到使用排行标签
      await page.click('[data-testid="usage-ranking-tab"]');
      
      // 设置时间范围
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');
      await page.click('[data-testid="generate-ranking-button"]');
      
      // 验证排行榜显示
      await expect(page.locator('[data-testid="usage-ranking-table"]')).toBeVisible();
      
      // 验证排行数据
      const rankingRows = page.locator('[data-testid="ranking-row"]');
      const firstRow = rankingRows.first();
      
      await expect(firstRow.locator('[data-testid="rank-number"]')).toContainText('1');
      await expect(firstRow.locator('[data-testid="item-name"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="usage-count"]')).toBeVisible();
    });

    test('自定义时间范围统计', async ({ page }) => {
      // 切换到自定义统计标签
      await page.click('[data-testid="custom-report-tab"]');
      
      // 设置自定义时间范围
      await page.fill('[data-testid="custom-start-date"]', '2024-06-01');
      await page.fill('[data-testid="custom-end-date"]', '2024-06-30');
      
      // 选择统计类型
      await page.check('[data-testid="include-inbound"]');
      await page.check('[data-testid="include-outbound"]');
      await page.check('[data-testid="include-inventory"]');
      
      // 生成报表
      await page.click('[data-testid="generate-custom-report-button"]');
      
      // 验证自定义报表显示
      await expect(page.locator('[data-testid="custom-report-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="custom-report-summary"]')).toBeVisible();
    });

    test('导出报表为CSV', async ({ page }) => {
      // 生成月度报表
      await page.click('[data-testid="monthly-report-tab"]');
      await page.selectOption('[data-testid="month-select"]', '2024-01');
      await page.click('[data-testid="generate-report-button"]');
      
      // 等待报表生成完成
      await expect(page.locator('[data-testid="monthly-chart"]')).toBeVisible();
      
      // 导出报表
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-button"]');
      const download = await downloadPromise;
      
      // 验证文件下载
      expect(download.suggestedFilename()).toContain('monthly-report');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('导出报表为Excel', async ({ page }) => {
      // 生成使用排行报表
      await page.click('[data-testid="usage-ranking-tab"]');
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');
      await page.click('[data-testid="generate-ranking-button"]');
      
      // 等待报表生成完成
      await expect(page.locator('[data-testid="usage-ranking-table"]')).toBeVisible();
      
      // 导出Excel
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel-button"]');
      const download = await downloadPromise;
      
      // 验证文件下载
      expect(download.suggestedFilename()).toContain('usage-ranking');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('报表数据刷新', async ({ page }) => {
      // 生成初始报表
      await page.click('[data-testid="monthly-report-tab"]');
      await page.selectOption('[data-testid="month-select"]', '2024-01');
      await page.click('[data-testid="generate-report-button"]');
      
      // 记录初始数据
      const initialInbound = await page.locator('[data-testid="inbound-total"]').textContent();
      
      // 刷新报表数据
      await page.click('[data-testid="refresh-report-button"]');
      
      // 验证数据已刷新（可能相同，但请求已发送）
      await helpers.waitForApiResponse('/api/reports/monthly');
      await expect(page.locator('[data-testid="inbound-total"]')).toBeVisible();
    });
  });

  test.describe('库存分析功能', () => {
    test('库存趋势分析', async ({ page }) => {
      await page.goto('/inventory');
      
      // 点击趋势分析按钮
      await page.click('[data-testid="trend-analysis-button"]');
      
      // 验证趋势分析模态框
      await helpers.waitForModal();
      await expect(page.locator('[data-testid="trend-analysis-modal"]')).toBeVisible();
      
      // 验证趋势图表
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // 验证时间范围选择器
      await expect(page.locator('[data-testid="trend-period-select"]')).toBeVisible();
    });

    test('库存预警设置', async ({ page }) => {
      await page.goto('/inventory');
      
      // 点击预警设置按钮
      await page.click('[data-testid="alert-settings-button"]');
      
      // 验证预警设置模态框
      await helpers.waitForModal();
      await expect(page.locator('[data-testid="alert-settings-modal"]')).toBeVisible();
      
      // 修改预警阈值
      await page.fill('[data-testid="global-threshold-input"]', '20');
      await page.click('[data-testid="save-settings-button"]');
      
      // 验证设置保存成功
      await helpers.expectNotification('预警设置已保存');
    });
  });
});