import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Page } from '@playwright/test';

export class MeetingDetailPage extends AuthenticatedPage {
	private meetingTitle;
	private meetingCalendarContainer;
	private meetingAddress;
	private meetingAuthor;
	private meetingDescription;
	private metadataContainer;

	constructor(page: Page) {
		super(page);
		this.meetingTitle = this.page.locator('h1.decorator');
		this.meetingCalendarContainer = this.page.locator('.meeting__calendar-container');
		this.meetingAddress = this.page.locator('.address__location');
		this.meetingAuthor = this.page.locator('.author__name');
		this.meetingDescription = this.page.locator('.rich-text-display');
		this.metadataContainer = this.page.locator('.metadata__container');
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
}
