/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EMAIL_URLS } from '@utils/constants';

/**
 * TempWebmailPage - Page Object Model for temporary webmail operations
 */
export class TempWebmailPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to temporary webmail inbox for a specific email address
	 * @param email - Full email address
	 */
	async navigateToTempInbox(email: string): Promise<void> {
		const emailPrefix = email.split('@')[0];
		await this.page.goto(EMAIL_URLS.MAILINATOR_INBOX(emailPrefix));
	}

	/**
	 * Wait for at least one email to arrive in the inbox with retry mechanism
	 * Checks for existing emails first before starting reload loop
	 * @param timeoutMs - Maximum time to wait in milliseconds
	 */
	async waitForEmailToArrive(timeoutMs: number = 180000): Promise<void> {
		const emailRows = this.page.locator('table.table-striped tbody tr');

		// First check: see if email is already present
		const initialCount = await emailRows.count();
		if (initialCount > 0) {
			console.log(`Email already present! Found ${initialCount} email(s) in inbox.`);
			return;
		}

		console.log('No emails found yet. Starting polling...');

		// If not present, start polling with reload
		await expect(async () => {
			// Reload page to get latest emails
			await this.page.reload({ waitUntil: 'networkidle' });
			console.log('Refreshing inbox to check for new emails');

			// Check if at least one email is present
			await expect(emailRows.first()).toBeVisible();

			const count = await emailRows.count();
			console.log(`Email arrived! Found ${count} email(s) in inbox.`);
		}).toPass({
			timeout: timeoutMs,
			intervals: [5000] // Retry every 5 seconds
		});
	}

	/**
	 * Click on the confirmation email
	 */
	async clickConfirmationEmail(): Promise<void> {
		// Find the email row that contains the confirmation subject
		const confirmationEmail = this.page
			.locator('table.table-striped tbody tr')
			.filter({ hasText: 'Confirmation instructions' })
			.first();

		await confirmationEmail.click();
	}

	/**
	 * Click on the invitation email
	 */
	async clickInvitationEmail(): Promise<void> {
		// Find the email row that contains the specific invitation subject
		const invitationEmail = this.page
			.locator('table.table-striped tbody tr')
			.filter({
				hasText: 'You have been invited to a private participatory process on EU LDT Toolbox Participate'
			})
			.first();

		await invitationEmail.click();
	}

	/**
	 * Verify invitation email content and navigate to invitation acceptance page
	 * @param userName - The name of the invited user to verify in greeting
	 */
	async verifyInvitationEmailAndAccept(userName: string): Promise<void> {
		// Switch to iframe context
		const iframe = this.page.frameLocator('iframe#html_msg_body');

		// Verify the greeting message contains the user name
		const greetingLocator = iframe.locator('p.email-greeting');
		await expect(greetingLocator).toContainText(`Hello ${userName}`);
		console.log(`Verified invitation email greeting for user: ${userName}`);

		// Get the "Accept invitation" link URL
		const acceptLink = iframe.locator('a:has-text("Accept invitation")');
		const invitationUrl = await acceptLink.getAttribute('href');

		if (!invitationUrl) {
			throw new Error('Accept invitation link not found or has no href attribute');
		}

		console.log(`Found invitation URL: ${invitationUrl}`);

		// Navigate directly to the invitation URL
		await this.page.goto(invitationUrl);
	}

	/**
	 * Get the confirmation URL from the "Confirm my account" link
	 * @returns The confirmation URL
	 */
	async getConfirmationLink(): Promise<string> {
		// Switch to iframe context
		const iframe = this.page.frameLocator('iframe#html_msg_body');

		// Get the "Confirm my account" link URL using getByRole for consistency with LetterOpenerPage
		const confirmLink = iframe.getByRole('link', { name: 'Confirm my account' });

		await expect(confirmLink).toBeVisible();
		const confirmationUrl = await confirmLink.getAttribute('href');

		if (!confirmationUrl) {
			throw new Error('Confirmation URL not found in email');
		}

		console.log(`Found confirmation URL: ${confirmationUrl}`);

		return confirmationUrl;
	}
}
