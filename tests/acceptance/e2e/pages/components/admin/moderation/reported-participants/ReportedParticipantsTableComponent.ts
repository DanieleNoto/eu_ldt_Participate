/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the participants table on the Reported Participants page
 */
export class ReportedParticipantsTableComponent {
	readonly page: Page;
	readonly tableContainer: Locator;
	readonly table: Locator;
	readonly tableHeaders: Locator;
	readonly tableRows: Locator;
	readonly sortByReportedAtLink: Locator;
	readonly sortByReportsCountLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.tableContainer = page.locator('.table-scroll');
		this.table = this.tableContainer.locator('table.table-list');
		this.tableHeaders = this.table.locator('thead th');
		this.tableRows = this.table.locator('tbody tr');
		this.sortByReportedAtLink = this.table.locator('a.sort_link').filter({ hasText: 'Reported at' });
		this.sortByReportsCountLink = this.table.locator('a.sort_link').filter({ hasText: 'Reports count' });
	}

	/**
	 * Get the number of participant rows
	 */
	async getParticipantCount(): Promise<number> {
		return await this.tableRows.count();
	}

	/**
	 * Get participant data from a specific row
	 */
	async getParticipantData(rowIndex: number): Promise<{
		name: string;
		nickname: string;
		reason: string;
		reportedAt: string;
		reportsCount: string;
		nameUrl: string;
		nicknameUrl: string;
		hasUnreportAction: boolean;
		hasBlockAction: boolean;
	}> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');

		const nameCell = cells.nth(0);
		const nicknameCell = cells.nth(1);
		const reasonCell = cells.nth(2);
		const reportedAtCell = cells.nth(3);
		const reportsCountCell = cells.nth(4);
		const actionsCell = cells.nth(5);

		const nameLink = nameCell.locator('a');
		const nicknameLink = nicknameCell.locator('a');
		const unreportAction = actionsCell.locator('a.action-icon--unreport');
		const blockAction = actionsCell.locator('a[title*="Block User"]');

		return {
			name: (await nameCell.textContent()) || '',
			nickname: (await nicknameCell.textContent()) || '',
			reason: (await reasonCell.textContent()) || '',
			reportedAt: (await reportedAtCell.textContent()) || '',
			reportsCount: (await reportsCountCell.textContent()) || '',
			nameUrl: (await nameLink.getAttribute('href')) || '',
			nicknameUrl: (await nicknameLink.getAttribute('href')) || '',
			hasUnreportAction: await unreportAction.isVisible(),
			hasBlockAction: await blockAction.isVisible()
		};
	}

	/**
	 * Click on a participant's name link
	 */
	async clickParticipantName(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const nameLink = row.locator('td').nth(0).locator('a');
		await nameLink.click();
	}

	/**
	 * Click on a participant's nickname link
	 */
	async clickParticipantNickname(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const nicknameLink = row.locator('td').nth(1).locator('a');
		await nicknameLink.click();
	}

	/**
	 * Click the unreport action for a participant
	 */
	async clickUnreportAction(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const unreportAction = row.locator('a.action-icon--unreport');
		await unreportAction.click();
	}

	/**
	 * Click the block user action for a participant
	 */
	async clickBlockUserAction(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const blockAction = row.locator('a[title*="Block User"]');
		await blockAction.click();
	}

	/**
	 * Sort by reported at date
	 */
	async sortByReportedAt(): Promise<void> {
		await this.sortByReportedAtLink.click();
	}

	/**
	 * Sort by reports count
	 */
	async sortByReportsCount(): Promise<void> {
		await this.sortByReportsCountLink.click();
	}

	/**
	 * Verify the table is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.table.isVisible();
	}

	/**
	 * Get table headers
	 */
	async getTableHeaders(): Promise<string[]> {
		const headers: string[] = [];
		const count = await this.tableHeaders.count();

		for (let i = 0; i < count; i++) {
			const headerText = (await this.tableHeaders.nth(i).textContent()) || '';
			headers.push(headerText.trim());
		}

		return headers;
	}

	/**
	 * Check if table has any participants
	 */
	async hasParticipants(): Promise<boolean> {
		const count = await this.getParticipantCount();
		return count > 0;
	}

	/**
	 * Get all participants data
	 */
	async getAllParticipantsData(): Promise<
		Array<{
			name: string;
			nickname: string;
			reason: string;
			reportedAt: string;
			reportsCount: string;
			nameUrl: string;
			nicknameUrl: string;
			hasUnreportAction: boolean;
			hasBlockAction: boolean;
		}>
	> {
		const participants = [];
		const count = await this.getParticipantCount();

		for (let i = 0; i < count; i++) {
			const participantData = await this.getParticipantData(i);
			participants.push(participantData);
		}

		return participants;
	}

	/**
	 * Find participant by name
	 */
	async findParticipantByName(name: string): Promise<number | null> {
		const count = await this.getParticipantCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getParticipantData(i);
			if (data.name.includes(name)) {
				return i;
			}
		}

		return null;
	}

	/**
	 * Find participant by nickname
	 */
	async findParticipantByNickname(nickname: string): Promise<number | null> {
		const count = await this.getParticipantCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getParticipantData(i);
			if (data.nickname.includes(nickname)) {
				return i;
			}
		}

		return null;
	}

	/**
	 * Get all participant names
	 */
	async getAllParticipantNames(): Promise<string[]> {
		const names: string[] = [];
		const count = await this.getParticipantCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getParticipantData(i);
			names.push(data.name.trim());
		}

		return names;
	}

	/**
	 * Get all participant nicknames
	 */
	async getAllParticipantNicknames(): Promise<string[]> {
		const nicknames: string[] = [];
		const count = await this.getParticipantCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getParticipantData(i);
			nicknames.push(data.nickname.trim());
		}

		return nicknames;
	}

	/**
	 * Check if participant has unreport action available
	 */
	async hasUnreportAction(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		const unreportAction = row.locator('a.action-icon--unreport');
		return await unreportAction.isVisible();
	}

	/**
	 * Check if participant has block action available
	 */
	async hasBlockAction(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		const blockAction = row.locator('a[title*="Block User"]');
		return await blockAction.isVisible();
	}

	/**
	 * Wait for table to load
	 */
	async waitForTableToLoad(): Promise<void> {
		await this.table.waitFor({ state: 'visible' });
	}

	/**
	 * Check if table is empty
	 */
	async isEmpty(): Promise<boolean> {
		return (await this.getParticipantCount()) === 0;
	}
}
