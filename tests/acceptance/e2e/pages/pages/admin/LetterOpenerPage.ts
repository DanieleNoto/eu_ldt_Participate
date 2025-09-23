import { Page, expect } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import { EMAIL_URLS } from '@utils/constants';

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
		} catch (error) {
			// Fallback to CSS selector if getByRole fails
			await this.page.click('a.btn.btn-primary.refresh');
		}
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Find and click on the most recent invitation email
	 * After refresh, the newest invitation should be at the top of the list
	 */
	async clickMostRecentInvitationEmail(): Promise<void> {
		await this.page.waitForSelector('li.list-group-item', { timeout: 10000 });

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
	 * Verify invitation email content and click on "Accept invitation" link
	 */
	async verifyInvitationEmailAndAccept(userName: string): Promise<void> {
		// Navigate to the mail iframe (outer iframe)
		const mailFrame = this.page.frameLocator('iframe[name="mail"]');

		// Navigate to the inner iframe containing the email content
		const contentFrame = mailFrame.frameLocator('iframe');

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

	// Validation methods
	async expectToBeOnLetterOpener(): Promise<void> {
		await expect(this.page).toHaveURL(/letter_opener/);
	}
}
