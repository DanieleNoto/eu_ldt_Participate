/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect, type Locator } from '@playwright/test';
import { BaseAdminPage } from '../BaseAdminPage';

/**
 * NewsletterAdminPage - Page Object Model for the admin newsletter management.
 * Extends BaseAdminPage and provides methods for newsletter management.
 */
export class NewsletterAdminPage extends BaseAdminPage {
	readonly newNewsletterButton: Locator;
	readonly newsletterTemplatesHeading: Locator;
	readonly basicTemplateHeading: Locator;
	readonly imageTextCTATemplateHeading: Locator;
	readonly basicTemplateUseButton: Locator;
	readonly newNewsletterHeading: Locator;
	readonly subjectTextbox: Locator;
	readonly bodyTextbox: Locator;
	readonly saveButton: Locator;
	readonly previewHeading: Locator;
	readonly subjectValue: Locator;
	readonly editButton: Locator;
	readonly saveAndPreviewButton: Locator;
	readonly newsletterUpdatedMessage: Locator;
	readonly selectRecipientsButton: Locator;
	readonly selectRecipientsHeading: Locator;
	readonly sendGeneralNewsletterHeading: Locator;
	readonly sendToAllUsersRadio: Locator;
	readonly sendToVerifiedUsersRadio: Locator;
	readonly sendToParticipatorySpacesHeading: Locator;
	readonly sendToParticipantsCheckbox: Locator;
	readonly sendToFollowersCheckbox: Locator;
	readonly sendToPrivateMembersCheckbox: Locator;
	readonly deliverNewsletterButton: Locator;
	readonly confirmOKButton: Locator;
	readonly newsletterDeliveredMessage: Locator;
	readonly confirmRecipientsButton: Locator;
	readonly confirmRecipientsHeading: Locator;
	readonly recipientsTable: Locator;

	constructor(page: Page) {
		super(page);

		this.newNewsletterButton = page.getByRole('link', { name: 'New newsletter' });
		this.newsletterTemplatesHeading = page.getByRole('heading', { name: 'Newsletter templates' });
		this.basicTemplateHeading = page.getByRole('heading', { name: 'Basic (only text) Preview Use' });
		this.imageTextCTATemplateHeading = page.getByRole('heading', { name: 'Image, text and Call To' });
		this.basicTemplateUseButton = page.locator('#basic_only_text').getByRole('link', { name: 'Use this template' });
		this.newNewsletterHeading = page.getByRole('heading', { name: 'New newsletter' });
		this.subjectTextbox = page.getByRole('textbox', { name: 'subject' });
		this.bodyTextbox = page.locator('.tiptap.ProseMirror:visible');
		this.saveButton = page.getByRole('button', { name: 'Save' });
		this.previewHeading = page.getByRole('heading', { name: 'Preview' });
		this.subjectValue = page.locator('dl dt:has-text("Subject") + dd');
		this.editButton = page.getByRole('link', { name: 'Edit' });
		this.saveAndPreviewButton = page.getByRole('button', { name: 'Save and preview' });
		this.newsletterUpdatedMessage = page.getByText('Newsletter updated');
		this.selectRecipientsButton = page.getByRole('link', { name: 'Select recipients to deliver' });
		this.selectRecipientsHeading = page.getByRole('heading', { name: 'Select recipients to deliver' });
		this.sendGeneralNewsletterHeading = page.getByRole('heading', { name: 'Send general newsletter' });
		this.sendToAllUsersRadio = page.getByRole('radio', { name: 'Send to all users' });
		this.sendToVerifiedUsersRadio = page.getByRole('radio', { name: 'Send to verified users' });
		this.sendToParticipatorySpacesHeading = page.getByRole('heading', { name: 'Send newsletter to one or' });
		this.sendToParticipantsCheckbox = page.getByRole('checkbox', { name: 'Send to participants Required' });
		this.sendToFollowersCheckbox = page.getByRole('checkbox', { name: 'Send to followers Required' });
		this.sendToPrivateMembersCheckbox = page.getByRole('checkbox', { name: 'Send to private members' });
		this.deliverNewsletterButton = page.getByRole('button', { name: 'Deliver newsletter' });
		this.confirmOKButton = page.getByRole('button', { name: 'OK' });
		this.newsletterDeliveredMessage = page.getByText('Newsletter delivered');
		this.confirmRecipientsButton = page.getByRole('link', { name: 'Confirm recipients' });
		this.confirmRecipientsHeading = page.getByRole('heading', { name: 'Confirm recipients' });
		this.recipientsTable = page.locator('.table-list tbody');
	}

	// Helpers methods for dynamic locators
	newsletterRowBySubject(subject: string): Locator {
		return this.page.locator('tr').filter({ has: this.page.getByRole('link', { name: subject }) });
	}

