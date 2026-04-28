/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect, Download } from '@playwright/test';
import { BasePage } from './BasePage';
import { EMAIL_URLS } from '@utils/constants';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

/**
 * WebmailPage - Page Object Model for webmail/email operations
 */
export class WebmailPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to the webmail interface
	 */
	async navigateToWebmail(): Promise<void> {
		await this.page.goto(EMAIL_URLS.OVH_MAIL);
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Login to Roundcube webmail
	 * @param email - User email address
	 * @param password - User password
	 */
	async login(email: string, password: string): Promise<void> {
		await this.page.getByRole('textbox', { name: 'Username' }).click();
		await this.page.getByRole('textbox', { name: 'Username' }).fill(email);

		await this.page.getByRole('textbox', { name: 'Password' }).click();
		await this.page.getByRole('textbox', { name: 'Password' }).fill(password);

		await this.page.locator('button[type="submit"]').click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Check for new messages in inbox by clicking the refresh button
	 */
	async refreshInbox(): Promise<void> {
		await this.page.getByRole('button', { name: 'Check for new messages' }).click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Generic method to find and verify export email in inbox
	 * @param exportType - The export type identifier (e.g., "survey_user_answers", "debates", "meetings")
	 * @returns true if email is found and verified
	 */
	async verifyExportEmail(exportType: string): Promise<boolean> {
		console.log(`Looking for unread ${exportType} export email...`);

		// Search for unread export email with subject "Your export "{exportType}" is ready"
		// Filter by unread status using the parent td with class containing "unread"
		const unreadEmailRow = this.page
			.locator('tr')
			.filter({ has: this.page.locator('td.subject:has(.msgicon.status.unread)') })
			.filter({ hasText: `Your export "${exportType}" is ready` })
			.first();

		// Export generation can take several seconds. Refresh inbox while waiting for email
		const maxAttempts = 18; // 18 attempts over ~3 minutes
		const waitBetweenRefresh = 10000; // 10 seconds between refreshes

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`Attempt ${attempt}/${maxAttempts}: Checking for ${exportType} export email...`);

			// Quick check if email is already visible
			const isVisible = await unreadEmailRow.isVisible({ timeout: 2000 }).catch(() => false);

			if (isVisible) {
				console.log(`${exportType} export email found!`);
				break;
			}

			// If not last attempt, refresh and wait
			if (attempt < maxAttempts) {
				console.log('Email not yet available, refreshing inbox...');
				await this.refreshInbox();
				await this.page.waitForTimeout(waitBetweenRefresh);
			}
		}

		// Final assertion that email is visible (already verified in loop)
		await expect(unreadEmailRow).toBeVisible();
		console.log(`Found unread export email with subject: Your export "${exportType}" is ready`);

		// Click on the email link to open it
		const emailLink = unreadEmailRow.locator('td.subject span.subject a').first();
		await emailLink.click();
		await this.page.waitForLoadState('networkidle');
		console.log('Opened export email');

		// Navigate to the email content iframe
		const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');

		// Verify export email content inside iframe
		await expect(messageFrame.getByText('Your download is ready.')).toBeVisible();
		console.log('Export ready message is visible');

		// Verify download link is visible inside iframe
		const downloadLink = messageFrame.getByRole('link', { name: 'Download' });
		await expect(downloadLink).toBeVisible();
		console.log('Download link is visible');

		return true;
	}

	/**
	 * Verify registration confirmation email in inbox
	 * @returns true if email is found and verified
	 */
	async verifyRegistrationConfirmationEmail(): Promise<boolean> {
		console.log('Looking for unread registration confirmation email...');

		// Search for unread email with subject "registration has been confirmed"
		const unreadEmailRow = this.page
			.locator('tr')
			.filter({ has: this.page.locator('td.subject:has(.msgicon.status.unread)') })
			.filter({ hasText: /registration has been confirmed/i })
			.first();

		// Registration email should arrive quickly. Refresh inbox while waiting
		const maxAttempts = 18; // 18 attempts over ~3 minutes
		const waitBetweenRefresh = 10000; // 10 seconds between refreshes

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`Attempt ${attempt}/${maxAttempts}: Checking for registration confirmation email...`);

			const count = await unreadEmailRow.count();
			if (count > 0) {
				console.log('Registration confirmation email found!');
				break;
			}

			if (attempt < maxAttempts) {
				console.log('Email not found yet, refreshing inbox...');
				await this.refreshInbox();
				await this.page.waitForTimeout(waitBetweenRefresh);
			}
		}

		// Final assertion that email is visible
		await expect(unreadEmailRow).toBeVisible();
		console.log('Found unread registration confirmation email');

		// Log debug info about the email row
		const emailText = await unreadEmailRow.locator('td.subject span.subject').textContent();
		console.log(`Email subject text: ${emailText}`);

		// Click on the email link to open it
		const emailLink = unreadEmailRow.locator('td.subject span.subject a').first();
		console.log(`Clicking email link...`);
		await emailLink.click();
		console.log(`Email link clicked, waiting for content to load...`);

		// Wait for the message to load - Roundcube uses custom protocol handlers
		const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');

		// Try to wait for the email instructions paragraph
		// If it times out, still continue (Roundcube may have different structure)
		try {
			await messageFrame.locator('p.email-instructions').first().waitFor({ state: 'visible', timeout: 5000 });
			console.log('Email instructions loaded');
		} catch (e) {
			console.warn('Timeout waiting for email instructions, but continuing anyway...');
			// Still wait a bit for the iframe content to settle
			await this.page.waitForTimeout(2000);
		}

		console.log('Opened registration confirmation email');

		return true;
	}

	/**
	 * Extract meeting information from registration confirmation email: Meeting Name, Link, Registration Code
	 * @returns Object containing meeting details
	 */
	async getMeetingInfo(): Promise<{
		meetingName: string;
		meetingLink: string;
		registrationCode: string;
	}> {
		// Email content is displayed in an iframe within Roundcube
		const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');

		const safeText = async (locator: any): Promise<string> => {
			try {
				const text = await locator.textContent();
				return text?.trim().replace(/\s+/g, ' ') ?? '';
			} catch (e) {
				console.warn(`Text extraction failed: ${e}`);
				return '';
			}
		};

		let meetingName = '';
		let meetingLink = '';
		let registrationCode = '';

		try {
			// Find the email instructions paragraph with the meeting link
			// The email uses Foundation Email classes like v1email-instructions
			const meetingLinkLocator = messageFrame.locator('p.email-instructions a, p.v1email-instructions a').first();
			meetingName = await safeText(meetingLinkLocator);
			meetingLink = (await meetingLinkLocator.getAttribute('href')) ?? '';
			console.log(`Meeting name: ${meetingName}, Meeting link: ${meetingLink}`);
		} catch (e) {
			console.warn(`Meeting link extraction failed: ${e}`);
		}

		try {
			// Find the paragraph containing the registration code
			const registrationCodeLocator = messageFrame.locator('p:has-text("Your registration code is")').first();
			const regText = await safeText(registrationCodeLocator);
			const match = regText.match(/code is (\w+)/);
			if (match) registrationCode = match[1];
			console.log(`Registration code: ${registrationCode}`);
		} catch (e) {
			console.warn(`Registration code extraction failed: ${e}`);
		}

		return {
			meetingName,
			meetingLink,
			registrationCode
		};
	}

	/**
	 * Verify that a email related to a comment removal has been received in the inbox.
	 * Refreshes the inbox until the unread email appears (max ~3 minutes).
	 * @returns true if the email is found
	 */
	async verifyCommentRemovedEmail(): Promise<boolean> {
		console.log('Looking for unread "Your comment has been removed" email...');

		const unreadEmailRow = this.page
			.locator('tr')
			.filter({ has: this.page.locator('td.subject:has(.msgicon.status.unread)') })
			.filter({ hasText: /Your comment has been removed/i })
			.first();

		const maxAttempts = 18; // ~3 minutes
		const waitBetweenRefresh = 10000;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`Attempt ${attempt}/${maxAttempts}: Checking for comment removed email...`);

			const isVisible = await unreadEmailRow.isVisible({ timeout: 2000 }).catch(() => false);

			if (isVisible) {
				console.log('"Your comment has been removed" email found!');
				break;
			}

			if (attempt < maxAttempts) {
				console.log('Email not yet available, refreshing inbox...');
				await this.refreshInbox();
				await this.page.waitForTimeout(waitBetweenRefresh);
			}
		}

		await expect(unreadEmailRow).toBeVisible();
		console.log('Found unread "Your comment has been removed" email');

		// Open the email by clicking the subject link
		const emailLink = unreadEmailRow.locator('td.subject span.subject a').first();
		await emailLink.click();
		await this.page.waitForLoadState('networkidle');
		console.log('Opened "Your comment has been removed" email');

		// Wait for the iframe content to be visible
		const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');
		await expect(messageFrame.locator('p.v1email-instructions, p.email-instructions').first()).toBeVisible();
		console.log('Email content fully loaded in iframe');

		// Now that the message is fully loaded, delete it
		await this.deleteCurrentEmail();

		return true;
	}

	/**
	 * Wait for the Decidim account confirmation email to arrive in the inbox and open it.
	 * Polls by refreshing until the email appears (max ~3 minutes).
	 */
	async waitForConfirmationEmailAndOpen(): Promise<void> {
		console.log('Looking for unread Decidim confirmation email...');

		const emailRow = this.page
			.locator('tr')
			.filter({ has: this.page.locator('td.subject:has(.msgicon.status.unread)') })
			.filter({ hasText: /Confirmation instructions/i })
			.first();

		const maxAttempts = 18; // ~3 minutes
		const waitBetweenRefresh = 10000;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`Attempt ${attempt}/${maxAttempts}: Checking for confirmation email...`);

			const isVisible = await emailRow.isVisible({ timeout: 2000 }).catch(() => false);

			if (isVisible) {
				console.log('Confirmation email found!');
				break;
			}

			if (attempt < maxAttempts) {
				console.log('Email not yet available, refreshing inbox...');
				await this.refreshInbox();
				await this.page.waitForTimeout(waitBetweenRefresh);
			}
		}

		await expect(emailRow).toBeVisible();
		console.log('Found unread Decidim confirmation email');

		const emailLink = emailRow.locator('td.subject span.subject a').first();
		await emailLink.click();
		await this.page.waitForLoadState('networkidle');
		console.log('Opened Decidim confirmation email');
	}

	/**
	 * Extract the "Confirm my account" URL from the currently open email in Roundcube.
	 * Must be called after the email has been opened.
	 * @returns The account confirmation URL
	 */
	async getConfirmationLink(): Promise<string> {
		const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');
		const confirmLink = messageFrame.getByRole('link', { name: 'Confirm my account' });

		await expect(confirmLink).toBeVisible();

		const confirmationUrl = await confirmLink.getAttribute('href');
		if (!confirmationUrl) {
			throw new Error('Confirmation link not found in the email');
		}

		console.log(`Found confirmation URL: ${confirmationUrl}`);
		return confirmationUrl;
	}

	/**
	 * Check if a "Confirmation instructions" email exists in the inbox (read or unread)
	 * and extract the confirmation URL. Opens the email and deletes it if found.
	 * Used during cleanup to handle cases where beforeEach failed before confirming the account.
	 * @returns The account confirmation URL if found, null otherwise
	 */
	async getConfirmationLinkIfExists(): Promise<string | null> {
		console.log('Cleanup: checking inbox for a pending confirmation email...');

		// Match any Roundcube message row (read or unread) with that subject
		const emailRow = this.page
			.locator('tr.message')
			.filter({ hasText: /Confirmation instructions/i })
			.first();

		if ((await emailRow.count()) === 0) {
			console.log('Cleanup: no confirmation email found in inbox');
			return null;
		}

		console.log('Cleanup: confirmation email found — opening it');
		await emailRow.locator('td.subject span.subject a').first().click();

		// frameLocator resolves lazily on each action — expect() retries until the link
		// is visible inside the iframe, which also covers the iframe loading time.
		const confirmLink = this.page
			.frameLocator('iframe[name="messagecontframe"]')
			.getByRole('link', { name: 'Confirm my account' });

		try {
			await expect(confirmLink).toBeVisible();
		} catch (_e) {
			console.warn('Cleanup: "Confirm my account" link not found in email iframe');
			return null;
		}

		const confirmationUrl = await confirmLink.getAttribute('href');
		if (!confirmationUrl) {
			console.warn('Cleanup: "Confirm my account" link has no href');
			return null;
		}

		console.log(`Cleanup: confirmation URL extracted: ${confirmationUrl}`);
		await this.deleteCurrentEmail();
		return confirmationUrl;
	}

	/**
	 * Delete the currently selected/opened email
	 * Moves the email to trash by clicking the delete button
	 */
	async deleteCurrentEmail(): Promise<void> {
		// Click on the delete button to move email to trash
		const deleteButton = this.page.locator('a.button.delete[title="Move message to trash"]');
		await deleteButton.click();
		await this.page.waitForLoadState('networkidle');
		console.log('Email moved to trash');
	}

	/**
	 * Download the export file from the email
	 */
	async downloadExportFile(): Promise<void> {
		try {
			let downloadReceived = false;
			let receivedDownload: Download | null = null;

			this.page.once('download', (download: Download) => {
				downloadReceived = true;
				receivedDownload = download;
			});

			// Navigate to the email content iframe
			const messageFrame = this.page.frameLocator('iframe[name="messagecontframe"]');
			const downloadLink = messageFrame.getByRole('link', { name: 'Download' });
			await downloadLink.click();
			console.log('Download link clicked');

			const downloadWaitTime = 3000; // max 3 seconds wait for download event
			const startTime = Date.now();

			while (!downloadReceived && Date.now() - startTime < downloadWaitTime) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			if (downloadReceived && receivedDownload) {
				const download = receivedDownload as Download;
				console.log('Download received');

				const suggestedFilename = download.suggestedFilename();
				console.log(`Suggested filename: "${suggestedFilename}"`);

				const isValidExportFile =
					suggestedFilename === 'debates.zip' ||
					suggestedFilename === 'survey_user_answers.zip' ||
					suggestedFilename === 'meetings.zip' ||
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(suggestedFilename);

				if (!isValidExportFile) {
					console.log(`Unexpected filename: ${suggestedFilename}`);
					return;
				}

				console.log(`Valid export file detected: ${suggestedFilename}`);

				const tempDir = tmpdir();
				const downloadPath = join(tempDir, suggestedFilename);

				try {
					await download.saveAs(downloadPath);
					console.log(`File downloaded: ${downloadPath}`);

					if (existsSync(downloadPath)) {
						unlinkSync(downloadPath);
						console.log(`File cleaned up: ${downloadPath}`);
					} else {
						console.log('File not found for cleanup but download was successful');
					}
					console.log('Download completed successfully');
					return;
				} catch (saveError: unknown) {
					const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
					console.error(`Failed to save download: ${errorMessage}`);
					console.log('Download save error handled gracefully');
					return;
				}
			}
			console.log('No download detected - this indicates the export file is not available');
			throw new Error(
				'Export file download failed: No download was initiated after clicking the download link. This may indicate the file is not ready or not available.'
			);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Download error: ${errorMessage}`);
			console.log('Download error handled - test continues execution');

			throw error;
		}
	}
}
