/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for the Debates list page in process detail management.
 * Handles component management including adding, configuring, and managing components.
 */
export class DebatesPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;
	private readonly newDebateButton: Locator;
	// Table elements
	private readonly tableRows: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);
		this.newDebateButton = page.locator('a.button:has-text("New debate")');

		// Table elements
		this.tableRows = page.locator('table.table-list tbody tr');
	}

	async createNewDebate(): Promise<void> {
		await this.newDebateButton.click();
	}

	/**
	 * Get the number of debates in the table
	 * @returns The count of debate rows
	 */
	async getDebatesCount(): Promise<number> {
		return await this.tableRows.count();
	}

	/**
	 * Get all debate titles from the table
	 * @returns Array of debate titles
	 */
	async getAllDebateTitles(): Promise<string[]> {
		const count = await this.getDebatesCount();
		const titles: string[] = [];

		for (let i = 0; i < count; i++) {
			const title = await this.getDebateTitleByIndex(i);
			titles.push(title);
		}

		return titles;
	}

	/**
	 * Get debate title by row index
	 * @param index - The row index (0-based)
	 * @returns The debate title
	 */
	async getDebateTitleByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const titleCell = row.locator('td').first();
		// Get text content, removing any HTML and extra whitespace
		const titleText = (await titleCell.textContent()) || '';
		return titleText.trim();
	}

	/**
	 * Get debate start date by row index
	 * @param index - The row index (0-based)
	 * @returns The start date text
	 */
	async getStartDateByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const startDateCell = row.locator('td').nth(1);
		return ((await startDateCell.textContent()) || '').trim();
	}

	/**
	 * Get debate end date by row index
	 * @param index - The row index (0-based)
	 * @returns The end date text
	 */
	async getEndDateByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const endDateCell = row.locator('td').nth(2);
		return ((await endDateCell.textContent()) || '').trim();
	}

	/**
	 * Check if a debate is closed by title
	 * A debate is considered closed when:
	 * 1. The title is not clickable (no link)
	 * 2. There is no edit button in the actions column
	 *
	 * @param title - The title of the debate to check
	 * @returns True if the debate is closed, false otherwise
	 */
	async isDebateClosedByTitle(title: string): Promise<boolean> {
		const count = await this.getDebatesCount();
		for (let i = 0; i < count; i++) {
			const rowTitle = (await this.getDebateTitleByIndex(i)).toLowerCase();

			// Check if this row contains the target title
			if (rowTitle.includes(title.toLowerCase().trim())) {
				const row = this.tableRows.nth(i);

				// Check if title is clickable (has a link)
				const titleLink = row.locator('td').first().locator('a');
				const hasTitleLink = (await titleLink.count()) > 0;

				// Check if debate edit button exists in dropdown (excludes debate_closes and permissions links)
				await row.locator('button[data-controller="dropdown"]').click();
				const editLink = row.locator(
					'a.dropdown__button[href*="/manage/debates/"][href$="/edit"]:not([href*="debate_closes"])'
				);
				const hasEditButton = (await editLink.count()) > 0;
				await this.page.keyboard.press('Escape');

				// Debate is closed if title is not clickable AND there's no edit button
				return !hasTitleLink && !hasEditButton;
			}
		}

		// If debate with title not found, throw error
		throw new Error(`Debate with title "${title}" not found in the table`);
	}

	/**
	 * Check if a debate has an edit button by row index
	 * @param index - The row index (0-based)
	 * @returns True if edit button exists
	 */
	async hasEditButtonByIndex(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		const editLink = row.locator('a.dropdown__button[href*="/edit"]:not([href*="debate_closes"])');
		const exists = (await editLink.count()) > 0;
		await this.page.keyboard.press('Escape');
		return exists;
	}

	/**
	 * Check if a debate title is clickable by row index
	 * @param index - The row index (0-based)
	 * @returns True if title is clickable (has a link)
	 */
	async isTitleClickableByIndex(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		const titleLink = row.locator('td').first().locator('a');
		return (await titleLink.count()) > 0;
	}

	/**
	 * Click on a debate title by index (if clickable)
	 * @param index - The row index (0-based)
	 */
	async clickDebateTitleByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const titleLink = row.locator('td').first().locator('a');

		if ((await titleLink.count()) > 0) {
			await titleLink.click();
		} else {
			throw new Error(`Debate at index ${index} is not clickable (possibly closed)`);
		}
	}

	/**
	 * Click edit button for a debate by row index
	 * @param index - The row index (0-based)
	 */
	async clickEditButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		const editLink = row.locator('a.dropdown__button[href*="/edit"]:not([href*="debate_closes"])');
		if ((await editLink.count()) > 0) {
			await editLink.click();
		} else {
			await this.page.keyboard.press('Escape');
			throw new Error(`Edit button not found for debate at index ${index} (possibly closed)`);
		}
	}

	/**
	 * Click close button for a debate by row index
	 * @param index - The row index (0-based)
	 */
	async clickCloseButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		await row.locator('a.dropdown__button[href*="debate_closes"]').click();
	}

	/**
	 * Click preview button for a debate by row index
	 * @param index - The row index (0-based)
	 */
	async clickPreviewButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		const previewLink = row.locator('a.dropdown__button[target="blank"]');
		await previewLink.click();
	}

	/**
	 * Click permissions button for a debate by row index
	 * @param index - The row index (0-based)
	 */
	async clickPermissionsButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		await row.locator('a.dropdown__button[href*="permissions"]').click();
	}

	/**
	 * Click delete button for a debate by row index
	 * @param index - The row index (0-based)
	 */
	async clickDeleteButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		await row.locator('button[data-controller="dropdown"]').click();
		await row.locator('ul.dropdown[aria-hidden="false"]').waitFor({ state: 'attached' });
		await row.locator('a[href*="soft_delete"]').click();
	}

	/**
	 * Find the index of a debate by title
	 * @param title - The title to search for
	 * @returns The index of the first matching debate, or -1 if not found
	 */
	async findDebateIndexByTitle(title: string): Promise<number> {
		const count = await this.getDebatesCount();

		for (let i = 0; i < count; i++) {
			const rowTitle = await this.getDebateTitleByIndex(i);
			if (rowTitle.includes(title)) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Get the index of the first row with the specified title
	 * @param title - The exact title to search for
	 * @returns The index of the first matching debate
	 * @throws Error if no debate with the specified title is found
	 */
	async getIndexByTitle(title: string): Promise<number> {
		const index = await this.findDebateIndexByTitle(title);

		if (index === -1) {
			throw new Error(`Debate with title "${title}" not found in the table`);
		}

		return index;
	}
}
