/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 * Simone Bianchelli
 */

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
		await this.page.waitForLoadState('load');
	}

	// Actions
	async clickImportViaCSV(): Promise<void> {
		await this.page.click('a.button.import');
	}

	async clickNewPrivateUser(): Promise<void> {
		await this.page.click('a.button.new');
	}

	async clickDelete(rowIndex: number): Promise<void> {
		const row = this.page.locator('table.table-list tbody tr').nth(rowIndex);
		await row.locator('button[data-controller="dropdown"]').click();
		const deleteLink = row.locator('a.dropdown__button--danger, a.dropdown__button[data-confirm]');
		await deleteLink.click();
	}

	async getRowsCount(): Promise<number> {
		const rows = this.page.locator('table.table-list tbody tr');
		return await rows.count();
	}

	/**
	 * Returns the email of the participant at the given row index.
	 * Robust regardless of pagination — use this to identify the deleted participant.
	 */
	async getParticipantEmailAtRow(rowIndex: number): Promise<string> {
		const row = this.page.locator('table.table-list tbody tr').nth(rowIndex);
		// Email is the second <td> in each row in Decidim's admin table
		const email = await row.locator('td').nth(1).textContent();
		if (!email) throw new Error(`Could not read email at row ${rowIndex}`);
		return email.trim();
	}

	/**
	 * Searches for the given email and asserts that it no longer appears in the table.
	 * Works correctly even when the table has pagination (>25 rows).
	 */
	async expectParticipantDeletedByEmail(email: string): Promise<void> {
		const searchField = this.page.getByRole('searchbox', { name: 'Search by user name, email' });
		const searchButton = this.page.getByRole('button', { name: 'Search' });
		await searchField.fill(email);
		await searchButton.click();
		await this.page.waitForLoadState('load');
		const rows = this.page.locator('table.table-list tbody tr');
		// Either 0 rows, or all visible rows must not contain the email
		const count = await rows.count();
		for (let i = 0; i < count; i++) {
			const cellText = await rows.nth(i).textContent();
			if (cellText?.includes(email)) {
				throw new Error(`Participant with email "${email}" still present in the table after deletion`);
			}
		}
		// Restore empty search
		await searchField.fill('');
		await searchButton.click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Searches for the given email and asserts that at least one row still contains it.
	 * Used in the Alternative Flow (cancel) to confirm the participant was NOT deleted.
	 */
	async expectParticipantStillPresentByEmail(email: string): Promise<void> {
		const searchField = this.page.getByRole('searchbox', { name: 'Search by user name, email' });
		const searchButton = this.page.getByRole('button', { name: 'Search' });
		await searchField.fill(email);
		await searchButton.click();
		await this.page.waitForLoadState('load');
		const rows = this.page.locator('table.table-list tbody tr');
		const count = await rows.count();
		let found = false;
		for (let i = 0; i < count; i++) {
			const cellText = await rows.nth(i).textContent();
			if (cellText?.includes(email)) {
				found = true;
				break;
			}
		}
		if (!found) {
			throw new Error(`Participant with email "${email}" was not found — it may have been accidentally deleted`);
		}
		// Restore empty search
		await searchField.fill('');
		await searchButton.click();
		await this.page.waitForLoadState('load');
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

	async expectTableIsVisible(): Promise<void> {
		const table = this.page.locator('table.table-list');
		await expect(table).toBeVisible();
	}

	async expectParticipantIsInTable(name?: string, email?: string): Promise<void> {
		const searchField = this.page.getByRole('searchbox', { name: 'Search by user name, email' });
		const searchButton = this.page.getByRole('button', { name: 'Search' });
		const table = this.page.locator('table.table-list tbody');
		await expect(searchField).toBeVisible();
		await expect(table).toBeVisible();

		if (name && email) {
			// Look for a row that contains both name and email using hasText for partial matching
			await searchField.click();
			await searchField.fill(name);
			await searchButton.click();
			const row = table.locator('tr').filter({ hasText: name }).filter({ hasText: email });
			await expect(row.first()).toBeVisible();
		} else if (name) {
			// Look for a row containing the name
			await searchField.click();
			await searchField.fill(name);
			await searchButton.click();
			const row = table.locator('tr', { hasText: name });
			await expect(row.first()).toBeVisible();
		} else if (email) {
			// Look for a row containing the email
			await searchField.click();
			await searchField.fill(email);
			await searchButton.click();
			const row = table.locator('tr', { hasText: email });
			await expect(row.first()).toBeVisible();
		} else {
			throw new Error('Either name or email must be provided');
		}

		await searchField.click();
		await searchField.fill('');
		await searchButton.click();
	}
}
