import { Locator, Page, expect } from '@playwright/test';
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
////////////////////////////////////////
interface SimpleValidationError {
  message: string;
  fieldName: string | null;
  fieldLabel: string | null;
  fieldSelector: string | null;
}
///////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////
	async getValidationErrorsDetailed(): Promise<SimpleValidationError[]> {
	  const errorLocator = this.page.locator('.form-error[role="alert"]:visible, small.form-error.is-visible');
	  const count = await errorLocator.count();
	  const results: SimpleValidationError[] = [];	
	  for (let i = 0; i < count; i++) {
	    const msgNode = errorLocator.nth(i);
	    if (!(await msgNode.isVisible())) continue;	
	    const raw = (await msgNode.innerText()) ?? '';
	    const message = raw.replace(/\s+/g, ' ').trim();	
	    let inputLocator: Locator | null = null;	
	   //1) aria-describedby association
	    const id = await msgNode.getAttribute('id');
	    if (id) {
	      const inputs = this.page.locator(
	        `input[aria-describedby~="${id}"]:not([type="hidden"]),textarea[aria-describedby~="${id}"],select[aria-describedby~="${id}"]`
	      );
	      if (await inputs.count() > 0) inputLocator = inputs.first();
	    }	
	   //2) fallback: nearest input in same form-group
	    if (!inputLocator) {
	      const container = msgNode.locator(
	        'xpath=ancestor::*[contains(@class,"form-group") or contains(@class,"field") or contains(@class,"form-row")][1]'
	      );
	      if (await container.count() > 0) {
	        const inside = container.locator('input:not([type="hidden"]), textarea, select');
	        if (await inside.count() > 0) inputLocator = inside.first();
	      }
	    }	
	   //3) fallback: preceding input
	    if (!inputLocator) {
	      const preceding = msgNode.locator(
	        'xpath=preceding::input[not(@type="hidden")][1] | preceding::textarea[1] | preceding::select[1]'
	      );
	      if (await preceding.count() > 0) inputLocator = preceding.first();
	    }	
	   //4) NEW fallback: sibling inside same wrapper (case: <small> + <div class="field_with_errors"><input...>)
	    if (!inputLocator) {
	    const siblingInput = msgNode.locator('xpath=following-sibling::div[contains(@class,"field_with_errors")]input[not(@type="hidden")]');
	      if (await siblingInput.count() > 0) inputLocator = siblingInput.first();
	    }	
	   //Extract field info
	    let fieldName: string | null = null;
	    let fieldSelector: string | null = null;
	    let fieldLabel: string | null = null;
	    let inputId: string | null = null;	
	    if (inputLocator) {
	      inputId = await inputLocator.getAttribute('id');
	      fieldName = (await inputLocator.getAttribute('name')) || inputId || null;	
	      if (inputId) {
	        fieldSelector = `#${inputId}`;
	      } else if (fieldName) {
	        fieldSelector = `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`;
	      }	
	    //Find label
	      if (inputId) {
	        const forLabel = this.page.locator(`label[for="${inputId}"]`);
	        if (await forLabel.count() > 0) {
	          fieldLabel = (await forLabel.first().innerText()).trim();
	        }
	      }
	      if (!fieldLabel) {
	        const ancLabel = inputLocator.locator('xpath=ancestor::label[1]');
	        if (await ancLabel.count() > 0) {
	          fieldLabel = (await ancLabel.first().innerText()).trim();
	        }
	      }
	      if (!fieldLabel) {
	        const ariaLabelledBy = (await inputLocator.getAttribute('aria-labelledby')) || '';
	        const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
	        if (ids.length) {
	          const node = this.page.locator(`#${ids[0]}`);
	          if (await node.count() > 0) {
	            fieldLabel = (await node.first().innerText()).trim();
	          }
	        }
	      }
	    }	
	    results.push({
	      message,
	      fieldName,
	      fieldLabel,
	      fieldSelector,
	    });
	  }	
	  return results;
	}
}
