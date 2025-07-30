import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { LoginPage } from './pages/LoginPage';

test.describe('用户认证和权限控制', () => {
  let helpers: TestHelpers;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    loginPage = new LoginPage(page);
  });

  test('管理员用户登录成功', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    // 验证登录成功
    await page.waitForURL('/');
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText('管理员');
  });

  test('普通员工登录成功', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('employee', 'employee123');
    
    // 验证登录成功
    await page.waitForURL('/');
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText('员工');
  });

  test('错误的用户名或密码登录失败', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('wronguser', 'wrongpass');
    
    // 验证登录失败
    await helpers.expectNotification('用户名或密码错误', 'error');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('管理员可以访问所有页面', async ({ page }) => {
    await helpers.login('admin', 'admin123');
    
    // 测试访问管理员专用页面
    await page.goto('/items');
    await expect(page.locator('[data-testid="items-page"]')).toBeVisible();
    
    await page.goto('/locations');
    await expect(page.locator('[data-testid="locations-page"]')).toBeVisible();
    
    await page.goto('/api-test');
    await expect(page.locator('[data-testid="api-test-page"]')).toBeVisible();
  });

  test('普通员工无法访问管理员页面', async ({ page }) => {
    await helpers.login('employee', 'employee123');
    
    // 尝试访问管理员页面应该被重定向
    await page.goto('/items');
    await page.waitForURL('/');
    await helpers.expectNotification('权限不足', 'error');
    
    await page.goto('/locations');
    await page.waitForURL('/');
    await helpers.expectNotification('权限不足', 'error');
  });

  test('普通员工可以访问库存查询和出入库页面', async ({ page }) => {
    await helpers.login('employee', 'employee123');
    
    await page.goto('/inventory');
    await expect(page.locator('[data-testid="inventory-page"]')).toBeVisible();
    
    await page.goto('/transactions/inbound');
    await expect(page.locator('[data-testid="inbound-page"]')).toBeVisible();
    
    await page.goto('/transactions/outbound');
    await expect(page.locator('[data-testid="outbound-page"]')).toBeVisible();
    
    await page.goto('/reports');
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
  });

  test('未登录用户访问受保护页面被重定向到登录页', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForURL('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('用户登出功能', async ({ page }) => {
    await helpers.login('admin', 'admin123');
    
    // 执行登出
    await helpers.logout();
    
    // 验证已登出
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // 尝试访问受保护页面应该被重定向
    await page.goto('/inventory');
    await page.waitForURL('/login');
  });
});