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

	constructor(page: Page) {
		super(page);

		this.newNewsletterButton = page.getByRole('link', { name: 'New newsletter' });
		this.newsletterTemplatesHeading = page.getByRole('heading', { name: 'Newsletter templates' });
		this.basicTemplateHeading = page.getByRole('heading', { name: 'Basic (only text) Preview Use' });
		this.imageTextCTATemplateHeading = page.getByRole('heading', { name: 'Image, text and Call To' });
		this.basicTemplateUseButton = page.locator('#basic_only_text').getByRole('link', { name: 'Use this template' });
		this.newNewsletterHeading = page.getByRole('heading', { name: 'New newsletter' });
		this.subjectTextbox = page.getByRole('textbox', { name: 'subject' });
		this.bodyTextbox = page.getByRole('textbox', { name: 'Body' });
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
	}

	// Helpers methods for dynamic locators
	newsletterRowBySubject(subject: string): Locator {
		return this.page.locator('tr').filter({ has: this.page.getByRole('link', { name: subject }) });
	}

	private async getPreviewFrame() {
		const iframe = this.page.locator('iframe[data-email-preview]');
		await expect(iframe).toBeVisible({ timeout: 5000 });
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
		await this.page.waitForLoadState('networkidle');
	}

	async selectBasicTemplate() {
		await this.basicTemplateUseButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async fillNewsletterForm(subject: string, body: string) {
		await this.subjectTextbox.fill(subject);
		await this.bodyTextbox.fill(body);
	}

	async saveNewsletter() {
		await this.saveButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickEditNewsletter() {
		await this.editButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async editNewsletterBody(newBody: string) {
		await this.bodyTextbox.fill(newBody);
	}

	async saveAndPreviewNewsletter() {
		await this.saveAndPreviewButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickSelectRecipients() {
		await this.selectRecipientsButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async selectSendToAllUsers() {
		await this.sendToAllUsersRadio.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickDeliverNewsletter() {
		await this.deliverNewsletterButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async confirmDelivery() {
		await this.confirmOKButton.click();
		await this.page.waitForLoadState('networkidle');
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
		const container = frame.locator('table.content th.small-12.first.columns').first();

		await expect(container).toBeVisible({ timeout: 30000 });

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
		const newsletterRow = this.newsletterRowBySubject(subject);
		await expect(newsletterRow.getByText('Has been sent to:')).toBeVisible();
		await expect(newsletterRow.getByText('All users')).toBeVisible();
	}

	async expectNewsletterDeliveryStarted(subject: string) {
		let attempts = 0;
		const maxAttempts = 20;
		const waitBetweenAttempts = 6000;

		while (attempts < maxAttempts) {
			if (attempts > 0) {
				console.log(`Refreshing page (attempt ${attempts})...`);
				await this.page.reload();
				await this.page.waitForLoadState('networkidle');
				await this.page.waitForTimeout(2000);
			}

			try {
				const newsletterRow = this.newsletterRowBySubject(subject);
				const progressCell = newsletterRow.locator('td').nth(4);

				const progressText = await progressCell.textContent();
				if (progressText) {
					const match = progressText.match(/(\d+)\s*\/\s*(\d+)/);
					if (match) {
						const completed = parseInt(match[1], 10);
						const total = parseInt(match[2], 10);

						console.log(`Newsletter delivery progress: ${completed}/${total}`);

						if (completed > 0 && total > 0) {
							console.log('Newsletter delivery has started!');
							return;
						}

						if (completed === 0) {
							console.log('Delivery not started yet, waiting...');
						}
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.log(`Error reading progress, retrying... Error: ${errorMessage}`);
			}

			attempts++;

			if (attempts < maxAttempts) {
				await this.page.waitForTimeout(waitBetweenAttempts);
			}
		}

		throw new Error(`Newsletter delivery did not start after ${maxAttempts} attempts`);
	}
}
