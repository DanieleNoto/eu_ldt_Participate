import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { ShareCalendarModalComponent } from '@pages/components/common/ShareCalendarModalComponent';
import { ShareModalComponent } from '@pages/components/common/ShareModalComponent';
import { expect, Locator, Page } from '@playwright/test';

export class MeetingDetailPage extends AuthenticatedPage {
	private meetingTitle;
	private meetingCalendarContainer;
	private meetingAddress;
	private meetingAuthor;
	private meetingDescription;
	private shareButton;
	private calendarShareButton;
	private metadataContainer;
	public shareModalComponent: ShareModalComponent;
	public shareCalendarModalComponent: ShareCalendarModalComponent;
	readonly joinLink: Locator;
	readonly registerButton: Locator;
	readonly registrationCodeContainer: Locator;
	readonly registrationCodeValue: Locator;
	readonly registrationStatusLabel: Locator;
	readonly flashSuccess: Locator;
	readonly flashSuccessMessage: Locator;

	constructor(page: Page) {
		super(page);
		this.shareModalComponent = new ShareModalComponent(this.page);
		this.shareCalendarModalComponent = new ShareCalendarModalComponent(this.page);
		this.meetingTitle = this.page.locator('h1.decorator');
		this.meetingCalendarContainer = this.page.locator('.meeting__calendar-container');
		this.meetingAddress = this.page.locator('.address__location');
		this.meetingAuthor = this.page.locator('.author__name');
		this.meetingDescription = this.page.locator('.rich-text-display');
		this.shareButton = this.page.locator('button[data-dialog-open="socialShare"]');
		this.calendarShareButton = this.page.locator('a', { hasText: 'Add to calendar' });
		this.metadataContainer = this.page.locator('.metadata__container');
		this.joinLink = this.page.locator('a.button', { hasText: 'Join meeting' });
		this.registerButton = this.registerButton = this.page
			.locator('form.button_to >> button:has-text("Register"):visible')
			.first();
		this.registrationCodeContainer = this.page
			.locator('.meeting__aside-block__item:has(h3:has-text("Your registration code")):visible')
			.first();
		this.registrationCodeValue = this.registrationCodeContainer.locator('.meeting__aside-block__large');
		this.registrationStatusLabel = this.registrationCodeContainer.locator('.label.warning');
		this.flashSuccess = this.page.locator('div.flash.success[role="alert"]');
		this.flashSuccessMessage = this.flashSuccess.locator('.flash__message');
	}

	// Methods

	/**
	 * Verify that the user is on the meeting detail page
	 */
	async expectOnMeetingDetailPage(): Promise<void> {
		await expect(this.meetingTitle).toBeVisible();
		await expect(this.meetingCalendarContainer).toBeVisible();
		
	}

	/**
	 * Get the meeting title
	 */
	async getMeetingTitle(): Promise<string> {
		return (await this.meetingTitle.textContent()) || '';
	}

	/**
	 * Get the meeting address
	 */
	async getMeetingAddress(): Promise<string> {
		return (await this.meetingAddress.textContent()) || '';
	}

	/**
	 * Get the meeting author
	 */
	async getMeetingAuthor(): Promise<string> {
		return (await this.meetingAuthor.textContent()) || '';
	}

	/**
	 * Get the meeting description
	 */
	async getMeetingDescription(): Promise<string> {
		return (await this.meetingDescription.textContent()) || '';
	}

	/**
	 * Get metadata information
	 */
	async getMetadata(): Promise<string[]> {
		return await this.metadataContainer.evaluateAll(elements => elements.map(el => el.textContent?.trim() || ''));
	}

	async clickShareButton(): Promise<void> {
		await this.shareButton.click();
		await this.page.waitForLoadState('domcontentloaded');
	}
	async clickCalendarShareButton(): Promise<void> {
		await this.calendarShareButton.click();
		await this.page.waitForLoadState('domcontentloaded');
	}
	async expectJoinLinkVisible() {
		await expect(this.joinLink).toBeVisible();
	}

