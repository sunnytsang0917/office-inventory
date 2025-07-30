import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 登录系统
   */
  async login(username: string = 'admin', password: string = 'admin123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="username-input"]', username);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // 等待登录成功并跳转到首页
    await this.page.waitForURL('/');
    await expect(this.page.locator('[data-testid="user-info"]')).toBeVisible();
  }

  /**
   * 登出系统
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  /**
   * 等待API请求完成
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(response => 
      typeof urlPattern === 'string' 
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())
    );
  }

  /**
   * 上传文件
   */
  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * 等待表格加载完成
   */
  async waitForTableLoad() {
    await this.page.waitForSelector('[data-testid="data-table"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 检查通知消息
   */
  async expectNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const notification = this.page.locator(`.ant-notification-notice-${type}`);
    await expect(notification).toBeVisible();
    await expect(notification.locator('.ant-notification-notice-message')).toContainText(message);
  }

  /**
   * 关闭所有通知
   */
  async closeNotifications() {
    const closeButtons = this.page.locator('.ant-notification-notice-close');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click();
    }
  }

  /**
   * 等待模态框打开
   */
  async waitForModal() {
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * 关闭模态框
   */
  async closeModal() {
    await this.page.click('.ant-modal-close');
    await this.page.waitForSelector('.ant-modal', { state: 'hidden' });
  }
}