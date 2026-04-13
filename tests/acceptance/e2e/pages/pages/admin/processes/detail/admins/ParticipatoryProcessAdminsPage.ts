/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 * Simone Bianchelli
 */

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

		this.newAdminButton = page.getByRole('link', { name: 'New process admin' });
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

		if (action === 'resend') {
			await row.locator('a.resend-invitation').click();
			return;
		}

		// edit and delete are inside the dropdown menu
		await row.locator('button[data-controller="dropdown"]').click();

		let actionSelector: Locator;
		switch (action) {
			case 'edit':
				actionSelector = row.locator('a.dropdown__button[href*="/edit"]');
				break;
			case 'delete':
				actionSelector = row.locator('a.dropdown__button--danger, a.dropdown__button[data-confirm]');
				break;
			default:
				throw new Error(`Unknown action: ${action}`);
		}

		await actionSelector.click();
	}

	/**
	 * Verifies that the user is on the Participatory Process Admins page.
	 * Accepts both the list view (/user_roles) and detail view (/user_roles/id)
	 */
	async expectToBeOnParticipatoryProcessAdminsPage(): Promise<void> {
		await expect(this.page).toHaveURL(/user_roles/);
		await expect(this.newAdminButton).toBeVisible();
	}

	/**
	 * Verifies that the admins table is visible.
	 */
	async expectTableIsVisible(): Promise<void> {
		await expect(this.table).toBeVisible();
	}

	/**
	 * Verifies that an admin with the given name and email is present in the table.
	 * @param name The name of the admin.
	 * @param email The email of the admin.
	 */
	async expectAdminIsInTable(name: string, email: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).filter({ hasText: email }).first();
		await expect(row).toBeVisible();
	}

	/**
	 * Verifies the number of search results in the table.
	 * @param expectedCount The expected number of rows.
	 */
	async expectSearchResultsCount(expectedCount: number): Promise<void> {
		const rows = this.page.locator('table.table-list tbody tr');
		await expect(rows).toHaveCount(expectedCount);
	}

	/**
	 * Returns the name of the admin at the given row index.
	 * @param rowIndex The index of the row (0-based).
	 * @returns The name as a string.
	 */
	async getAdminNameAtRow(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const nameCell = row.locator('td[data-label="Name"]');
		return (await nameCell.textContent())?.trim() || '';
	}

	/**
	 * Returns the email of the admin at the given row index.
	 * @param rowIndex The index of the row (0-based).
	 * @returns The email as a string.
	 */
	async getAdminEmailAtRow(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const emailCell = row.locator('td[data-label="Email"]');
		return (await emailCell.textContent())?.trim() || '';
	}

	/**
	 * Returns the role of the admin at the given row index.
	 * @param rowIndex The index of the row (0-based).
	 * @returns The role as a string.
	 */
	async getRoleByRowIndex(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const roleCell = row.locator('td:nth-child(5)'); // Assuming the "Role" column is the fifth
		return (await roleCell.textContent())?.trim() || '';
	}

	/**
	 * Returns the role of the admin identified by email, regardless of row order.
	 * @param email The email of the admin.
	 * @returns The role as a string.
	 */
	async getRoleForAdmin(email: string): Promise<string> {
		const row = this.tableRows.filter({ hasText: email }).first();
		const roleCell = row.locator('td:nth-child(5)');
		return (await roleCell.textContent())?.trim() || '';
	}
}
