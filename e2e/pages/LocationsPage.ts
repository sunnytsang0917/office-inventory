import { Page, expect } from '@playwright/test';

export class LocationsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/locations');
  }

  async createLocation(locationData: {
    code: string;
    name: string;
    description?: string;
    parentId?: string;
  }) {
    await this.page.click('[data-testid="add-location-button"]');
    
    await this.page.fill('[data-testid="location-code-input"]', locationData.code);
    await this.page.fill('[data-testid="location-name-input"]', locationData.name);
    
    if (locationData.description) {
      await this.page.fill('[data-testid="location-description-input"]', locationData.description);
    }
    
    if (locationData.parentId) {
      await this.page.selectOption('[data-testid="parent-location-select"]', locationData.parentId);
    }
    
    await this.page.click('[data-testid="submit-button"]');
  }

  async editLocation(locationCode: string, newData: Partial<{
    code: string;
    name: string;
    description: string;
  }>) {
    const row = this.page.locator(`[data-testid="location-row"]:has-text("${locationCode}")`);
    await row.locator('[data-testid="edit-button"]').click();
    
    if (newData.code) {
      await this.page.fill('[data-testid="location-code-input"]', newData.code);
    }
    if (newData.name) {
      await this.page.fill('[data-testid="location-name-input"]', newData.name);
    }
    if (newData.description) {
      await this.page.fill('[data-testid="location-description-input"]', newData.description);
    }
    
    await this.page.click('[data-testid="submit-button"]');
  }

  async deleteLocation(locationCode: string) {
    const row = this.page.locator(`[data-testid="location-row"]:has-text("${locationCode}")`);
    await row.locator('[data-testid="delete-button"]').click();
    await this.page.click('[data-testid="confirm-delete-button"]');
  }

  async expectLocationInList(locationCode: string) {
    await expect(this.page.locator(`[data-testid="location-row"]:has-text("${locationCode}")`)).toBeVisible();
  }

  async expectLocationNotInList(locationCode: string) {
    await expect(this.page.locator(`[data-testid="location-row"]:has-text("${locationCode}")`)).not.toBeVisible();
  }
}