	private async getPreviewFrame() {
		const iframe = this.page.locator('iframe[data-email-preview]');
		await expect(iframe).toBeVisible();
		const frame = await iframe.contentFrame();
		if (!frame) {
			throw new Error('Newsletter preview iframe not found');
		}
		return frame;
	}

	// Navigation methods
	async navigateToNewsletters() {
		await this.adminNavigation.navigateToNewsletters();
	}

	// Action methods
	async clickNewNewsletter() {
		await this.newNewsletterButton.click();
		await this.page.waitForLoadState('load');
	}

	async selectBasicTemplate() {
		await this.basicTemplateUseButton.click();
		await this.page.waitForLoadState('load');
	}

	async fillNewsletterForm(subject: string, body: string) {
		await this.subjectTextbox.fill(subject);

		// Click on the contenteditable div to focus it
		await this.bodyTextbox.click();
		// Clear any existing content
		await this.bodyTextbox.press('Control+A');
		// Type the body content
		await this.bodyTextbox.fill(body);
	}

	async saveNewsletter() {
		await this.saveButton.click();
		await this.page.waitForLoadState('load');
	}

	async clickEditNewsletter() {
		await this.editButton.click();
		await this.page.waitForLoadState('load');
	}

	async editNewsletterBody(newBody: string) {
		// Click on the contenteditable div to focus it
		await this.bodyTextbox.click();
		// Clear existing content
		await this.bodyTextbox.press('Control+A');
		// Type the new body content
		await this.bodyTextbox.fill(newBody);
	}

	async saveAndPreviewNewsletter() {
		await this.saveAndPreviewButton.click();
		await this.page.waitForLoadState('load');
	}

	async clickSelectRecipients() {
		await this.selectRecipientsButton.click();
		await this.page.waitForLoadState('load');
	}

	async selectSendToAllUsers() {
		await this.sendToAllUsersRadio.click();
		await this.page.waitForLoadState('load');
	}

	async selectSendToParticipants(processName?: string) {
		// Check the "Send to participants" checkbox
		await this.sendToParticipantsCheckbox.check();
		await this.page.waitForLoadState('load');

		// Click to open the participatory processes dropdown
		await this.page.locator('#participatory_processes-spaces-select-ts-control').click();

		// Wait for dropdown to be visible
		const dropdown = this.page.locator('#participatory_processes-spaces-select-ts-dropdown');
		await dropdown.waitFor({ state: 'visible' });

		if (processName) {
			// Use the search textbox to filter the process by name
			const searchBox = this.page.getByRole('textbox', { name: 'Choose participatory processes' });
			await searchBox.fill(processName);

			// Wait for dropdown filtering to complete
			await this.page.waitForTimeout(500);

			// Now click on the first visible option after filtering
			const filteredOption = dropdown.locator('.option:visible').first();
			await filteredOption.click();
		} else {
			// Default: select first available process (excluding "All")
			const firstProcessOption = dropdown.locator('.option[data-value]:not([data-value="all"])').first();
			await firstProcessOption.click();
		}

		await this.page.waitForLoadState('load');
	}

	async clickDeliverNewsletter() {
		await this.deliverNewsletterButton.click();
		await this.page.waitForLoadState('load');
	}

	async confirmDelivery() {
		await this.confirmOKButton.click();
		await this.page.waitForLoadState('load');
	}

	// Verification methods
	async expectToBeOnNewslettersPage() {
		await expect(this.page).toHaveURL(/.*\/admin\/newsletters/);
	}

	async expectNewNewsletterButtonToBeVisible() {
		await expect(this.newNewsletterButton).toBeVisible();
	}

	async expectNewsletterTemplatesDisplayed() {
		await expect(this.newsletterTemplatesHeading).toBeVisible();
		await expect(this.basicTemplateHeading).toBeVisible();
		await expect(this.imageTextCTATemplateHeading).toBeVisible();
	}

	async expectNewsletterFormToBeVisible() {
		await expect(this.newNewsletterHeading).toBeVisible();
		await expect(this.subjectTextbox).toBeVisible();
		await expect(this.bodyTextbox).toBeVisible();
	}

	async expectNewsletterPreviewHeadingToBeVisible() {
		await expect(this.previewHeading).toBeVisible();
	}

	async expectSubjectToHaveValue(expectedSubject: string) {
		await expect(this.subjectValue).toHaveText(expectedSubject);
	}

	async expectPreviewContentToMatchPattern(
		namePattern: string = '.*',
		contentPattern: string = 'this is a test newsletter!'
	) {
		const frame = await this.getPreviewFrame();
		const container = frame.locator('td[style*="padding: 40px 80px"] > div').first();

		await expect(container).toBeVisible();

		const expectedHelloPattern = `Hello ${namePattern},`;
		await expect(container).toContainText(new RegExp(expectedHelloPattern));
		await expect(container).toContainText(new RegExp(contentPattern));
	}

