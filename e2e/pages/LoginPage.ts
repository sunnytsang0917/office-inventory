import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-testid="username-input"]', username);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('.ant-form-item-explain-error')).toContainText(message);
  }

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();
  }
}