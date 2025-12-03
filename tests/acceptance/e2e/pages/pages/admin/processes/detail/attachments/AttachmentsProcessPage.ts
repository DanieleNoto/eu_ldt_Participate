/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for the Attachments page in the admin area of a process.
 * Allows clicking "New attachment", edit and delete for each table row.
 */
export class AttachmentsProcessPage extends BaseAdminPage {
	private readonly newAttachmentButton: Locator;
	private readonly attachmentsTable: Locator;
	private readonly tableRows: Locator;

	constructor(page: Page) {
		super(page);
		this.newAttachmentButton = page.locator('a.button.new', { hasText: 'New attachment' });
		this.attachmentsTable = page.locator('table.table-list');
		this.tableRows = this.attachmentsTable.locator('tbody tr');
	}

	/**
	 * Clicks the "New attachment" button
	 */
	async clickNewAttachment(): Promise<void> {
		await this.newAttachmentButton.click();
	}

	/**
	 * Returns the number of rows in the attachments table
	 */
	async getAttachmentsCount(): Promise<number> {
		return await this.tableRows.count();
	}

	/**
	 * Clicks the edit icon for the specified row (0-based)
	 * @param rowIndex Row index (0-based)
	 */
	async clickEditAttachmentByIndex(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const editLink = row.locator('a.action-icon--edit');
		await editLink.click();
	}

	/**
	 * Clicks the delete icon for the specified row (0-based)
	 * @param rowIndex Row index (0-based)
	 */
	async clickDeleteAttachmentByIndex(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const deleteLink = row.locator('a.action-icon--remove');
		await deleteLink.click();
	}

	/**
	 * Clicks the delete icon for an attachment with the specified title
	 * @param title Title of the attachment to delete
	 * @throws Error if no attachment with the specified title is found
	 */
	async clickDeleteAttachmentByTitle(title: string): Promise<void> {
		const rowCount = await this.tableRows.count();

		for (let i = 0; i < rowCount; i++) {
			const attachmentTitle = await this.getAttachmentTitleByIndex(i);

			if (attachmentTitle === title) {
				await this.clickDeleteAttachmentByIndex(i);
				return;
			}
		}

		throw new Error(`No attachment with title "${title}" found in the table`);
	}

	/**
	 * Clicks the delete icon for the attachment titled "Test"
	 */
	async clickDeleteTestAttachment(): Promise<void> {
		await this.clickDeleteAttachmentByTitle('Test');
	}

	/**
	 * Returns the attachment title for a row
	 * @param rowIndex Row index (0-based)
	 */
	async getAttachmentTitleByIndex(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const titleCell = row.locator('td').first();
		return (await titleCell.textContent())?.trim() || '';
	}

	/**
	 * Checks if an attachment with the specified title exists in the table
	 * @param title Title to look for
	 * @returns True if found, false otherwise
	 */
	async hasAttachmentWithTitle(title: string): Promise<boolean> {
		const rowCount = await this.tableRows.count();

		for (let i = 0; i < rowCount; i++) {
			const attachmentTitle = await this.getAttachmentTitleByIndex(i);
			if (attachmentTitle === title) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Gets the row index of an attachment with the specified title
	 * @param title Title to look for
	 * @returns Row index if found, -1 otherwise
	 */
	async getAttachmentIndexByTitle(title: string): Promise<number> {
		const rowCount = await this.tableRows.count();

		for (let i = 0; i < rowCount; i++) {
			const attachmentTitle = await this.getAttachmentTitleByIndex(i);
			if (attachmentTitle === title) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Verifies that an attachment with the title "Test" exists in the table
	 * @throws Error if the attachment is not found
	 */
	async expectTestAttachmentExists(): Promise<void> {
		const exists = await this.hasAttachmentWithTitle('Test');
		expect(exists, 'Attachment with title "Test" should exist in the table').toBe(true);
	}

	/**
	 * Asserts that the attachments table is visible
	 */
	async expectAttachmentsTableVisible(): Promise<void> {
		await expect(this.attachmentsTable).toBeVisible();
	}
	/**
	 * Asserts that the attachments table is visible
	 */
	async expectToBeOnAttachmentsProcessPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.*\/attachments$/);
		await expect(this.attachmentsTable).toBeVisible();
	}

	/**
	 * Verifies that an attachment with the specified title exists in the table
	 * @param title Title to look for
	 * @throws Error if the attachment is not found
	 */
	async expectAttachmentWithTitleExists(title: string): Promise<void> {
		const exists = await this.hasAttachmentWithTitle(title);
		expect(exists).toBe(true);
	}
}
