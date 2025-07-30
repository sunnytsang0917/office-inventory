import { Page, expect } from '@playwright/test';

export class ItemsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/items');
  }

  async createItem(itemData: {
    name: string;
    category: string;
    specification: string;
    unit: string;
    lowStockThreshold: number;
  }) {
    // 点击添加物品按钮
    await this.page.click('[data-testid="add-item-button"]');
    
    // 填写表单
    await this.page.fill('[data-testid="item-name-input"]', itemData.name);
    await this.page.fill('[data-testid="item-category-input"]', itemData.category);
    await this.page.fill('[data-testid="item-specification-input"]', itemData.specification);
    await this.page.fill('[data-testid="item-unit-input"]', itemData.unit);
    await this.page.fill('[data-testid="item-threshold-input"]', itemData.lowStockThreshold.toString());
    
    // 提交表单
    await this.page.click('[data-testid="submit-button"]');
  }

  async editItem(itemName: string, newData: Partial<{
    name: string;
    category: string;
    specification: string;
    unit: string;
    lowStockThreshold: number;
  }>) {
    // 找到物品行并点击编辑按钮
    const row = this.page.locator(`[data-testid="item-row"]:has-text("${itemName}")`);
    await row.locator('[data-testid="edit-button"]').click();
    
    // 更新表单字段
    if (newData.name) {
      await this.page.fill('[data-testid="item-name-input"]', newData.name);
    }
    if (newData.category) {
      await this.page.fill('[data-testid="item-category-input"]', newData.category);
    }
    if (newData.specification) {
      await this.page.fill('[data-testid="item-specification-input"]', newData.specification);
    }
    if (newData.unit) {
      await this.page.fill('[data-testid="item-unit-input"]', newData.unit);
    }
    if (newData.lowStockThreshold) {
      await this.page.fill('[data-testid="item-threshold-input"]', newData.lowStockThreshold.toString());
    }
    
    // 提交表单
    await this.page.click('[data-testid="submit-button"]');
  }

  async deleteItem(itemName: string) {
    const row = this.page.locator(`[data-testid="item-row"]:has-text("${itemName}")`);
    await row.locator('[data-testid="delete-button"]').click();
    
    // 确认删除
    await this.page.click('[data-testid="confirm-delete-button"]');
  }

  async searchItem(searchTerm: string) {
    await this.page.fill('[data-testid="search-input"]', searchTerm);
    await this.page.press('[data-testid="search-input"]', 'Enter');
  }

  async batchImport(filePath: string) {
    await this.page.click('[data-testid="batch-import-button"]');
    await this.page.setInputFiles('[data-testid="file-upload"]', filePath);
    await this.page.click('[data-testid="upload-button"]');
  }

  async expectItemInList(itemName: string) {
    await expect(this.page.locator(`[data-testid="item-row"]:has-text("${itemName}")`)).toBeVisible();
  }

  async expectItemNotInList(itemName: string) {
    await expect(this.page.locator(`[data-testid="item-row"]:has-text("${itemName}")`)).not.toBeVisible();
  }
}