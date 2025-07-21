import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect } from '@playwright/test';

export class NewCategoryPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	getPage(): Page {
		return this.page;
	}

	// Navigazione
	async expectToBeOnNewCategoryPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.+\/categories$/);
		await expect(this.page.getByRole('heading', { name: 'New category' })).toBeVisible();
	}

	// Interazioni campi
	async fillName(name: string): Promise<void> {
		await this.page.fill('#category_name_en', name);
	}

	async fillOrderPosition(position: number): Promise<void> {
		await this.page.fill('#category_weight', position.toString());
	}

	async selectParentByValue(value: string): Promise<void> {
		await this.page.selectOption('#category_parent_id', value);
	}

	// Submit
	async submitForm(): Promise<void> {
		await this.page.click('form button[type="submit"]');
		await this.waitForLoadState();
	}

	// Validazioni
	async expectFormValidationError(): Promise<void> {
		const error = this.page.locator('.form-error');
		await expect(error.first()).toBeVisible();
	}
}
