import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect } from '@playwright/test';

export class PrivateParticipantsPage extends BaseAdminPage {
	protected page: Page;

	constructor(page: Page) {
		super(page);
		this.page = page;
	}

	// Navigation
	async navigateToPrivateParticipantsPage(): Promise<void> {
		await this.page.goto(
			'/admin/participatory_processes/minimal-process-1750076875679/participatory_space_private_users'
		);
		await this.page.waitForLoadState('networkidle');
	}

	// Actions
	async clickImportViaCSV(): Promise<void> {
		await this.page.click('a.button.import');
	}

	async clickNewPrivateUser(): Promise<void> {
		await this.page.click('a.button.new');
	}

	async applyFilter(filterName: string, filterOption: string): Promise<void> {
		const filterDropdown = this.page.locator('a.dropdown.button');
		await filterDropdown.click();
		const filter = this.page.locator(`a[aria-label="${filterName}"]`);
		await filter.click();
		const option = this.page.locator(`a[role="menuitem"]:has-text("${filterOption}")`);
		await option.click();
	}

	async searchByNameOrEmail(query: string): Promise<void> {
		await this.page.fill('#q_user_name_or_user_email_cont', query);
		await this.page.click('button[aria-label="Search"]');
	}

	async clickResendInvitation(rowIndex: number): Promise<void> {
		const row = this.page.locator('table.table-list tbody tr').nth(rowIndex);
		await row.locator('a.action-icon.resend-invitation').click();
	}

	async clickDelete(rowIndex: number): Promise<void> {
		const row = this.page.locator('table.table-list tbody tr').nth(rowIndex);
		await row.locator('a.action-icon--remove').click();
	}

	async getRowsCount(): Promise<number> {
		const rows = this.page.locator('table.table-list tbody tr');
		return await rows.count();
	}

	// Validations
	async expectToBeOnPrivateParticipantsPage(): Promise<void> {
		await expect(this.page).toHaveURL(/participatory_space_private_users/);
		await expect(this.page.locator('h1.item_show__header-title')).toContainText(
			'Participatory space private participant'
		);
	}

	async expectSearchResultsCount(expectedCount: number): Promise<void> {
		const rows = this.page.locator('table.table-list tbody tr');
		await expect(rows).toHaveCount(expectedCount);
	}

	async expectRowContains(rowIndex: number, name: string, email: string): Promise<void> {
		const row = this.page.locator('table.table-list tbody tr').nth(rowIndex);
		await expect(row.locator('td').nth(0)).toHaveText(name);
		await expect(row.locator('td').nth(1)).toHaveText(email);
	}

	async expectTableIsVisible(): Promise<void> {
		const table = this.page.locator('table.table-list');
		await expect(table).toBeVisible();
	}

	async expectParticipantIsInTable(name?: string, email?: string): Promise<void> {
		const rows = this.page.locator('table.table-list tbody tr');
		const count = await rows.count();

		for (let i = 0; i < count; i++) {
			const rowName = await rows.nth(i).locator('td').nth(0).textContent();
			const rowEmail = await rows.nth(i).locator('td').nth(1).textContent();

			if ((name && rowName?.includes(name)) || (email && rowEmail?.includes(email))) {
				return;
			}
		}

		throw new Error(`Participant with name "${name}" or email "${email}" not found in table`);
	}
}
