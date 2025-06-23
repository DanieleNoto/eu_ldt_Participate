import { Locator, Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for the Participatory Process Admins page.
 * Extends BaseAdminPage and provides methods for managing process admins.
 */
export class ParticipatoryProcessAdminsPage extends BaseAdminPage {
	private readonly newAdminButton: Locator;
	private readonly filterDropdown: Locator;
	private readonly searchInput: Locator;
	private readonly searchButton: Locator;
	private readonly tableRows: Locator;
	private readonly table: Locator;

	constructor(page: Page) {
		super(page);

		this.newAdminButton = page.locator('a.button.button__sm.button__secondary.new');
		this.filterDropdown = page.locator('ul.dropdown.menu');
		this.searchInput = page.locator('input.input-group-field');
		this.searchButton = page.locator('button.text-secondary');
		this.tableRows = page.locator('table.table-list tbody tr');
		this.table = page.locator('table.table-list');
	}

	/**
	 * Clicks the "New process admin" button.
	 */
	async clickNewAdminButton(): Promise<void> {
		await this.newAdminButton.click();
	}

	/**
	 * Applies a filter by clicking the dropdown and selecting an option.
	 * @param filterName The name of the filter to apply.
	 * @param optionName The name of the option within the filter.
	 */
	async applyFilter(filterName: string, optionName: string): Promise<void> {
		const filter = this.filterDropdown.locator(`a[aria-label="${filterName}"]`);
		await filter.click();

		const option = this.filterDropdown.locator(`a:has-text("${optionName}")`);
		await option.click();
	}

	/**
	 * Searches for a process admin by name, nickname, or email.
	 * @param searchTerm The term to search for.
	 */
	async searchAdmin(searchTerm: string): Promise<void> {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
	}

	/**
	 * Returns the number of rows in the admins table.
	 */
	async getRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	/**
	 * Verifies the number of rows in the admins table.
	 * @param expectedCount The expected number of rows.
	 */
	async expectRowCount(expectedCount: number): Promise<void> {
		const actualCount = await this.getRowCount();
		if (actualCount !== expectedCount) {
			throw new Error(`Expected ${expectedCount} rows, but found ${actualCount}`);
		}
	}

	/**
	 * Performs an action (edit, resend invitation, delete) on a specific row.
	 * @param rowIndex The index of the row (0-based).
	 * @param action The action to perform ("edit", "resend", "delete").
	 */
	async performActionOnRow(rowIndex: number, action: 'edit' | 'resend' | 'delete'): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		let actionSelector: Locator;

		switch (action) {
			case 'edit':
				actionSelector = row.locator('a.action-icon--edit');
				break;
			case 'resend':
				actionSelector = row.locator('a.resend-invitation');
				break;
			case 'delete':
				actionSelector = row.locator('a.action-icon--remove');
				break;
			default:
				throw new Error(`Unknown action: ${action}`);
		}

		await actionSelector.click();
	}

	/**
	 * Verifies that the user is on the Participatory Process Admins page.
	 */
	async expectToBeOnParticipatoryProcessAdminsPage(): Promise<void> {
		await expect(this.page).toHaveURL(/user_roles$/);
		await expect(this.newAdminButton).toBeVisible();
	}
	async expectTableIsVisible(): Promise<void> {
		await expect(this.table).toBeVisible();
	}
	async expectAdminIsInTable(name: string, email: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).filter({ hasText: email }).first();
		await expect(row).toBeVisible();
	}
}
