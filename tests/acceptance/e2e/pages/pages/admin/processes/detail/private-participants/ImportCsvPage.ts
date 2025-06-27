import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect } from '@playwright/test';

export class ImportCsvPage extends BaseAdminPage {
	protected page: Page;

	constructor(page: Page) {
		super(page);
		this.page = page;
	}

	// Navigation
	async navigateToImportCsvPage(): Promise<void> {
		await this.page.goto(
			'/admin/participatory_processes/minimal-process-1750076875679/participatory_space_private_users/csv_import'
		);
		await this.page.waitForLoadState('networkidle');
	}

	// Actions
	async deleteAllPrivateParticipants(): Promise<void> {
		await this.page.click('a.button.alert');
	}

	async submitForm(): Promise<void> {
		await this.page.click('form button[type="submit"]');
	}

	async clickAddFile(): Promise<void> {
		await this.page.click('button#participatory_space_private_user_csv_import_file_button');
	}

	async uploadCsvFile(filePath: string): Promise<void> {
		await this.page.setInputFiles('#participatory_space_private_user_csv_import_file_button', filePath);
		await this.page.click('form button[type="submit"]');
	}

	// Validations
	async expectToBeOnImportCsvPage(): Promise<void> {
		await expect(this.page).toHaveURL(/csv_import/);
		await expect(this.page.locator('h1.item_show__header-title')).toHaveText('Import private participants via CSV');
	}

	async expectPrivateParticipantsCount(expectedCount: number): Promise<void> {
		const countText = await this.page.locator('.card-section p').first().textContent();
		const count = parseInt(countText?.match(/\d+/)?.[0] || '0', 10);
		expect(count).toBe(expectedCount);
	}
}