	async expectNewsletterUpdatedMessageToBeVisible() {
		await expect(this.newsletterUpdatedMessage).toBeVisible();
	}

	async expectRecipientOptionsToBeDisplayed() {
		await expect(this.selectRecipientsHeading).toBeVisible();
		await expect(this.sendGeneralNewsletterHeading).toBeVisible();
		await expect(this.sendToAllUsersRadio).toBeVisible();
		await expect(this.sendToVerifiedUsersRadio).toBeVisible();
		await expect(this.sendToParticipatorySpacesHeading).toBeVisible();
		await expect(this.sendToParticipantsCheckbox).toBeVisible();
		await expect(this.sendToFollowersCheckbox).toBeVisible();
		await expect(this.sendToPrivateMembersCheckbox).toBeVisible();
	}

	async expectNewsletterDeliveredMessageToBeVisible() {
		await expect(this.newsletterDeliveredMessage).toBeVisible();
	}

	async expectNewsletterSentToAllUsers(subject: string) {
		// Poll with page reloads until newsletter status is updated
		// SMTP delivery can be slow
		await expect(async () => {
			await this.page.reload();
			await this.page.waitForLoadState('load');

			const newsletterRow = this.newsletterRowBySubject(subject);
			const sentToCell = newsletterRow.locator('td').nth(3);

			await expect(sentToCell).toContainText('Has been sent to:');
			await expect(sentToCell).toContainText('All users');
		}).toPass({
			timeout: 120000, // 2 minutes total timeout for slow SMTP
			intervals: [3000, 5000, 10000] // Progressive wait intervals between retries
		});
	}

	async expectNewsletterSentToProcessParticipants(subject: string, processName: string) {
		const newsletterRow = this.newsletterRowBySubject(subject);
		await expect(newsletterRow).toBeVisible();

		// Check the "Sent to" column (4th column) contains process-specific texts
		const sentToCell = newsletterRow.locator('td').nth(3);
		await expect(sentToCell).toBeVisible();

		await expect(sentToCell).toContainText('Has been sent to:');
		await expect(sentToCell).toContainText('participants');

		await expect(sentToCell).toContainText('Segmented to Participatory processes:');
		await expect(sentToCell).toContainText(processName);
	}

	async expectNewsletterDeliveryStarted(subject: string) {
		// Initial wait to allow server-side newsletter delivery process to initialize
		await this.page.waitForTimeout(2000);

		// Retry loop with page reloads until delivery starts or timeout
		await expect(async () => {
			// Reload page to get fresh progress data from server
			await this.page.reload();
			await this.page.waitForLoadState('domcontentloaded');

			// Re-query DOM elements after reload
			const newsletterRow = this.newsletterRowBySubject(subject);
			const progressCell = newsletterRow.locator('td').nth(4);

			// Check if delivery has started (progress > 0)
			await expect(progressCell).not.toHaveText(/^\s*0\s*\/\s*\d+\s*$/);
			await expect(progressCell).toHaveText(/^\s*[1-9]\d*\s*\/\s*\d+\s*$/);

			console.log('Newsletter delivery has started!');
		}).toPass({
			timeout: 120000, // 2 minutes total timeout
			intervals: [3000, 5000, 10000] // Progressive wait intervals between retries
		});
	}

	async confirmRecipients() {
		await this.confirmRecipientsButton.click();
		await this.page.waitForLoadState('load');
	}

	async expectConfirmRecipientsPageToBeVisible() {
		await expect(this.confirmRecipientsHeading).toBeVisible();
		await expect(this.recipientsTable).toBeVisible();
	}

	async expectAtLeastOneRecipientToBeDisplayed() {
		// Verify that the recipients table exists and has at least one row
		await expect(this.recipientsTable).toBeVisible();

		// Check that there's at least one recipient row in the table
		const recipientRows = this.recipientsTable.locator('tr');

		// check count is greater than 0
		expect(await recipientRows.count()).toBeGreaterThan(0);

		console.log('At least one recipient found in the confirmation table');
	}

	/**
	 * Delete a newsletter by its subject
	 * @param subject - The subject of the newsletter to delete
	 */
	async deleteNewsletterBySubject(subject: string) {
		// Find the newsletter row by subject
		const newsletterRow = this.newsletterRowBySubject(subject);
		await expect(newsletterRow).toBeVisible();

		// Open the actions dropdown
		const actionsButton = newsletterRow.locator('button[data-controller="dropdown"]');
		await actionsButton.click();

		// Find and click the Delete link inside the dropdown
		const deleteLink = newsletterRow.locator('a.dropdown__button--danger');
		await deleteLink.click();

		// Wait for the custom confirm modal and click OK
		const okButton = this.page.locator('button[data-confirm-ok]');
		await okButton.waitFor();
		await okButton.click();

		// Wait for the page to reload after deletion
		await this.page.waitForLoadState('load');
		console.log(`Newsletter "${subject}" deleted successfully`);
	}
}
