import { Page, expect, Locator } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * MeetingsPage - Page Object Model for the admin meetings management page.
 *
 * Extends BaseAdminPage and provides methods for managing meetings in the admin interface:
 * - Navigation to meetings section
 * - Creating new meetings
 * - Managing meeting actions (edit, duplicate, publish, unpublish)
 * - Page verification and meeting status checks
 *
 * Integrates AdminNavigationComponent and AdminTitleBarComponent from BaseAdminPage.
 */
export class MeetingsPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	// Selectors for the meetings page structure
	private get newMeetingButton() {
		return this.page.locator('a.button:has-text("New meeting")');
	}

	private get meetingsTable() {
		return this.page.locator('table.table-list');
	}

	private get tableRows() {
		return this.meetingsTable.locator('tbody tr');
	}

	private get publishButtons() {
		return this.page.locator('a[title="Publish"]:visible');
	}

	private get unpublishButtons() {
		return this.page.locator('a[title="Unpublish"]:visible');
	}

	private get editButtons() {
		return this.page.locator('a[title="Edit"]');
	}

	private get duplicateButtons() {
		return this.page.locator('a[title="Duplicate"]');
	}

	// Navigation methods
	async navigateToMeetings() {
		// Navigate directly to meetings URL since it's not in the main navigation
		const currentUrl = await this.getCurrentUrl();
		const baseUrl = currentUrl.split('/admin')[0];
		await this.page.goto(`${baseUrl}/admin/meetings`);
		await this.expectUrl(/\/admin.*\/meetings/);
	}

	async goToMeetingsPage() {
		await this.navigateToAdminDashboard();
		await this.navigateToMeetings();
	}

	// New meeting creation
	async clickNewMeeting() {
		await this.newMeetingButton.click();
		await this.expectUrl(/\/admin.*\/meetings\/new/);
	}

	// Action methods for meeting management
	async clickEdit(meetingIndex: number = 0) {
		const editButton = this.editButtons.nth(meetingIndex);
		await editButton.click();
		await this.expectUrl(/\/admin.*\/meetings\/\d+\/edit/);
	}

	async clickDuplicate(meetingIndex: number = 0) {
		const duplicateButton = this.duplicateButtons.nth(meetingIndex);
		await duplicateButton.click();
		await this.expectUrl(/\/admin.*\/meetings\/new/);
	}

	async clickPublish(meetingIndex: number = 0) {
		const publishButton = this.publishButtons.nth(meetingIndex);
		await publishButton.click();
		// Wait for the page to refresh or update after publish action
		await this.waitForLoadState('load');
	}

	async clickFirstPublish() {
		const firstPublishButton = this.page.locator('a[title="Publish"]:visible').first();
		await firstPublishButton.click();
		// Wait for the page to refresh or update after publish action
		await this.waitForLoadState('load');
	}

	async clickUnpublish(meetingIndex: number = 0) {
		const unpublishButton = this.unpublishButtons.nth(meetingIndex);
		await unpublishButton.click();
		// Wait for the page to refresh or update after unpublish action
		await this.waitForLoadState('load');
	}
	async clickFirstUnpublish() {
		const unpublishButton = this.page.locator('a[title="Unpublish"]:visible').first();
		await unpublishButton.click();
		// Wait for the page to refresh or update after unpublish action
		await this.waitForLoadState('load');
		const okButton = this.page.locator('button[data-confirm-ok]');
		await okButton.click();
		await this.waitForLoadState('load');
	}

	// Verification methods
	async isOnMeetingsPage(): Promise<boolean> {
		try {
			await expect(this.meetingsTable).toBeVisible();
			return true;
		} catch {
			return false;
		}
	}

	async verifyMeetingsPageVisible() {
		await expect(this.meetingsTable).toBeVisible();
		await expect(this.newMeetingButton).toBeVisible();
	}

	async hasMeetingToPublish(): Promise<boolean> {
		try {
			const publishButtonsCount = await this.publishButtons.count();
			return publishButtonsCount > 0;
		} catch {
			return false;
		}
	}

	async verifyMeetingToPublishExists() {
		await expect(this.publishButtons.first()).toBeVisible();
	}

	async hasMeetingToUnpublish(): Promise<boolean> {
		try {
			const unpublishButtonsCount = await this.unpublishButtons.count();
			return unpublishButtonsCount > 0;
		} catch {
			return false;
		}
	}

	async verifyMeetingToUnpublishExists() {
		await expect(this.unpublishButtons.first()).toBeVisible();
	}

	// Utility methods for meeting table interactions
	async getMeetingCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getMeetingTitle(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		// The title is always in the second column (index 1)
		const titleCell = row.locator('td').nth(1);
		const titleText = await titleCell.textContent();
		return titleText?.trim() || '';
	}

	async findMeetingByTitle(title: string): Promise<number> {
		const meetingCount = await this.getMeetingCount();
		let editableIndex = 0; // Counter for editable meetings only

		for (let i = 0; i < meetingCount; i++) {
			const row = this.tableRows.nth(i);
			const titleCell = row.locator('td').nth(1);

			// Check if this meeting is editable (has a link in the title cell)
			const titleLink = titleCell.locator('a');
			const hasLink = (await titleLink.count()) > 0;

			if (hasLink) {
				// For editable meetings, get the link text
				const linkText = await titleLink.textContent();
				if (linkText && linkText.includes(title)) {
					return editableIndex; // Return the relative index among editable meetings
				}
				editableIndex++; // Increment counter for editable meetings
			}
			// Skip non-editable meetings in the count
		}
		return -1; // Not found
	} // Helper method to check if a meeting is editable (has link in title)
	async isMeetingEditable(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		const titleCell = row.locator('td').nth(1);
		const titleLink = titleCell.locator('a');
		return (await titleLink.count()) > 0;
	}

	// Debug method to understand table structure
	async debugTableStructure(rowIndex: number = 0): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');
		const cellCount = await cells.count();

		console.log(`Table row ${rowIndex} has ${cellCount} cells:`);
		for (let i = 0; i < cellCount; i++) {
			const cell = cells.nth(i);
			const cellContent = await cell.textContent();
			const hasLinks = await cell.locator('a').count();
			const cellClass = (await cell.getAttribute('class')) || '';

			console.log(`  Cell ${i}: "${cellContent?.trim()}" (${hasLinks} links, class: "${cellClass}")`);

			// Show links in this cell if any
			if (hasLinks > 0) {
				for (let j = 0; j < hasLinks; j++) {
					const link = cell.locator('a').nth(j);
					const linkText = await link.textContent();
					const linkTitle = (await link.getAttribute('title')) || '';
					console.log(`    Link ${j}: "${linkText?.trim()}" (title: "${linkTitle}")`);
				}
			}
		}

		// Show if this meeting is editable
		const isEditable = await this.isMeetingEditable(rowIndex);
		console.log(`  Meeting ${rowIndex} is ${isEditable ? 'EDITABLE' : 'NOT editable'}`);
	}

	async getMeetingStatus(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const statusCell = row.locator('td').nth(1); // Assuming status is in second column
		return (await statusCell.textContent()) || '';
	}

	async waitForMeetingsLoad() {
		await this.meetingsTable.waitFor({ state: 'visible' });
		await this.waitForLoadState('load'); // Additional wait for content to load
	}

	async verifyPageTitle() {
		await expect(this.page).toHaveTitle(/Meetings/);
	}

	async searchMeeting(searchTerm: string) {
		const searchInput = this.page.locator('input[type="search"], input[placeholder*="Search"]');
		if (await searchInput.isVisible()) {
			await searchInput.fill(searchTerm);
			await this.page.keyboard.press('Enter');
			await this.waitForMeetingsLoad();
		}
	}

	// Action button verification methods
	async verifyEditButtonVisible(meetingIndex: number = 0) {
		await expect(this.editButtons.nth(meetingIndex)).toBeVisible();
	}

	async verifyDuplicateButtonVisible(meetingIndex: number = 0) {
		await expect(this.duplicateButtons.nth(meetingIndex)).toBeVisible();
	}

	async verifyPublishButtonVisible(meetingIndex: number = 0) {
		await expect(this.publishButtons.nth(meetingIndex)).toBeVisible();
	}

	async verifyUnpublishButtonVisible(meetingIndex: number = 0) {
		await expect(this.unpublishButtons.nth(meetingIndex)).toBeVisible();
	}

	// Bulk actions methods (if needed for future use)
	async getActionsForMeeting(meetingIndex: number) {
		const row = this.tableRows.nth(meetingIndex);
		const actionsCell = row.locator('.table-list__actions, td:last-child');
		return {
			edit: actionsCell.locator('a[title="Edit"]'),
			duplicate: actionsCell.locator('a[title="Duplicate"]'),
			publish: actionsCell.locator('a[title="Publish"]'),
			unpublish: actionsCell.locator('a[title="Unpublish"]')
		};
	}

	async verifyMeetingActionsAvailable(meetingIndex: number = 0) {
		const actions = await this.getActionsForMeeting(meetingIndex);

		// Verify at least edit action is always available
		await expect(actions.edit).toBeVisible();

		// Check if publish or unpublish is available (one should be visible)
		const hasPublish = await actions.publish.isVisible().catch(() => false);
		const hasUnpublish = await actions.unpublish.isVisible().catch(() => false);

		expect(hasPublish || hasUnpublish).toBeTruthy();
	}

	/**
	 * Counts how many meetings in the admin table are marked as "Closed = Yes".
	 * The method waits for the table to be visible, normalizes text, and tolerates missing data.
	 */
	async countClosedMeetings(): Promise<number> {
		// Wait for the table to be present and visible
		const table = this.page.locator('table.table-list');
		await expect(table).toBeVisible({});
		
		// Wait until at least one row is loaded
		const rows = table.locator('tbody tr');
		await expect(rows.first()).toBeVisible({});
		
		const rowCount = await rows.count();
		let closedCount = 0;
		
		for (let i = 0; i < rowCount; i++) {
		  const row = rows.nth(i);
		  // Find the cell that contains the "Closed" column dynamically
		  // by matching its header text, to avoid breaking if column order changes
		  const closedCell = await this.getCellByHeader(row, 'Closed');
		
		  const cellText = (await closedCell?.textContent())?.trim().toLowerCase() || '';
		  if (cellText === 'yes') {
		    closedCount++;
		  }
		}
	
		console.log(`Found ${closedCount} closed meetings out of ${rowCount}`);
		return closedCount;
	}

	/**
	 * Helper: find the correct cell in a row by header text.
	 * This makes the method robust against column reordering.
	 */
	private async getCellByHeader(row: Locator, headerName: string): Promise<Locator | null> {
		const table = this.page.locator('table.table-list');
		const headers = table.locator('thead th');
		const headerCount = await headers.count();
		for (let i = 0; i < headerCount; i++) {
			const headerText = (await headers.nth(i).textContent())?.trim().toLowerCase();
			if (headerText === headerName.toLowerCase()) {
			  return row.locator(`td:nth-child(${i + 1})`);
			}
		}
		console.warn(`Header "${headerName}" not found in table.`);
			return null;
	}
}
