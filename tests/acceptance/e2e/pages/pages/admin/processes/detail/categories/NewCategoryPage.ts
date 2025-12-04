/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect } from '@playwright/test';

export class NewCategoryPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	getPage(): Page {
		return this.page;
	}

	// Navigation
	async expectToBeOnNewCategoryPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.+\/categories$/);
		await expect(this.page.getByRole('heading', { name: 'New category' })).toBeVisible();
	}

	async expectToBeOnEditCategoryPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.+\/categories\/.+\/edit/);
		await expect(this.page.getByRole('heading', { name: 'Edit category' })).toBeVisible();
	}

	// Fields
	async fillName(name: string): Promise<void> {
		await this.page.fill('#category_name_en', name);
	}

	async fillOrderPosition(position: number): Promise<void> {
		await this.page.fill('#category_weight', position.toString());
	}
	async getOrderPosition(): Promise<number> {
		const value = await this.page.locator('#category_weight').inputValue();
		return parseInt(value, 10);
	}

	async selectParentByIndex(index: number): Promise<void> {
		await this.page.selectOption('#category_parent_id', { index });
	}

	async getSelectedOption(): Promise<string | null> {
		return await this.page.locator('#category_parent_id option:checked').innerText();
	}

	// Submit
	async submitForm(): Promise<void> {
		await this.page.click('form button[type="submit"]');
		await this.waitForLoadState();
	}

	// Validation
	async expectFormValidationError(): Promise<void> {
		const error = this.page.locator('.form-error');
		await expect(error.first()).toBeVisible();
	}
}
