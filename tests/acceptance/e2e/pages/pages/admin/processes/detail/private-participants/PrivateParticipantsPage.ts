/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
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
		await this.page.waitForLoadState('networkidle');
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

	async expectTableIsVisible(): Promise<void> {
		const table = this.page.locator('table.table-list');
		await expect(table).toBeVisible();
	}

	async expectParticipantIsInTable(name?: string, email?: string): Promise<void> {
		const table = this.page.locator('table.table-list tbody');

		if (name && email) {
			// Look for a row that contains both name and email using hasText for partial matching
			const row = table.locator('tr').filter({ hasText: name }).filter({ hasText: email });
			await expect(row.first()).toBeVisible({ timeout: 2000 });
		} else if (name) {
			// Look for a row containing the name
			const row = table.locator('tr', { hasText: name });
			await expect(row.first()).toBeVisible();
		} else if (email) {
			// Look for a row containing the email
			const row = table.locator('tr', { hasText: email });
			await expect(row.first()).toBeVisible();
		} else {
			throw new Error('Either name or email must be provided');
		}
	}
}
