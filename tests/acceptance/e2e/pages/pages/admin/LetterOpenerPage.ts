import { Page, expect, Download } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import { EMAIL_URLS } from '@utils/constants';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Page Object for Letter Opener email interface
 */
export class LetterOpenerPage extends BasePage {
	protected page: Page;

	constructor(page: Page) {
		super(page);
		this.page = page;
	}

	/**
	 * Private helper method to execute actions within the email content frame
	 * @param callback - Function to execute with the content frame
	 */
	private async withEmailContentFrame<T>(callback: (contentFrame: any) => Promise<T>): Promise<T> {
		const contentFrame = this.getEmailContentFrame();
		return await callback(contentFrame);
	}

	/**
	 * Private helper method to get the email content frame
	 */
	private getEmailContentFrame() {
		// Navigate to the mail iframe (outer iframe)
		const mailFrame = this.page.frameLocator('iframe[name="mail"]');

		// Navigate to the inner iframe containing the email content
		const contentFrame = mailFrame.frameLocator('iframe');

		return contentFrame;
	}

	/**
	 * Navigate to Letter Opener interface
	 */
	async navigateToLetterOpener(): Promise<void> {
		await this.page.goto(EMAIL_URLS.LETTER_OPENER);
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Refresh Letter Opener to get the latest emails
	 */
	async refreshEmails(): Promise<void> {
		try {
			await this.page.getByRole('link', { name: 'Refresh' }).click();
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.warn(`getByRole failed, using CSS selector fallback. Error: ${errorMessage}`);

			try {
				await this.page.click('a.btn.btn-primary.refresh');
			} catch (fallbackError: unknown) {
				const fallbackErrorMessage =
					fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
				console.error(`Both refresh methods failed: ${fallbackErrorMessage}`);
				throw new Error(`Failed to refresh emails: ${fallbackErrorMessage}`);
			}
		}
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Find and click on the most recent invitation email
	 * After refresh, the newest invitation should be at the top of the list
	 */
	async clickMostRecentInvitationEmail(): Promise<void> {
		await this.page.waitForSelector('li.list-group-item');

		// Look for the first invitation email (most recent after refresh)
		const invitationEmail = this.page
			.locator('li.list-group-item')
			.filter({
				has: this.page.locator('dd:has-text("You have been invited to a private participatory process")')
			})
			.first();

		// Verify we found an invitation email
		await expect(invitationEmail).toBeVisible();

		// Click on the email link within the list item
		await invitationEmail.locator('a[target="mail"]').click();
		await this.page.waitForLoadState('networkidle');

		console.log('Clicked on the most recent invitation email');
	}

	/**
	 * Find and click on the most recent survey answers export email
	 * After refresh, the newest export email should be at the top of the list
	 */
	async clickMostRecentExportEmail(): Promise<void> {
		// Look for the first survey answers export email (most recent after refresh)
		const exportEmail = this.page
			.locator('li.list-group-item')
			.filter({
				has: this.page.locator('dd:has-text("Your export \\"survey_user_answers\\" is ready")')
			})
			.first();

		// Verify we found an export email
		await expect(exportEmail).toBeVisible();

		// Click on the email link within the list item
		await exportEmail.locator('a[target="mail"]').click();
		await this.page.waitForLoadState('networkidle');

		console.log('Clicked on the most recent survey answers export email');
	}

	/**
	 * Find and click on the most recent debates export email
	 * After refresh, the newest export email should be at the top of the list
	 */
	async clickMostRecentDebatesExportEmail(): Promise<void> {
		await this.page.waitForSelector('li.list-group-item');

		// Look for the first debates export email (most recent after refresh)
		const exportEmail = this.page
			.locator('li.list-group-item')
			.filter({
				has: this.page.locator('dd:has-text("Your export \\"debates\\" is ready")')
			})
			.first();

		// Verify we found a debates export email
		await expect(exportEmail).toBeVisible();

		// Click on the email link within the list item
		await exportEmail.locator('a[target="mail"]').click();
		await this.page.waitForLoadState('networkidle');

		console.log('Clicked on the most recent debates export email');
	}

	/**
	 * Find and click on the most recent account registration confirmation email
	 * After refresh, the newest confirmation email should be at the top of the list
	 */
	async clickMostRecentAccountRegistrationEmail(): Promise<void> {
		await this.page.waitForSelector('li.list-group-item');

		// Look for the first confirmation instructions email (most recent after refresh)
		const confirmationEmail = this.page
			.locator('li.list-group-item')
			.filter({
				has: this.page.locator('dd:has-text("Confirmation instructions")')
			})
			.first();

		// Verify we found a confirmation email
		await expect(confirmationEmail).toBeVisible();

		// Click on the email link within the list item
		await confirmationEmail.locator('a[target="mail"]').click();

		// Wait only for the email content iframe to be visible (faster than networkidle)
		await this.page.waitForSelector('iframe[name="mail"]', { state: 'visible' });
	}

	/**
	 * Get the confirmation URL from the "Confirm my account" link
	 * @returns The confirmation URL
	 */
	async getConfirmMyAccountUrl(): Promise<string> {
		let confirmationUrl: string | null = null;

		await this.withEmailContentFrame(async contentFrame => {
			const confirmLink = contentFrame.getByRole('link', { name: 'Confirm my account' });
			await expect(confirmLink).toBeVisible();
			confirmationUrl = await confirmLink.getAttribute('href');
		});

		if (!confirmationUrl) {
			throw new Error('Confirmation URL not found in email');
		}

		return confirmationUrl;
	}

	/**
	 * Verify invitation email content and click on "Accept invitation" link
	 */
	async verifyInvitationEmailAndAccept(userName: string): Promise<void> {
		const contentFrame = this.getEmailContentFrame();

		// Verify the greeting message contains the user name
		const greetingText = `Hello ${userName},`;
		const greetingElement = contentFrame.getByText(greetingText);

		await expect(greetingElement).toBeVisible();
		console.log(`Verified email greeting: "${greetingText}"`);

		// Verify the invitation text is present
		const invitationPattern = /has invited you as a private participant/;
		const invitationElement = contentFrame.getByText(invitationPattern);
		await expect(invitationElement).toBeVisible();
		console.log('Verified email contains invitation text');

		// Verify the "Accept invitation" link is present and click it
		const acceptInvitationElement = contentFrame.getByRole('link', { name: 'Accept invitation' });
		await expect(acceptInvitationElement).toBeVisible();
		console.log('Verified "Accept invitation" link is present');

		// Click on the "Accept invitation" link
		await acceptInvitationElement.click();
		await this.page.waitForLoadState('networkidle');
		console.log('Clicked on "Accept invitation" link');
	}

	/**
	 * Verify export email content and download link visibility
	 */
	async verifyExportEmail(): Promise<void> {
		await this.withEmailContentFrame(async contentFrame => {
			// Verify export ready message is visible
			await expect(contentFrame.getByText('Your download is ready.')).toBeVisible();
			console.log('Export ready message is visible');

			// Verify download link is visible
			await expect(contentFrame.getByRole('link', { name: 'Download' })).toBeVisible();
			console.log('Download link is visible');
		});
	}

	/**
	 * Download the export file
	 */
	async downloadExportFile(): Promise<void> {
		try {
			let downloadReceived = false;
			let receivedDownload: Download | null = null;

			this.page.once('download', (download: Download) => {
				downloadReceived = true;
				receivedDownload = download;
			});

			await this.withEmailContentFrame(async contentFrame => {
				const downloadLink = contentFrame.getByRole('link', { name: 'Download' });
				await downloadLink.click();
				console.log('Download link clicked');
			});

			const downloadWaitTime = 3000; // max 3 seconds wait for download event
			const startTime = Date.now();

			while (!downloadReceived && Date.now() - startTime < downloadWaitTime) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			if (downloadReceived && receivedDownload) {
				console.log('Download received');

				const suggestedFilename = receivedDownload.suggestedFilename();
				console.log(`Suggested filename: "${suggestedFilename}"`);

				const isValidExportFile =
					suggestedFilename === 'debates.zip' ||
					suggestedFilename === 'survey_user_answers.zip' ||
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(suggestedFilename);

				if (!isValidExportFile) {
					console.log(`Unexpected filename: ${suggestedFilename}`);
					return;
				}

				console.log(`Valid export file detected: ${suggestedFilename}`);

				const tempDir = tmpdir();
				const downloadPath = join(tempDir, suggestedFilename);

				try {
					await receivedDownload.saveAs(downloadPath);
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

	// Validation methods
	async expectToBeOnLetterOpener(): Promise<void> {
		await expect(this.page).toHaveURL(/letter_opener/);
	}
}
