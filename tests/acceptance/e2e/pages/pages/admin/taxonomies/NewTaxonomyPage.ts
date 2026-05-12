/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect, Locator } from '@playwright/test';
import { LocalizationUtils } from '../../../../utils/localization.utils';

export class NewTaxonomyPage extends BaseAdminPage {
	private readonly table: Locator;
	private readonly tableRows: Locator;

	constructor(page: Page) {
		super(page);
		this.table = page.locator('table.table-list');
		this.tableRows = this.table.locator('tbody tr');
	}

	async expectToBeOnTaxonomiesPageWithValidationError(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/taxonomies$/);
		await expect(this.page.getByRole('heading', { name: 'New taxonomy' })).toBeVisible();
	}

	async expectToBeOnEditTaxonomyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/taxonomies\/.+\/edit/);
		await expect(this.page.getByRole('heading', { name: 'Edit taxonomy' })).toBeVisible();
	}

	// Fields
	/**
	 * Fills the name field using LocalizationUtils for multilingual support
	 * @param name - The taxonomy name to fill
	 */
	async fillName(name: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.page, 'taxonomy_name');
		await this.page.fill(selector, name);
	}

	async submitForm(): Promise<void> {
		await this.page.getByRole('button', { name: 'Create taxonomy' }).click();
		await this.waitForLoadState();
	}

	async updateForm(): Promise<void> {
		await this.page.getByRole('button', { name: 'Update' }).click();
		await this.waitForLoadState();
	}

	async expectFormValidationError(): Promise<void> {
		const error = this.page.locator('.form-error');
		await expect(error.first()).toBeVisible();
	}

	async expectToBeOnTaxonomiesPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/taxonomies$/);
	}

	async expectTaxonomyIsInTable(name: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).first();
		await expect(row).toBeVisible();
	}

	async expectTaxonomyIsNotInTable(name: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).first();
		await expect(row).not.toBeVisible();
	}

	async createNewTaxonomy(): Promise<void> {
		await this.page.getByRole('link', { name: 'New taxonomy' }).click();
	}

	/**
	 * Get taxonomy title by row index (for taxonomies table)
	 * @param index - The row index (0-based)
	 * @returns The taxonomy title
	 */
	async getTaxonomyTitleByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		// The second td contains the taxonomy info, first link has the name
		const titleLink = row.locator('td').nth(1).locator('ul.taxonomy li a').first();
		const titleText = (await titleLink.textContent()) || '';
		return titleText.trim();
	}

	/**
	 * Find the index of a taxonomy by title
	 * @param title - The title to search for
	 * @returns The index of the first matching taxonomy, or -1 if not found
	 */
	async findTaxonomyIndexByTitle(title: string): Promise<number> {
		const count = await this.tableRows.count();

		for (let i = 0; i < count; i++) {
			const rowTitle = await this.getTaxonomyTitleByIndex(i);
			if (rowTitle.includes(title)) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Get the index of the first row with the specified title
	 * @param title - The exact title to search for
	 * @returns The index of the first matching taxonomy
	 * @throws Error if no taxonomy with the specified title is found
	 */
	async getIndexByTitle(title: string): Promise<number> {
		const index = await this.findTaxonomyIndexByTitle(title);

		if (index === -1) {
			throw new Error(`Taxonomy with title "${title}" not found in the table`);
		}

		return index;
	}

	/**
	 * Click edit button for a taxonomy by row index
	 * @param index - The row index (0-based)
	 */
	async clickEditButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		const editLink = row.locator('a.dropdown__button[href*="/edit"]');
		if ((await editLink.count()) > 0) {
			await editLink.click();
		} else {
			throw new Error(`Edit button not found for taxonomy at index ${index}`);
		}
	}

	/**
	 * Click delete button for a taxonomy by name
	 * @param name - The name of the taxonomy to delete
	 */
	async clickDeleteButtonByName(name: string): Promise<void> {
		const index = await this.getIndexByTitle(name);
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		const deleteButton = row.locator('a.dropdown__button--danger, a.dropdown__button[data-confirm]');
		await deleteButton.click();
	}

	/**
	 * Deletes a taxonomy by name if it exists
	 * @param name - The name of the taxonomy to delete
	 */
	async deleteTaxonomyByName(name: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).first();

		// Check if the taxonomy exists
		if ((await row.count()) === 0) {
			console.log(`Taxonomy "${name}" not found, skipping deletion`);
			return;
		}

		// Click the delete button in the row via dropdown
		await row.locator('button[data-controller="dropdown"]').click();
		const deleteButton = row.locator('a.dropdown__button--danger, a.dropdown__button[data-confirm]');
		await deleteButton.click();

		// Wait for confirmation modal and click OK
		const confirmButton = this.page.locator('button[data-confirm-ok]');
		await confirmButton.click();

		// Wait for the deletion to complete
		await this.page.waitForLoadState('load');
	}
}
