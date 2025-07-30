import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Page } from '@playwright/test';

export class MeetingsPage extends AuthenticatedPage {
	private meetingsSection;
	private meetingCards;
	private seeAllWithdrawnMeetingsButton;

	constructor(page: Page) {
		super(page);
		this.meetingsSection = this.page.locator('#meetings');
		this.meetingCards = this.page.locator('.card__list-list .card__list');
		this.seeAllWithdrawnMeetingsButton = this.page.locator('a.button__text-secondary[href*="withdrawn"]');
	}

	// Methods

	/**
	 * Navigate to the meetings page
	 */
	async navigateToMeetingsPage(): Promise<void> {
		await this.page.goto('/processes/judge-transfer/f/5/meetings');
	}

	/**
	 * Verify that the user is on the meetings page
	 */
	async expectOnMeetingsPage(): Promise<void> {
		await expect(this.meetingsSection).toBeVisible();
	}

	/**
	 * Get the list of meeting cards
	 */
	async getMeetingCards(): Promise<string[]> {
		return await this.meetingCards.evaluateAll(elements => elements.map(el => el.textContent?.trim() || ''));
	}

	/**
	 * Click on the "See all withdrawn meetings" button
	 */
	async clickSeeAllWithdrawnMeetings(): Promise<void> {
		await this.seeAllWithdrawnMeetingsButton.click();
	}

	/**
	 * Click on a meeting card by index
	 * @param index - The index of the meeting card to click (0-based)
	 */
	async clickMeetingCardByIndex(index: number): Promise<void> {
		const meetingCard = this.meetingCards.nth(index);
		await meetingCard.click();
	}
}