	async clickJoinMeetingButton(): Promise<void> {
		await this.joinLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async expectRegisterButtonVisible() {
		await expect(this.registerButton).toBeVisible();
	}

	async clickRegisterMeetingButton(): Promise<void> {
		await this.registerButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Assert the registration confirmation dialog is visible.
	// dialogId is the base id used in markup (example: 'meeting-registration-confirm-1').
	async expectRegistrationPromptVisible(dialogId = 'meeting-registration-confirm-1') {
		const dialogSelector = `#${dialogId}-content`;
		await this.page.waitForSelector(dialogSelector, { state: 'visible' });
		const dialog = this.page.locator(dialogSelector);
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('h2')).toHaveText(/Register/i);
	}

	// Confirm registration by clicking the Confirm button inside the dialog.
	// Waits for the submit to complete by awaiting networkidle.
	async confirmRegistration(dialogId = 'meeting-registration-confirm-1'): Promise<void> {
		const dialogSelector = `#${dialogId}-content`;
		const confirmButton = this.page.locator(`${dialogSelector} form button[type="submit"]:has-text("Confirm")`);
		await this.page.waitForSelector(dialogSelector, { state: 'visible' });
		await expect(confirmButton).toBeVisible();
		await expect(confirmButton).toBeEnabled();
		await Promise.all([this.page.waitForLoadState('networkidle').catch(() => null), confirmButton.click()]);
	}

	// Cancel registration by clicking the Cancel button inside the dialog.
	// Waits for the dialog to become hidden after the click.
	async abortRegistration(dialogId = 'meeting-registration-confirm-1'): Promise<void> {
		const dialogSelector = `#${dialogId}-content`;
		const cancelButton = this.page.locator(`${dialogSelector} button[data-dialog-close]:has-text("Cancel")`);
		await this.page.waitForSelector(dialogSelector, { state: 'visible' });
		await expect(cancelButton).toBeVisible();
		await expect(cancelButton).toBeEnabled();
		await Promise.all([
			this.page.waitForSelector(dialogSelector, { state: 'hidden' }).catch(() => null),
			cancelButton.click()
		]);
	}

	// // Assert that the registration code block is visible and contains a non-empty code.
	// // Returns the registration code text.
	async expectRegistrationCodeVisibleAndGet(): Promise<string> {
		await this.registrationCodeContainer.waitFor({ state: 'visible' });
		await expect(this.registrationCodeContainer).toBeVisible();
		await expect(this.registrationCodeValue).toBeVisible();
		const code = (await this.registrationCodeValue.textContent())?.trim() ?? '';
		if (!code) {
			const html = await this.registrationCodeContainer
				.evaluate(el => el.outerHTML)
				.catch(() => 'unable to read outerHTML');
			throw new Error(`Registration code is empty. Container snapshot: ${html}`);
		}
		return code;
	}

	// Optional: assert presence of the status label (e.g., VALIDATION PENDING)
	async expectRegistrationStatusVisible(expectedText?: string) {
		await expect(this.registrationStatusLabel).toBeVisible();
		if (expectedText) {
			await expect(this.registrationStatusLabel).toHaveText(expectedText);
		}
	}

	// Assert that the success flash appears and contains the expected confirmation message substring.
	async expectConfirmationMessageVisible(
		expectedSubstring = 'You have joined the meeting successfully.'
	): Promise<void> {
		await this.page.waitForSelector('div.flash.success[role="alert"]', { state: 'visible' });
		await expect(this.flashSuccess).toBeVisible();
		await expect(this.flashSuccessMessage).toContainText(expectedSubstring);
	}


	async CancelRegistration(): Promise<void> {
		const btn = this.page.getByRole('button', { name: 'Cancel your registration' });
		await expect(btn).toBeVisible();
		await expect(btn).toBeEnabled();
		await btn.click();
		const cancelDialog = this.page.locator('#meeting-cancelation-confirm-1-content');
		const confirmBtn = cancelDialog.locator('form button[type="submit"]');
		await expect(cancelDialog).toBeVisible({ timeout: 10000 });
		await expect(confirmBtn).toBeVisible();
		await expect(confirmBtn).toBeEnabled();
		await Promise.all([
		  confirmBtn.click(),
		  cancelDialog.waitFor({ state: 'hidden' }).catch(() => null),
		  this.page.waitForLoadState('networkidle').catch(() => null),
	]);
		await expect(cancelDialog).not.toBeVisible();
	}
 

	// Optional helper to dismiss the flash notification
	async dismissConfirmationMessage(): Promise<void> {
		const closeButton = this.flashSuccess.locator('button.close-button, button[data-close]');
		if (await closeButton.isVisible().catch(() => false)) {
			await closeButton.click();
			await this.page.waitForSelector('div.flash.success[role="alert"]', { state: 'hidden' }).catch(() => null);
		}
	}


	async expectMeetingFullMessageVisible(): Promise<void> {
	  // Disabled button with text "No slots available" — role-based and scoped to the body
	  	const disabledButton = this.page.getByRole('button', { name: 'No slots available', disabled: true }).first();
	  	await expect(disabledButton).toBeVisible();
	}



	async expectLinkToJoinMeetingNotYetAvailable() {
		await expect(this.page.locator('.meeting__online')).toBeVisible();
		await expect(this.page.locator('.meeting__online p')).toHaveText(
			'The link to join the meeting will be available a few minutes before it starts'
		);
	}

	// /**
	//  * Check which scenario you landed in after join
	//  */
	async verifyJoinMeetingResult(): Promise<{
		success: boolean;
		outcome: 'embed' | 'liveEvent' | 'newTab' | 'unknown';
	}> {
		let newPage: Page | null = null;
		try {
			newPage = await this.page.context().waitForEvent('page');
		} catch {
			newPage = null;
		}

		const targetPage = newPage ?? this.page;

		try {
			await targetPage.waitForLoadState('domcontentloaded');
		} catch {}

		const url = targetPage.url();

		// Case 1: Live Event
		if (url.includes('/meetings/') && url.includes('/live_event')) {
			await expect(targetPage).toHaveURL(/\/meetings\/\d+\/live_event/);
			return { success: true, outcome: 'liveEvent' };
		}

		// Case 2: Embed (only if a new tab has not been opened)
		if (!newPage) {
			const embedLocator = this.page.locator('div.css-1dtlqni-content h1.css-csavet-title');
			if ((await embedLocator.count()) > 0 && (await embedLocator.isVisible())) {
				await expect(embedLocator).toHaveText('Collegati alla riunione');
				const roomName = this.page.locator('span.css-1s4ok0o-roomName');
				await expect(roomName).toContainText('Decidim Meeting');
				return { success: true, outcome: 'embed' };
			}
		}

		// Case 3: New Jitsi tab
		if (url.includes('meet.jit.si')) {
			await expect(targetPage).toHaveURL(/https?:\/\/meet\.jit\.si\/.*/);
			return { success: true, outcome: 'newTab' };
		}

		// Fallback: href to meet.jit.si but no new tab
		try {
			const href = await this.joinLink.getAttribute('href');
			if (href && href.includes('meet.jit.si')) {
				return { success: true, outcome: 'newTab' };
			}
		} catch {}

		// No conditions met
		return { success: false, outcome: 'unknown' };
	}

	/**
	 * Waits for the meeting link to become available
	 * Refreshes the page every 5 minutes if the link is not yet available
	 *
	 * @param maxWaitMinutes maximum waiting time in minutes (default 60)
	 */
	async waitForJoinMeeting(maxWaitMinutes: number = 60): Promise<Locator> {
		const interval = 5 * 60 * 1000;
		const maxWait = maxWaitMinutes * 60 * 1000;
		const startTime = Date.now();

		while (true) {
			// Check if the link is present
			if ((await this.joinLink.count()) > 0) {
				return this.joinLink;
			}

			// Max Timeout
			if (Date.now() - startTime > maxWait) {
				throw new Error('Timeout: The Join Meeting link did not appear within the time limit.');
			}

			console.log('Join Meeting not yet available, update the page in 5 minutes...');
			await this.page.waitForTimeout(interval);
			await this.page.reload();
		}
	}

	async joinMeetingWhenAvailable(maxWaitMinutes: number = 60) {
		await this.waitForJoinMeeting(maxWaitMinutes);
		await this.clickJoinMeetingButton();
	}
}
